import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { query } from "../config/db";

// ─── Dashboard Stats ─────────────────────────────────────────
export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;

    if (!salon_id) {
      res.status(403).json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    // Total bookings & revenue (all time)
    const totalResult = await query(
      `SELECT 
        COUNT(*) as total_bookings, 
        COALESCE(SUM(total_price) FILTER (WHERE booking_status != 'cancelled'), 0) as total_revenue 
       FROM public.bookings 
       WHERE salon_id = $1`,
      [salon_id],
    );

    // Today's stats
    const todayResult = await query(
      `SELECT 
        COUNT(*) as today_bookings,
        COALESCE(SUM(total_price) FILTER (WHERE booking_status != 'cancelled'), 0) as today_revenue
       FROM public.bookings 
       WHERE salon_id = $1 AND (appointment_date = CURRENT_DATE OR booking_date = CURRENT_DATE)`,
      [salon_id],
    );

    // Monthly revenue (current month)
    const monthlyResult = await query(
      `SELECT COALESCE(SUM(total_price) FILTER (WHERE booking_status != 'cancelled'), 0) as monthly_revenue
       FROM public.bookings 
       WHERE salon_id = $1 
         AND DATE_TRUNC('month', COALESCE(booking_date, appointment_date)) = DATE_TRUNC('month', CURRENT_DATE)`,
      [salon_id],
    );

    // Pending appointments (confirmed, future date)
    const pendingResult = await query(
      `SELECT COUNT(*) as pending_bookings 
       FROM public.bookings 
       WHERE salon_id = $1 AND booking_status = 'confirmed' 
         AND COALESCE(appointment_date, booking_date) >= CURRENT_DATE`,
      [salon_id],
    );

    // Unique customer count
    const customerResult = await query(
      `SELECT COUNT(DISTINCT customer_email) as customer_count 
       FROM public.bookings WHERE salon_id = $1`,
      [salon_id],
    );

    // Average rating
    const ratingResult = await query(
      `SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as avg_rating, COUNT(*) as review_count
       FROM public.reviews WHERE salon_id = $1`,
      [salon_id],
    );

    // Monthly revenue trend (last 6 months)
    const trendResult = await query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('month', COALESCE(booking_date, appointment_date)), 'Mon YY') as month,
        COALESCE(SUM(total_price) FILTER (WHERE booking_status != 'cancelled'), 0) as revenue,
        COUNT(*) as bookings
       FROM public.bookings 
       WHERE salon_id = $1 
         AND COALESCE(booking_date, appointment_date) >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', COALESCE(booking_date, appointment_date))
       ORDER BY DATE_TRUNC('month', COALESCE(booking_date, appointment_date)) ASC`,
      [salon_id],
    );

    // Recent bookings (last 10)
    const recentResult = await query(
      `SELECT id, customer_name, customer_email, hairstyle, booking_status, 
              total_price, booking_date, appointment_date, booking_time, appointment_time, stylist
       FROM public.bookings 
       WHERE salon_id = $1 
       ORDER BY created_at DESC LIMIT 10`,
      [salon_id],
    );

    const stats = totalResult.rows[0];
    const today = todayResult.rows[0];
    const monthly = monthlyResult.rows[0];
    const pending = pendingResult.rows[0];
    const customers = customerResult.rows[0];
    const rating = ratingResult.rows[0];

    res.json({
      success: true,
      data: {
        total_bookings: parseInt(stats.total_bookings, 10),
        total_revenue: parseFloat(stats.total_revenue),
        today_bookings: parseInt(today.today_bookings, 10),
        today_revenue: parseFloat(today.today_revenue),
        monthly_revenue: parseFloat(monthly.monthly_revenue),
        pending_bookings: parseInt(pending.pending_bookings, 10),
        customer_count: parseInt(customers.customer_count, 10),
        avg_rating: parseFloat(rating.avg_rating),
        review_count: parseInt(rating.review_count, 10),
        // Keep old key for backward compat
        today_appointments: parseInt(today.today_bookings, 10),
        monthly_trend: trendResult.rows.map(r => ({
          month: r.month,
          revenue: parseFloat(r.revenue),
          bookings: parseInt(r.bookings, 10),
        })),
        recent_bookings: recentResult.rows,
      },
    });
  },
);


// ─── Services ────────────────────────────────────────────────
export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;

  if (!salon_id) {
    res
      .status(403)
      .json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  const result = await query(
    "SELECT * FROM public.services WHERE salon_id = $1 ORDER BY name ASC",
    [salon_id],
  );

  const mappedData = result.rows.map((row: any) => ({
    ...row,
    originalPrice: row.original_price ?? row.price,
    discountedPrice: row.discounted_price ?? row.price,
    homeServiceAvailable: row.home_service_available ?? false,
    homeServicePrice: row.home_service_price ?? null,
  }));

  res.json({ success: true, data: mappedData });
});

  export const createService = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { name, price, originalPrice, discountedPrice, duration, homeServiceAvailable, homeServicePrice } = req.body;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const finalOriginalPrice = originalPrice !== undefined ? originalPrice : price;
    const finalDiscountedPrice = discountedPrice !== undefined ? discountedPrice : price;
    const finalPrice = finalDiscountedPrice !== undefined ? finalDiscountedPrice : price;

    if (!name || finalPrice === undefined || !duration) {
      res
        .status(400)
        .json({ message: "Name, price, and duration are required." });
      return;
    }

    const result = await query(
      "INSERT INTO public.services (salon_id, name, price, original_price, discounted_price, duration, home_service_available, home_service_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [salon_id, name, finalPrice, finalOriginalPrice, finalDiscountedPrice, duration, homeServiceAvailable || false, homeServicePrice || null],
    );

    const row = result.rows[0];
    const mappedRow = {
      ...row,
      originalPrice: row.original_price ?? row.price,
      discountedPrice: row.discounted_price ?? row.price,
      homeServiceAvailable: row.home_service_available ?? false,
      homeServicePrice: row.home_service_price ?? null,
    };

    res.status(201).json({ success: true, data: mappedRow });
  },
);

  export const updateService = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { id } = req.params;
    const { name, price, originalPrice, discountedPrice, duration, homeServiceAvailable, homeServicePrice } = req.body;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    // Ensure service belongs to this salon
    const checkResult = await query(
      "SELECT salon_id FROM public.services WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: "Service not found" });
      return;
    }
    if (checkResult.rows[0].salon_id !== salon_id) {
      res
        .status(403)
        .json({ message: "Forbidden: Service belongs to another salon" });
      return;
    }

    const finalOriginalPrice = originalPrice !== undefined ? originalPrice : price;
    const finalDiscountedPrice = discountedPrice !== undefined ? discountedPrice : price;
    const finalPrice = finalDiscountedPrice !== undefined ? finalDiscountedPrice : price;

    const result = await query(
      "UPDATE public.services SET name = $1, price = $2, original_price = $3, discounted_price = $4, duration = $5, home_service_available = $6, home_service_price = $7 WHERE id = $8 RETURNING *",
      [name, finalPrice, finalOriginalPrice, finalDiscountedPrice, duration, homeServiceAvailable !== undefined ? homeServiceAvailable : false, homeServicePrice || null, id],
    );

    const row = result.rows[0];
    const mappedRow = {
      ...row,
      originalPrice: row.original_price ?? row.price,
      discountedPrice: row.discounted_price ?? row.price,
      homeServiceAvailable: row.home_service_available ?? false,
      homeServicePrice: row.home_service_price ?? null,
    };

    res.json({ success: true, data: mappedRow });
  },
);

export const deleteService = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { id } = req.params;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const checkResult = await query(
      "SELECT salon_id FROM public.services WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: "Service not found" });
      return;
    }
    if (checkResult.rows[0].salon_id !== salon_id) {
      res
        .status(403)
        .json({ message: "Forbidden: Service belongs to another salon" });
      return;
    }

    await query("DELETE FROM public.services WHERE id = $1", [id]);
    res.json({ success: true, message: "Service deleted" });
  },
);

// ─── Team ────────────────────────────────────────────────────
export const getTeam = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;

  if (!salon_id) {
    res
      .status(403)
      .json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  const result = await query(
    "SELECT * FROM public.team_members WHERE salon_id = $1 ORDER BY name ASC",
    [salon_id],
  );

  res.json({ success: true, data: result.rows });
});

export const createTeamMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { name, role, experience, image_url, availability, service_ids } =
      req.body;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    if (!name || !role) {
      res.status(400).json({ message: "Name and role are required." });
      return;
    }

    const result = await query(
      "INSERT INTO public.team_members (salon_id, name, role, experience, image_url, availability, service_ids) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        salon_id,
        name,
        role,
        experience,
        image_url,
        availability ? JSON.stringify(availability) : null,
        Array.isArray(service_ids) ? service_ids : [],
      ],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  },
);

export const updateTeamMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { id } = req.params;
    const { name, role, experience, image_url, availability, service_ids } =
      req.body;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const checkResult = await query(
      "SELECT salon_id FROM public.team_members WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: "Team member not found" });
      return;
    }
    if (checkResult.rows[0].salon_id !== salon_id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const result = await query(
      "UPDATE public.team_members SET name = $1, role = $2, experience = $3, image_url = $4, availability = $5, service_ids = $6 WHERE id = $7 RETURNING *",
      [
        name,
        role,
        experience,
        image_url,
        availability ? JSON.stringify(availability) : null,
        Array.isArray(service_ids) ? service_ids : [],
        id,
      ],
    );

    res.json({ success: true, data: result.rows[0] });
  },
);

export const deleteTeamMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { id } = req.params;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const checkResult = await query(
      "SELECT salon_id FROM public.team_members WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: "Team member not found" });
      return;
    }
    if (checkResult.rows[0].salon_id !== salon_id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await query("DELETE FROM public.team_members WHERE id = $1", [id]);
    res.json({ success: true, message: "Team member deleted" });
  },
);

// ─── Salon Profile ───────────────────────────────────────────
export const getSalonProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const result = await query("SELECT * FROM public.salons WHERE id = $1", [
      salon_id,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Salon not found" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  },
);

export const createSalonProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id: userId } = user || {};

    const {
      name,
      city,
      starting_price,
      rating,
      latitude,
      longitude,
      address,
      state,
      country,
      phone,
      email,
      google_maps_link,
      image,
    } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!name || !city || starting_price === undefined) {
      res
        .status(400)
        .json({ message: "Name, city, and starting_price are required." });
      return;
    }

    const insertResult = await query(
      "INSERT INTO public.salons (name, address, city, state, country, image, starting_price, rating, latitude, longitude, phone, email, google_maps_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
      [
        name,
        address || null,
        city,
        state || null,
        country || null,
        image ||
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
        starting_price,
        rating ?? null,
        latitude ?? null,
        longitude ?? null,
        phone || null,
        email || null,
        google_maps_link || null,
      ],
    );

    const newSalon = insertResult.rows[0];

    await query("UPDATE public.users SET salon_id = $1 WHERE id = $2", [
      newSalon.id,
      userId,
    ]);

    res.status(201).json({ success: true, data: newSalon });
  },
);

export const updateSalonProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const {
      name,
      address,
      city,
      state,
      country,
      image,
      starting_price,
      rating,
      latitude,
      longitude,
      phone,
      email,
      google_maps_link,
      video,
      home_service_charge,
      about,
      gallery,
      working_hours,
      opening_time,
      closing_time,
      slot_interval,
    } = req.body;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    await query(`
      ALTER TABLE public.salons
        ADD COLUMN IF NOT EXISTS working_hours JSONB,
        ADD COLUMN IF NOT EXISTS slot_interval INT DEFAULT 30;
    `);

    const parsedInterval = parseInt(String(slot_interval || 30), 10) || 30;

    let finalWorkingHours = working_hours;
    if (!finalWorkingHours && (opening_time || closing_time)) {
      finalWorkingHours = {
        open: opening_time || "09:00 AM",
        close: closing_time || "08:00 PM",
        slot_interval: parsedInterval,
      };
    } else if (finalWorkingHours && typeof finalWorkingHours === "object") {
      finalWorkingHours.slot_interval = parsedInterval;
    }

    // Fetch current salon data to preserve video/image if undefined in request body
    const existingSalonRes = await query("SELECT video, image FROM public.salons WHERE id = $1", [salon_id]);
    const existingVideo = existingSalonRes.rows[0]?.video || null;
    const existingImage = existingSalonRes.rows[0]?.image || null;
    const finalVideo = video !== undefined ? (video || null) : existingVideo;
    const finalImage = image !== undefined ? (image || null) : existingImage;

    const result = await query(
      "UPDATE public.salons SET name = $1, address = $2, city = $3, state = $4, country = $5, starting_price = $6, rating = $7, latitude = $8, longitude = $9, phone = $10, email = $11, google_maps_link = $12, image = $13, video = $14, home_service_charge = $15, about = $16, gallery = $17, working_hours = COALESCE($18::jsonb, working_hours), slot_interval = $19 WHERE id = $20 RETURNING *",
      [
        name,
        address || null,
        city,
        state || null,
        country || null,
        starting_price,
        rating ?? null,
        latitude ?? null,
        longitude ?? null,
        phone || null,
        email || null,
        google_maps_link || null,
        finalImage,
        finalVideo,
        home_service_charge !== undefined ? home_service_charge : 0,
        about || null,
        gallery || null,
        finalWorkingHours ? JSON.stringify(finalWorkingHours) : null,
        parsedInterval,
        salon_id,
      ],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Salon not found" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  },
);

// ─── Superadmin Salon Management ─────────────────────────────
export const createSuperAdminSalon = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      address,
      city,
      state,
      country,
      image,
      starting_price,
      rating,
      latitude,
      longitude,
      phone,
      email,
      google_maps_link,
    } = req.body;

    if (!name || !city || starting_price === undefined) {
      res
        .status(400)
        .json({ message: "Name, city, and starting_price are required." });
      return;
    }

    const result = await query(
      "INSERT INTO public.salons (name, address, city, state, country, image, starting_price, rating, latitude, longitude, phone, email, google_maps_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
      [
        name,
        address || null,
        city,
        state || null,
        country || null,
        image ||
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
        starting_price,
        rating ?? null,
        latitude ?? null,
        longitude ?? null,
        phone || null,
        email || null,
        google_maps_link || null,
      ],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  },
);

export const updateSuperAdminSalon = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      name,
      address,
      city,
      state,
      country,
      image,
      starting_price,
      rating,
      latitude,
      longitude,
      phone,
      email,
      google_maps_link,
    } = req.body;

    const result = await query(
      "UPDATE public.salons SET name = $1, address = $2, city = $3, state = $4, country = $5, image = $6, starting_price = $7, rating = $8, latitude = $9, longitude = $10, phone = $11, email = $12, google_maps_link = $13 WHERE id = $14 RETURNING *",
      [
        name,
        address || null,
        city,
        state || null,
        country || null,
        image ||
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
        starting_price,
        rating ?? null,
        latitude ?? null,
        longitude ?? null,
        phone || null,
        email || null,
        google_maps_link || null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Salon not found" });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  },
);

export const deleteSuperAdminSalon = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await query(
      "DELETE FROM public.salons WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: "Salon not found" });
      return;
    }
    res.json({ success: true, message: "Salon deleted successfully" });
  },
);

import bcrypt from "bcryptjs";

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized user." });
      return;
    }

    if (!oldPassword || !newPassword) {
      res.status(400).json({ message: "Old password and new password are required." });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ message: "New password must be at least 8 characters long." });
      return;
    }

    if (oldPassword === newPassword) {
      res.status(400).json({ message: "New password must be different from the old password." });
      return;
    }

    // Fetch user from DB
    const userResult = await query("SELECT id, password FROM public.users WHERE id = $1 LIMIT 1", [userId]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const user = userResult.rows[0];

    // Check if old password matches
    if (!user.password) {
      res.status(400).json({ message: "No password set for this user." });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Old password does not match our records." });
      return;
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await query("UPDATE public.users SET password = $1 WHERE id = $2", [hashedPassword, userId]);

    res.json({ success: true, message: "Password updated successfully" });
  },
);

