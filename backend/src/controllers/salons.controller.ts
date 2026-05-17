import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { SalonsService } from '../services/salons.service';

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
    // Example: parsing query params if necessary
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const city = req.query.city ? String(req.query.city) : undefined;
    const lat = req.query.lat ? parseFloat(String(req.query.lat)) : undefined;
    const lon = req.query.lon ? parseFloat(String(req.query.lon)) : undefined;
    const radius = req.query.radius ? parseFloat(String(req.query.radius)) : undefined;

    const salons = await this.salonsService.findAllSalons(
      limit,
      city,
      lat,
      lon,
      radius ?? 10,
    );
    
    res.status(200).json({
      success: true,
      data: salons
    });
  });

  /**
   * @route   GET /api/v1/salons/:id
   * @desc    Get single salon details
   */
  public getSalonById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const salon = await this.salonsService.findSalonById(id);

    res.status(200).json({
      success: true,
      data: salon
    });
  });
}
