import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { query } from "../config/db";

export const getPublicServices = asyncHandler(
  async (req: Request, res: Response) => {
    // Optionally filter by salon_id
    const salonId = req.query.salon_id as string | undefined;

    let sql = "SELECT * FROM public.services";
    const params: any[] = [];
    if (salonId) {
      sql += " WHERE salon_id = $1";
      params.push(salonId);
    }
    sql += " ORDER BY name ASC";

    const result = await query(sql, params);
    const mappedData = result.rows.map((row: any) => ({
      ...row,
      originalPrice: row.original_price ?? row.price,
      discountedPrice: row.discounted_price ?? row.price,
    }));
    res.json({ success: true, data: mappedData });
  },
);
