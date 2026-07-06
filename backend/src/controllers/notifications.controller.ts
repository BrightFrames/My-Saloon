import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { query } from "../config/db";

// GET /api/v1/notifications
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;

  if (!salon_id) {
    res.status(403).json({ success: false, message: "Salon ID required" });
    return;
  }

  const result = await query(
    `SELECT n.*, b.customer_name, b.service_name, b.appointment_date, b.appointment_time, b.payment_method, b.booking_status
     FROM public.notifications n
     JOIN public.bookings b ON n.booking_id = b.id
     WHERE n.salon_id = $1
     ORDER BY n.created_at DESC`,
    [salon_id]
  );

  res.json({
    success: true,
    data: result.rows,
  });
});

// PATCH /api/v1/notifications/:id/read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { salon_id } = (req as any).user;

  const result = await query(
    `UPDATE public.notifications
     SET is_read = true, updated_at = NOW()
     WHERE id = $1 AND salon_id = $2
     RETURNING *`,
    [id, salon_id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, message: "Notification not found" });
    return;
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

// DELETE /api/v1/notifications/:id
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { salon_id } = (req as any).user;

  const result = await query(
    `DELETE FROM public.notifications WHERE id = $1 AND salon_id = $2 RETURNING *`,
    [id, salon_id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, message: "Notification not found" });
    return;
  }

  res.json({
    success: true,
    message: "Notification deleted",
  });
});
