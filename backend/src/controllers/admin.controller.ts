import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { query } from "../config/db";

// ─── Dashboard Stats ─────────────────────────────────────────
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;

  if (!salon_id) {
    res.status(403).json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  const bookingsResult = await query(
    `SELECT COUNT(*) as total_bookings, 
            COALESCE(SUM(total_price) FILTER (WHERE booking_status != 'cancelled'), 0) as total_revenue 
     FROM public.bookings 
     WHERE salon_id = $1 OR salon_id IS NULL`,
    [salon_id]
  );

  const todayResult = await query(
    `SELECT COUNT(*) as today_appointments 
     FROM public.bookings 
     WHERE (salon_id = $1 OR salon_id IS NULL) AND appointment_date = CURRENT_DATE`,
    [salon_id]
  );

  const pendingResult = await query(
    `SELECT COUNT(*) as pending_bookings 
     FROM public.bookings 
     WHERE (salon_id = $1 OR salon_id IS NULL) AND booking_status = 'confirmed' AND appointment_date >= CURRENT_DATE`,
    [salon_id]
  );

  const stats = bookingsResult.rows[0];
  const today = todayResult.rows[0];
  const pending = pendingResult.rows[0];

  res.json({
    success: true,
    data: {
      total_bookings: parseInt(stats.total_bookings, 10),
      total_revenue: parseFloat(stats.total_revenue),
      today_appointments: parseInt(today.today_appointments, 10),
      pending_bookings: parseInt(pending.pending_bookings, 10),
    }
  });
});

// ─── Services ────────────────────────────────────────────────
export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;

  if (!salon_id) {
    res.status(403).json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  const result = await query(
    'SELECT * FROM public.services WHERE salon_id = $1 ORDER BY name ASC',
    [salon_id]
  );

  res.json({ success: true, data: result.rows });
});

export const createService = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;
  const { name, price, duration } = req.body;

  if (!salon_id) {
    res.status(403).json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  if (!name || price === undefined || !duration) {
    res.status(400).json({ message: "Name, price, and duration are required." });
    return;
  }

  const result = await query(
    'INSERT INTO public.services (salon_id, name, price, duration) VALUES ($1, $2, $3, $4) RETURNING *',
    [salon_id, name, price, duration]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;
  const { id } = req.params;
  const { name, price, duration } = req.body;

  if (!salon_id) {
    res.status(403).json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  // Ensure service belongs to this salon
  const checkResult = await query('SELECT salon_id FROM public.services WHERE id = $1', [id]);
  if (checkResult.rows.length === 0) {
    res.status(404).json({ message: "Service not found" });
    return;
  }
  if (checkResult.rows[0].salon_id !== salon_id) {
    res.status(403).json({ message: "Forbidden: Service belongs to another salon" });
    return;
  }

  const result = await query(
    'UPDATE public.services SET name = $1, price = $2, duration = $3 WHERE id = $4 RETURNING *',
    [name, price, duration, id]
  );

  res.json({ success: true, data: result.rows[0] });
});

export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;
  const { id } = req.params;

  if (!salon_id) {
    res.status(403).json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  const checkResult = await query('SELECT salon_id FROM public.services WHERE id = $1', [id]);
  if (checkResult.rows.length === 0) {
    res.status(404).json({ message: "Service not found" });
    return;
  }
  if (checkResult.rows[0].salon_id !== salon_id) {
    res.status(403).json({ message: "Forbidden: Service belongs to another salon" });
    return;
  }

  await query('DELETE FROM public.services WHERE id = $1', [id]);
  res.json({ success: true, message: "Service deleted" });
});

// ─── Team ────────────────────────────────────────────────────
export const getTeam = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;

  if (!salon_id) {
    res.status(403).json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  const result = await query(
    'SELECT id, email, role, salon_id FROM public.users WHERE salon_id = $1 ORDER BY email ASC',
    [salon_id]
  );

  res.json({ success: true, data: result.rows });
});

// ─── Salon Profile ───────────────────────────────────────────
export const getSalonProfile = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;

  if (!salon_id) {
    res.status(403).json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  const result = await query('SELECT * FROM public.salons WHERE id = $1', [salon_id]);

  if (result.rows.length === 0) {
    res.status(404).json({ message: "Salon not found" });
    return;
  }

  res.json({ success: true, data: result.rows[0] });
});

export const updateSalonProfile = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;
  const { name, city, starting_price, latitude, longitude } = req.body;

  if (!salon_id) {
    res.status(403).json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  const result = await query(
    'UPDATE public.salons SET name = $1, city = $2, starting_price = $3, latitude = $4, longitude = $5 WHERE id = $6 RETURNING *',
    [name, city, starting_price, latitude || null, longitude || null, salon_id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ message: "Salon not found" });
    return;
  }

  res.json({ success: true, data: result.rows[0] });
});
