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
    const { user_name, customer_email, rating, comment } = req.body;

    if (!user_name || !customer_email || !rating) {
      throw ApiError.badRequest("Please provide your name, email, and rating (1-5)");
    }

    const bookingResult = await query(
      `SELECT id FROM public.bookings
       WHERE customer_email = $1
         AND salon_id = $2
         AND booking_status IN ('confirmed', 'completed')
       LIMIT 1`,
      [String(customer_email).trim().toLowerCase(), id],
    );

    if (bookingResult.rows.length === 0) {
      throw ApiError.forbidden(
        "Only customers who booked this salon can leave a review.",
      );
    }

    const result = await query(
      "INSERT INTO public.reviews (salon_id, user_name, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, user_name, rating, comment || null],
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  });
}
