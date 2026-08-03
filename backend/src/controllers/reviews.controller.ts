import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { query } from "../config/db";

const isUuid = (val: any) =>
  typeof val === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

// ─── POST /api/v1/reviews ─────────────────────────────────────
// ─── POST /api/v1/reviews ─────────────────────────────────────
// Submit review, feedback, and query for a completed booking
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  // Ensure schema columns exist
  try {
    await query(`
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id UUID;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_id TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_email TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS feedback TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS query TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS admin_reply TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS overall_experience INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS stylist_skill INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS staff_behaviour INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS cleanliness_hygiene INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS value_for_money INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
  } catch (e) {}

  let user = (req as any).user;
  if (!user && req.headers.authorization) {
    try {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        const decoded = jwt.verify(parts[1], process.env.JWT_SECRET || "fallback_secret") as any;
        if (decoded?.id || decoded?.email) {
          user = decoded;
        }
      }
    } catch (e) {}
  }

  const {
    bookingId,
    booking_id,
    salonId,
    salon_id,
    rating,
    review,
    comment,
    feedback,
    query: customerQuery,
    is_anonymous,
    isAnonymous,
    image_url,
    imageUrl,
    overall_experience,
    stylist_skill,
    staff_behaviour,
    cleanliness_hygiene,
    value_for_money,
  } = req.body;

  const targetBookingId = (bookingId || booking_id || "").toString().trim();
  const reviewText = (review || comment || "").toString().trim();
  const feedbackText = (feedback || "").toString().trim();
  const queryText = (customerQuery || "").toString().trim();
  const anonymousFlag = Boolean(is_anonymous || isAnonymous);
  const imgUrl = (image_url || imageUrl || "").toString().trim();

  // 1. Validation: Rating & Review text
  const numRating = Number(rating);
  if (!numRating || isNaN(numRating) || numRating < 1 || numRating > 5) {
    res.status(400).json({ success: false, message: "Please select a star rating between 1 and 5 stars." });
    return;
  }

  if (!reviewText) {
    res.status(400).json({ success: false, message: "Please write your review text." });
    return;
  }

  if (!targetBookingId) {
    res.status(400).json({ success: false, message: "Booking ID is required." });
    return;
  }

  // 2. Fetch booking details to verify existence, status, ownership & status = 'completed'
  let bookingRes;
  try {
    bookingRes = await query(
      `SELECT id, salon_id, user_id, customer_name, customer_email, booking_status, is_reviewed, hairstyle
       FROM public.bookings
       WHERE id::text = $1 LIMIT 1`,
      [targetBookingId]
    );
  } catch (e) {
    bookingRes = { rows: [] };
  }

  if (!bookingRes.rows || bookingRes.rows.length === 0) {
    res.status(404).json({ success: false, message: "Booking not found." });
    return;
  }

  const booking = bookingRes.rows[0];
  const bStatus = (booking.booking_status || "").toString().toLowerCase();

  // Validation: Only Completed bookings can be reviewed
  if (bStatus !== "completed") {
    res.status(400).json({
      success: false,
      message: `Only completed bookings can be reviewed. Current booking status is '${booking.booking_status}'.`,
    });
    return;
  }

  // Validation: Ownership check (if user is authenticated)
  if (user) {
    const userEmail = (user.email || "").toLowerCase().trim();
    const bEmail = (booking.customer_email || "").toLowerCase().trim();
    const bUserId = (booking.user_id || "").toString().trim();
    const uId = (user.id || "").toString().trim();

    if (bEmail && userEmail && bEmail !== userEmail && bUserId && uId && bUserId !== uId) {
      res.status(403).json({ success: false, message: "You can only review your own bookings." });
      return;
    }
  }

  // Validation: Prevent duplicate review submission
  if (booking.is_reviewed) {
    res.status(400).json({ success: false, message: "A review has already been submitted for this booking." });
    return;
  }

  // Check if review record already exists for this booking ID
  try {
    const existingRev = await query(
      "SELECT id FROM public.reviews WHERE booking_id::text = $1 LIMIT 1",
      [targetBookingId]
    );
    if (existingRev.rows.length > 0) {
      await query("UPDATE public.bookings SET is_reviewed = true WHERE id::text = $1", [targetBookingId]);
      res.status(400).json({ success: false, message: "A review has already been submitted for this booking." });
      return;
    }
  } catch (e) {}

  // 3. Resolve target Salon ID
  let finalSalonId = booking.salon_id || salonId || salon_id || null;
  if (finalSalonId && !isUuid(finalSalonId)) {
    try {
      const sRes = await query("SELECT id FROM public.salons WHERE id::text = $1 LIMIT 1", [finalSalonId]);
      if (sRes.rows[0]?.id) finalSalonId = sRes.rows[0].id;
    } catch (e) {}
  }

  if (!finalSalonId) {
    try {
      const firstSalon = await query("SELECT id FROM public.salons ORDER BY created_at ASC LIMIT 1");
      finalSalonId = firstSalon.rows[0]?.id || null;
    } catch (e) {}
  }

  const customerName = (user?.name || booking.customer_name || "Valued Customer").trim();
  const customerEmail = (user?.email || booking.customer_email || "").trim();
  const rawCustomerId = user?.id ? String(user.id) : booking.user_id ? String(booking.user_id) : null;
  const customerId = rawCustomerId && isUuid(rawCustomerId) ? rawCustomerId : null;

  const overallExp = Math.min(5, Math.max(1, Number(overall_experience || numRating || 5)));
  const stylistSk = Math.min(5, Math.max(1, Number(stylist_skill || numRating || 5)));
  const staffBeh = Math.min(5, Math.max(1, Number(staff_behaviour || numRating || 5)));
  const cleanliness = Math.min(5, Math.max(1, Number(cleanliness_hygiene || numRating || 5)));
  const valueMoney = Math.min(5, Math.max(1, Number(value_for_money || numRating || 5)));

  // 4. Insert Review Record safely
  let createdReview;
  try {
    const insertQ = `
      INSERT INTO public.reviews (
        salon_id, booking_id, customer_id, customer_email, user_name,
        rating, review, comment, feedback, query,
        status, is_anonymous, image_url,
        overall_experience, stylist_skill, staff_behaviour, cleanliness_hygiene, value_for_money,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      RETURNING *
    `;

    const newReviewResult = await query(insertQ, [
      finalSalonId,
      targetBookingId,
      customerId,
      customerEmail || null,
      customerName,
      Math.round(numRating),
      reviewText,
      reviewText,
      feedbackText || null,
      queryText || null,
      "Pending",
      anonymousFlag,
      imgUrl || null,
      overallExp,
      stylistSk,
      staffBeh,
      cleanliness,
      valueMoney,
    ]);

    createdReview = newReviewResult.rows[0];
  } catch (err: any) {
    console.error("Error inserting review into public.reviews:", err);
    // Fallback insertion with minimal fields if extended columns cause issue
    const fallbackQ = `
      INSERT INTO public.reviews (salon_id, booking_id, user_name, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const fallbackRes = await query(fallbackQ, [
      finalSalonId,
      targetBookingId,
      customerName,
      Math.round(numRating),
      reviewText,
    ]);
    createdReview = fallbackRes.rows[0];
  }

  // 5. Update Booking is_reviewed = true
  await query("UPDATE public.bookings SET is_reviewed = true WHERE id::text = $1", [targetBookingId]);

  // 6. Update Salon Average Rating
  if (finalSalonId) {
    try {
      const avgRes = await query(
        "SELECT ROUND(AVG(rating)::numeric, 1) as avg_rating FROM public.reviews WHERE salon_id::text = $1::text",
        [finalSalonId]
      );
      if (avgRes.rows[0]?.avg_rating) {
        await query("UPDATE public.salons SET rating = $1 WHERE id::text = $2::text", [
          parseFloat(avgRes.rows[0].avg_rating),
          finalSalonId,
        ]);
      }
    } catch (e) {}
  }

  // 7. Create Notification for Salon Admin
  if (finalSalonId) {
    try {
      const displayName = anonymousFlag ? "Anonymous Customer" : customerName;
      await query(
        `INSERT INTO public.notifications (
          salon_id, booking_id, customer_id, type, title, message, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          finalSalonId,
          targetBookingId,
          customerId ? parseInt(customerId, 10) || null : null,
          "NEW_REVIEW",
          "New Customer Review & Feedback",
          `${displayName} submitted a ${numRating}-star review for booking service ${booking.hairstyle || ""}.`,
        ]
      );
    } catch (e) {}
  }

  res.status(201).json({
    success: true,
    message: "Thank you! Your review and feedback have been submitted successfully.",
    data: createdReview,
  });
});

// ─── GET /api/v1/reviews/my ───────────────────────────────────
// Return logged-in customer's reviews
export const getMyReviews = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userEmail = (user?.email || "").trim().toLowerCase();
  const userId = user?.id ? String(user.id) : "";

  if (!userEmail && !userId) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }

  try {
    const result = await query(
      `SELECT 
        r.id,
        r.booking_id,
        r.salon_id,
        r.rating,
        COALESCE(r.review, r.comment) as review,
        r.comment,
        r.feedback,
        r.query,
        COALESCE(r.admin_reply, r.reply) as admin_reply,
        COALESCE(r.admin_reply, r.reply) as reply,
        r.status,
        r.is_anonymous,
        r.image_url,
        r.overall_experience,
        r.stylist_skill,
        r.staff_behaviour,
        r.cleanliness_hygiene,
        r.value_for_money,
        r.created_at,
        r.updated_at,
        s.name as salon_name,
        s.image as salon_image,
        s.city as salon_city
       FROM public.reviews r
       LEFT JOIN public.salons s ON s.id::text = r.salon_id::text
       WHERE (
         LOWER(TRIM(COALESCE(r.customer_email, ''))) = $1
         OR ($2 != '' AND r.customer_id::text = $2)
       )
       ORDER BY r.created_at DESC`,
      [userEmail, userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    console.error("Error fetching customer reviews:", err);
    res.json({ success: true, data: [] });
  }
});

// ─── GET /api/v1/reviews/salon/:salonId ───────────────────────
// Return public salon reviews with summary statistics
export const getSalonReviews = asyncHandler(async (req: Request, res: Response) => {
  const { salonId } = req.params;
  const search = (req.query.search as string) || "";
  const ratingFilter = Number(req.query.rating) || 0;
  const sort = (req.query.sort as string) || "latest";
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  try {
    // 1. Fetch Summary Statistics
    const statsResult = await query(
      `SELECT 
        COUNT(*)::int as total_reviews,
        COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0) as average_rating,
        COUNT(*) FILTER (WHERE Math.round(rating) = 5)::int as five_star,
        COUNT(*) FILTER (WHERE Math.round(rating) = 4)::int as four_star,
        COUNT(*) FILTER (WHERE Math.round(rating) = 3)::int as three_star,
        COUNT(*) FILTER (WHERE Math.round(rating) = 2)::int as two_star,
        COUNT(*) FILTER (WHERE Math.round(rating) = 1)::int as one_star,
        COALESCE(ROUND(AVG(overall_experience)::numeric, 1), 5.0) as avg_overall,
        COALESCE(ROUND(AVG(stylist_skill)::numeric, 1), 5.0) as avg_stylist,
        COALESCE(ROUND(AVG(staff_behaviour)::numeric, 1), 5.0) as avg_staff,
        COALESCE(ROUND(AVG(cleanliness_hygiene)::numeric, 1), 5.0) as avg_hygiene,
        COALESCE(ROUND(AVG(value_for_money)::numeric, 1), 5.0) as avg_value
       FROM public.reviews
       WHERE salon_id::text = $1::text`,
      [salonId]
    );

    const stats = statsResult.rows[0] || {
      total_reviews: 0,
      average_rating: 5.0,
      five_star: 0,
      four_star: 0,
      three_star: 0,
      two_star: 0,
      one_star: 0,
      avg_overall: 5.0,
      avg_stylist: 5.0,
      avg_staff: 5.0,
      avg_hygiene: 5.0,
      avg_value: 5.0,
    };

    // Fix Math.round in postgres if missing
    let orderClause = "ORDER BY created_at DESC";
    if (sort === "oldest") orderClause = "ORDER BY created_at ASC";
    if (sort === "highest") orderClause = "ORDER BY rating DESC, created_at DESC";
    if (sort === "lowest") orderClause = "ORDER BY rating ASC, created_at DESC";

    const whereConditions: string[] = ["salon_id::text = $1::text"];
    const queryParams: any[] = [salonId];

    if (ratingFilter > 0 && ratingFilter <= 5) {
      queryParams.push(ratingFilter);
      whereConditions.push(`rating = $${queryParams.length}`);
    }

    if (search.trim()) {
      queryParams.push(`%${search.trim().toLowerCase()}%`);
      whereConditions.push(
        `(LOWER(COALESCE(review, comment, '')) LIKE $${queryParams.length} OR LOWER(COALESCE(user_name, '')) LIKE $${queryParams.length})`
      );
    }

    const whereSql = whereConditions.join(" AND ");

    const listQuery = `
      SELECT 
        id,
        salon_id,
        booking_id,
        CASE WHEN is_anonymous = true THEN 'Anonymous Customer' ELSE COALESCE(NULLIF(user_name, ''), 'Valued Customer') END as user_name,
        CASE WHEN is_anonymous = true THEN 'Anonymous Customer' ELSE COALESCE(NULLIF(user_name, ''), 'Valued Customer') END as customer_name,
        rating,
        COALESCE(review, comment) as review,
        comment,
        feedback,
        query,
        COALESCE(admin_reply, reply) as admin_reply,
        COALESCE(admin_reply, reply) as reply,
        status,
        is_anonymous,
        image_url,
        overall_experience,
        stylist_skill,
        staff_behaviour,
        cleanliness_hygiene,
        value_for_money,
        created_at,
        updated_at
       FROM public.reviews
       WHERE ${whereSql}
       ${orderClause}
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(limit, offset);
    const reviewsResult = await query(listQuery, queryParams);

    const totalCount = Number(stats.total_reviews) || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    res.json({
      success: true,
      summary: {
        averageRating: parseFloat(stats.average_rating) || 5.0,
        totalReviews: totalCount,
        distribution: {
          5: Number(stats.five_star) || 0,
          4: Number(stats.four_star) || 0,
          3: Number(stats.three_star) || 0,
          2: Number(stats.two_star) || 0,
          1: Number(stats.one_star) || 0,
        },
        categoryAverages: {
          overall: parseFloat(stats.avg_overall) || 5.0,
          stylist: parseFloat(stats.avg_stylist) || 5.0,
          staff: parseFloat(stats.avg_staff) || 5.0,
          hygiene: parseFloat(stats.avg_hygiene) || 5.0,
          value: parseFloat(stats.avg_value) || 5.0,
        },
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      data: reviewsResult.rows,
    });
  } catch (err: any) {
    console.error("Error in getSalonReviews:", err);
    res.json({
      success: true,
      summary: {
        averageRating: 5.0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        categoryAverages: { overall: 5.0, stylist: 5.0, staff: 5.0, hygiene: 5.0, value: 5.0 },
      },
      pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 1 },
      data: [],
    });
  }
});
