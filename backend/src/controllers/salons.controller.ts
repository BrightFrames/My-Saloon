import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { SalonsService } from "../services/salons.service";
import { query } from "../config/db";
import { ApiError } from "../exceptions/ApiError";

export class SalonsController {
  private salonsService: SalonsService;

  constructor() {
    this.salonsService = new SalonsService();
  }

  /**
   * @route   GET /api/v1/salons
   * @desc    Get all salons (with optional filtering)
   */
  public getSalons = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const city = req.query.city ? String(req.query.city) : undefined;
    const lat = req.query.lat ? parseFloat(String(req.query.lat)) : undefined;
    const lon = req.query.lon ? parseFloat(String(req.query.lon)) : undefined;
    const radius = req.query.radius
      ? parseFloat(String(req.query.radius))
      : undefined;
    const keyword = req.query.q ? String(req.query.q) : undefined;
    const name = req.query.name ? String(req.query.name) : undefined;
    const rating = req.query.rating
      ? parseFloat(String(req.query.rating))
      : undefined;
    const service = req.query.service ? String(req.query.service) : undefined;
    const maxPrice = req.query.maxPrice
      ? parseFloat(String(req.query.maxPrice))
      : undefined;

    const salons = await this.salonsService.findAllSalons(
      limit,
      city,
      lat,
      lon,
      radius ?? 10,
      keyword,
      name,
      rating,
      service,
      maxPrice,
    );

    res.status(200).json({
      success: true,
      data: salons,
    });
  });

  /**
   * @route   GET /api/v1/salons/:id
   * @desc    Get single salon details
   */
  public getSalonById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    // Use findSalonById to include services and reviews
    const salon = await this.salonsService.findSalonById(id);
    if (!salon) {
      throw ApiError.notFound("Salon not found");
    }
    res.status(200).json({
      success: true,
      data: salon,
    });
  });

  /**
   * @route   POST /api/v1/salons
   * @desc    Create a new salon
   */
  public createSalon = asyncHandler(async (req: Request, res: Response) => {
    const { name, city, latitude, longitude, starting_price, address, phone, admin_email, google_maps_link } = req.body;

    if (!name || !city) {
      throw ApiError.badRequest("Please provide name and city");
    }

    const salon = await this.salonsService.createSalon({
      name,
      city,
      latitude,
      longitude,
      starting_price,
      address,
      phone,
      admin_email,
      google_maps_link,
    });

    res.status(201).json({
      success: true,
      data: salon,
    });
  });

  /**
   * @route   PUT /api/v1/salons/:id
   * @desc    Update an existing salon
   */
  public updateSalon = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, city, latitude, longitude, starting_price, address, phone, admin_email, google_maps_link } = req.body;

    if (!name || !city) {
      throw ApiError.badRequest("Please provide name and city");
    }

    const result = await query(
      `UPDATE salons SET name=$1, city=$2, latitude=$3, longitude=$4, starting_price=$5, address=$6, phone=$7, google_maps_link=$8, email=$9
       WHERE id=$10 RETURNING *`,
      [name, city, latitude || null, longitude || null, starting_price || 0, address || null, phone || null, google_maps_link || null, admin_email || null, id]
    );

    if (result.rowCount === 0) {
      throw ApiError.notFound("Salon not found");
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * @route   DELETE /api/v1/salons/:id
   * @desc    Delete a salon
   */
  public deleteSalon = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Delete associated records first to avoid foreign key constraint violations
    // We wrap each in a try-catch in case a table or column doesn't exist in the production DB yet
    const cascadeQueries = [
      "DELETE FROM notifications WHERE salon_id = $1",
      "DELETE FROM bookings WHERE salon_id = $1",
      "DELETE FROM users WHERE salon_id = $1",
      "DELETE FROM reviews WHERE salon_id = $1",
      "DELETE FROM team_members WHERE salon_id = $1",
      "DELETE FROM services WHERE salon_id = $1"
    ];

    for (const q of cascadeQueries) {
      try {
        await query(q, [id]);
      } catch (err: any) {
        console.warn(`Warning: Cascade delete query failed (${q}) - ${err.message}`);
      }
    }

    try {
      const result = await query(
        "DELETE FROM salons WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ success: false, message: "Salon not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Salon deleted successfully",
      });
    } catch (err: any) {
      console.error("Error deleting salon:", err);
      // If it's still a foreign key violation (23503), return a friendly message
      if (err.code === '23503') {
        res.status(400).json({
          success: false,
          message: "Cannot delete salon because it has associated records that could not be removed."
        });
        return;
      }
      throw err;
    }
  });

  /**
   * @route   POST /api/v1/salons/:id/reviews
   * @desc    Create a new review for a salon
   */
  public createReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      user_name,
      customer_email,
      email,
      rating,
      overall_experience,
      stylist_skill,
      staff_behaviour,
      cleanliness_hygiene,
      value_for_money,
      booking_id,
      comment,
    } = req.body;

    // Ensure reviews table and extra rating columns exist
    await query(`
      CREATE TABLE IF NOT EXISTS public.reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_email TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS overall_experience INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS stylist_skill INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS staff_behaviour INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS cleanliness_hygiene INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS value_for_money INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id UUID;
    `);

    const isUuid = (val: any) =>
      typeof val === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

    let finalSalonId: string | null = isUuid(id) ? id.trim() : null;
    if (!finalSalonId) {
      try {
        const sRes = await query("SELECT id FROM public.salons WHERE id::text = $1 LIMIT 1", [id]);
        if (sRes.rows[0]?.id) finalSalonId = sRes.rows[0].id;
      } catch (e) {}
    }
    if (!finalSalonId) {
      try {
        const firstSalon = await query("SELECT id FROM public.salons ORDER BY id ASC LIMIT 1");
        if (firstSalon.rows[0]?.id) finalSalonId = firstSalon.rows[0].id;
      } catch (e) {}
    }

    let finalBookingId: string | null = isUuid(booking_id) ? booking_id.trim() : null;
    if (!finalBookingId && booking_id) {
      try {
        const bRes = await query("SELECT id FROM public.bookings WHERE id::text = $1 LIMIT 1", [booking_id]);
        if (bRes.rows[0]?.id) finalBookingId = bRes.rows[0].id;
      } catch (e) {}
    }

    const emailToUse = (customer_email || email || "").trim();
    let nameToUse = (user_name || "").trim();

    // Auto-resolve proper customer name if missing or generic
    if (!nameToUse || nameToUse === "Valued Customer" || nameToUse === "User") {
      if (finalBookingId) {
        try {
          const bRes = await query("SELECT customer_name FROM public.bookings WHERE id = $1 LIMIT 1", [finalBookingId]);
          if (bRes.rows[0]?.customer_name) nameToUse = bRes.rows[0].customer_name;
        } catch (e) {}
      }
      if ((!nameToUse || nameToUse === "Valued Customer" || nameToUse === "User") && emailToUse) {
        try {
          const uRes = await query("SELECT name FROM public.users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) OR mobile = $1 LIMIT 1", [emailToUse]);
          if (uRes.rows[0]?.name) nameToUse = uRes.rows[0].name;
        } catch (e) {}
      }
    }

    if (!nameToUse) {
      nameToUse = "Valued Customer";
    }

    const overallExp = Math.min(5, Math.max(1, Number(overall_experience || rating || 5)));
    const stylistSk = Math.min(5, Math.max(1, Number(stylist_skill || rating || 5)));
    const staffBeh = Math.min(5, Math.max(1, Number(staff_behaviour || rating || 5)));
    const cleanliness = Math.min(5, Math.max(1, Number(cleanliness_hygiene || rating || 5)));
    const valueMoney = Math.min(5, Math.max(1, Number(value_for_money || rating || 5)));

    const avgRating = Math.round((overallExp + stylistSk + staffBeh + cleanliness + valueMoney) / 5);

    const result = await query(
      `INSERT INTO public.reviews (
        salon_id, user_name, customer_email, rating,
        overall_experience, stylist_skill, staff_behaviour, cleanliness_hygiene, value_for_money,
        booking_id, comment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        finalSalonId,
        nameToUse,
        emailToUse || null,
        avgRating,
        overallExp,
        stylistSk,
        staffBeh,
        cleanliness,
        valueMoney,
        finalBookingId,
        comment || null,
      ],
    );

    if (booking_id) {
      try {
        await query("UPDATE public.bookings SET is_reviewed = true WHERE id::text = $1", [booking_id]);
      } catch (e) {}
    }

    if (finalSalonId) {
      try {
        const avgRes = await query("SELECT ROUND(AVG(rating)::numeric, 1) as avg_rating FROM public.reviews WHERE salon_id = $1", [finalSalonId]);
        if (avgRes.rows[0]?.avg_rating) {
          const newRating = parseFloat(avgRes.rows[0].avg_rating);
          await query("UPDATE public.salons SET rating = $1 WHERE id = $2", [newRating, finalSalonId]);
        }
      } catch (e) {}
    }

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: result.rows[0],
    });
  });
}
