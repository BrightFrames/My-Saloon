import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { SalonsService } from "../services/salons.service";
import { query } from "../config/db";

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
      res.status(404);
      throw new Error("Salon not found");
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
    const { name, city, latitude, longitude, starting_price } = req.body;

    if (!name || !city) {
      res.status(400);
      throw new Error("Please provide name and city");
    }

    const salon = await this.salonsService.createSalon({
      name,
      city,
      latitude,
      longitude,
      starting_price,
    });

    res.status(201).json({
      success: true,
      data: salon,
    });
  });

  /**
   * @route   POST /api/v1/salons/:id/reviews
   * @desc    Create a new review for a salon
   */
  public createReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_name, rating, comment } = req.body;

    if (!user_name || !rating) {
      res.status(400);
      throw new Error("Please provide user_name and rating (1-5)");
    }

    const result = await query(
      "INSERT INTO public.reviews (salon_id, user_name, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, user_name, rating, comment || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  });
}
