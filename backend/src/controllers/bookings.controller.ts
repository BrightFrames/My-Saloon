import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { query } from "../config/db";
import { z } from "zod";
import nodemailer from "nodemailer";
import { ensureUserAccount } from "./auth.controller";

async function sendBookingConfirmationEmail(booking: any) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const paymentLabel = (booking.payment_method || "cash")
      .replace("_", " ")
      .toUpperCase();
    const serviceLabel =
      booking.service_name ||
      booking.serviceName ||
      booking.hairstyle ||
      "Service";
    const formattedDate = new Date(booking.booking_date).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      },
    );

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@glowup.com",
      to: booking.customer_email,
      subject: `Your Glamour Session is Booked! Glowup Salon (ID: ${booking.id})`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FDFBF9; color: #333333; border: 1px solid #F3ECE7; border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <span style="font-family: Georgia, serif; font-size: 36px; font-weight: 300; font-style: italic; color: #CA9A86; letter-spacing: 4px;">Glowup</span>
          </div>

          <div style="background-color: #FFFFFF; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(202, 154, 134, 0.08); border: 1px solid #FAF6F4;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: 400; color: #313131; margin: 0 0 8px 0;">Appointment Confirmed</h2>
              <p style="font-family: 'Segoe UI', sans-serif; font-size: 14px; color: #8C8682; margin: 0;">We are excited to welcome you, ${booking.customer_name}.</p>
            </div>

            <hr style="border: 0; border-top: 1px dashed #EBE4E0; margin: 30px 0;" />

            <div style="font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #555555;">
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Booking Type:</span>
                <strong style="color: #313131;">${booking.booking_type === "home" ? "Home Service" : "Salon Visit"}</strong>
              </div>
              ${booking.booking_type === "home" && booking.address ? `
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Service Address:</span>
                <strong style="color: #313131; text-align: right; max-width: 60%;">${booking.address}, ${booking.landmark ? booking.landmark + ", " : ""}${booking.city} - ${booking.pincode}</strong>
              </div>
              ` : ""}
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Hairstyle / Treatment:</span>
                <strong style="color: #313131;">${serviceLabel}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Stylist:</span>
                <strong style="color: #313131;">${booking.stylist}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Date:</span>
                <strong style="color: #313131;">${formattedDate}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Time Slot:</span>
                <strong style="color: #313131;">${booking.booking_time}</strong>
              </div>
              ${booking.service_charge ? `
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Home Service Charge:</span>
                <strong style="color: #313131;">₹${booking.service_charge}</strong>
              </div>
              ` : ""}
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between; border-top: 1px solid #eee; padding-top: 10px;">
                <span style="color: #8C8682;">Total Amount:</span>
                <strong style="color: #313131; font-size: 16px;">₹${booking.total_price}</strong>
              </div>
            </div>
          </div>
        </div>
      `,
    });
    console.log(
      `Booking confirmation email sent successfully to ${booking.customer_email}`,
    );
  } catch (err: any) {
    console.error(
      "Failed to send booking confirmation email:",
      err?.message || err,
    );
  }
}

const bookingSchema = z.object({
  customer_name: z.string().min(1, "Name is required"),
  customer_email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  country_code: z.string().min(1, "Country code is required").default("+91"),
  service_name: z.string().optional(),
  serviceName: z.string().optional(),
  hairstyle: z.string().optional(),
  stylist: z.string().min(1, "Stylist is required"),
  appointment_date: z.string().optional(),
  booking_date: z.string().optional(),
  appointment_time: z.string().optional(),
  booking_time: z.string().optional(),
  payment_method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
  total_price: z.number().min(0, "Total price must be valid"),
  salon_id: z.string().uuid("Valid salon ID required").optional().nullable(),
  user_id: z.number().optional().nullable(),
  booking_type: z.enum(["salon", "home"]).optional().default("salon"),
  address: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  service_charge: z.number().optional().default(0),
});

export const createBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = bookingSchema.parse(req.body);

      // Resolve synchronized fields
      const phone = validatedData.phone || validatedData.mobile || "";
      const mobile = validatedData.mobile || validatedData.phone || "";
      const service_name =
        validatedData.service_name ||
        validatedData.serviceName ||
        validatedData.hairstyle ||
        "";
      const hairstyle =
        validatedData.hairstyle ||
        validatedData.serviceName ||
        validatedData.service_name ||
        "";
      const appointment_date =
        validatedData.appointment_date || validatedData.booking_date || "";
      const booking_date =
        validatedData.booking_date || validatedData.appointment_date || "";
      const appointment_time =
        validatedData.appointment_time || validatedData.booking_time || "";
      const booking_time =
        validatedData.booking_time || validatedData.appointment_time || "";

      if (!appointment_date) {
        res
          .status(400)
          .json({ success: false, message: "Booking date is required." });
        return;
      }

      const bookingDateObj = new Date(appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (bookingDateObj < today) {
        res
          .status(400)
          .json({ success: false, message: "Cannot book for a past date." });
        return;
      }

      const checkRes = await query(
        `SELECT id FROM public.bookings WHERE appointment_date = $1 AND appointment_time = $2 AND stylist = $3 AND booking_status = 'confirmed'`,
        [appointment_date, appointment_time, validatedData.stylist],
      );

      const createdUser = await ensureUserAccount({
        email: validatedData.customer_email,
        name: validatedData.customer_name,
        mobile: mobile,
        role: "user",
      });

      if (checkRes.rows.length > 0) {
        res
          .status(400)
          .json({
            success: false,
            message: "Slot already booked for this stylist.",
          });
        return;
      }

      let resolvedUserId = validatedData.user_id ?? null;
      if (!resolvedUserId) {
        resolvedUserId = createdUser?.id ? Number(createdUser.id) : null;
      }

      const q = `
        INSERT INTO public.bookings (
          customer_name, customer_email, phone, mobile, country_code,
          service_name, hairstyle, stylist, appointment_date, booking_date,
          appointment_time, booking_time, payment_method, notes, total_price,
          booking_status, payment_status, salon_id, user_id, booking_type, address, landmark, city, pincode, service_charge
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', 'pending', $16, $17, $18, $19, $20, $21, $22, $23
        ) RETURNING *
      `;

      const vals = [
        validatedData.customer_name,
        validatedData.customer_email,
        phone,
        mobile,
        validatedData.country_code,
        service_name,
        hairstyle,
        validatedData.stylist,
        appointment_date,
        booking_date,
        appointment_time,
        booking_time,
        validatedData.payment_method,
        validatedData.notes || "",
        validatedData.total_price,

        validatedData.salon_id || null,
        resolvedUserId,
        validatedData.booking_type || "salon",
        validatedData.address || null,
        validatedData.landmark || null,
        validatedData.city || null,
        validatedData.pincode || null,
        validatedData.service_charge || 0,

      ];

      const result = await query(q, vals);
      const newBooking = result.rows[0];

      if (validatedData.salon_id) {
        // Create notification for salon admin
        const notifQ = `
          INSERT INTO public.notifications (
            salon_id, booking_id, customer_id, type, title, message
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const notifVals = [
          validatedData.salon_id,
          newBooking.id,
          validatedData.user_id || null,
          'NEW_BOOKING',
          'New Booking Request',
          `${validatedData.customer_name} has requested a booking for ${service_name} on ${appointment_date} at ${appointment_time}.`
        ];
        const notifResult = await query(notifQ, notifVals);
        const newNotif = notifResult.rows[0];
      }

      sendBookingConfirmationEmail(newBooking);

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: newBooking,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            success: false,
            message: "Validation Error",
            errors: error.issues,
          });
        return;
      }
      console.error("Create booking error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },
);

export const getBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      res
        .status(400)
        .json({ success: false, message: "Booking ID is required" });
      return;
    }
    const result = await query("SELECT * FROM public.bookings WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  },
);

export const cancelBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      res
        .status(400)
        .json({ success: false, message: "Booking ID is required" });
      return;
    }
    const result = await query(
      "UPDATE public.bookings SET booking_status = 'cancelled' WHERE id = $1 RETURNING *",
      [id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Booking cancelled successfully",
        data: result.rows[0],
      });
  },
);

export const getAvailableSlots = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { date, stylist } = req.query;
    if (!date || !stylist) {
      res
        .status(400)
        .json({
          success: false,
          message: "Date and stylist parameters are required",
        });
      return;
    }

    const allSlots = [
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "01:00 PM",
      "02:00 PM",
      "03:00 PM",
      "04:00 PM",
      "05:00 PM",
      "06:00 PM",
      "07:00 PM",
      "08:00 PM",
    ];

    let bookedSlots: string[] = [];
    const checkRes = await query(
      "SELECT booking_time FROM public.bookings WHERE booking_date = $1 AND stylist = $2 AND booking_status = 'confirmed'",
      [date, stylist],
    );
    bookedSlots = checkRes.rows.map((b) => b.booking_time);
    const availableSlots = allSlots.filter(
      (slot) => !bookedSlots.includes(slot),
    );
    res.status(200).json({ success: true, date, stylist, availableSlots });
  },
);

export const getUserBookings = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.params;
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }
    const result = await query(
      "SELECT * FROM public.bookings WHERE customer_email = $1 ORDER BY created_at DESC",
      [email],
    );
    res.status(200).json({ success: true, data: result.rows });
  },
);

// Admin / Superadmin handlers
export const getAllBookings = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { salon_id } = req.query;

    let result;
    if (salon_id) {
      result = await query(
        "SELECT * FROM public.bookings WHERE salon_id = $1 ORDER BY created_at DESC",
        [salon_id],
      );
    } else {
      result = await query(
        "SELECT * FROM public.bookings ORDER BY created_at DESC",
      );
    }

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  },
);
export const getSalonBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const result = await query(
      "SELECT * FROM public.bookings WHERE salon_id = $1 OR salon_id IS NULL ORDER BY booking_date DESC, booking_time ASC",
      [salon_id],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  },
);

export const allocateBarber = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { stylist } = req.body;
    const { salon_id } = (req as any).user;

    if (!stylist) {
      res.status(400).json({ message: "Stylist name is required" });
      return;
    }

    // Ensure this booking belongs to the admin's salon
    const checkResult = await query(
      "SELECT salon_id FROM public.bookings WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    if (
      checkResult.rows[0].salon_id !== salon_id &&
      checkResult.rows[0].salon_id !== null
    ) {
      res
        .status(403)
        .json({ message: "Forbidden: Booking belongs to another salon" });
      return;
    }

    const result = await query(
      "UPDATE public.bookings SET stylist = $1, salon_id = $2 WHERE id = $3 RETURNING *",
      [stylist, salon_id, id],
    );

    res.json({
      success: true,
      message: "Barber allocated successfully",
      data: result.rows[0],
    });
  },
);

// GET /api/admin/bookings (Fetch all bookings with query, pagination, filters, searching)
export const getAdminBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const { status, search, page = 1, limit = 50 } = req.query;
    const parsedLimit = parseInt(String(limit), 10);
    const parsedPage = parseInt(String(page), 10);
    const offset = (parsedPage - 1) * parsedLimit;

    let queryParams: any[] = [salon_id];
    let paramIndex = 2;
    let whereClauses: string[] = ["(salon_id = $1 OR salon_id IS NULL)"];

    if (status && status !== "all") {
      whereClauses.push(`booking_status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereClauses.push(
        `(customer_name ILIKE $${paramIndex} OR customer_email ILIKE $${paramIndex} OR service_name ILIKE $${paramIndex} OR hairstyle ILIKE $${paramIndex})`,
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereStr = whereClauses.join(" AND ");

    // Count query
    const countRes = await query(
      `SELECT COUNT(*) FROM public.bookings WHERE ${whereStr}`,
      queryParams,
    );
    const total = parseInt(countRes.rows[0].count, 10);

    // Paginated query (latest first)
    const dataQuery = `
    SELECT * FROM public.bookings 
    WHERE ${whereStr} 
    ORDER BY appointment_date DESC, created_at DESC 
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    const finalParams = [...queryParams, parsedLimit, offset];
    const dataRes = await query(dataQuery, finalParams);

    res.json({
      success: true,
      total,
      page: parsedPage,
      limit: parsedLimit,
      data: dataRes.rows,
    });
  },
);

// GET /api/admin/bookings/:id (Fetch single booking)
export const getAdminBookingById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { salon_id } = (req as any).user;

    const result = await query("SELECT * FROM public.bookings WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    const booking = result.rows[0];
    if (booking.salon_id !== salon_id && booking.salon_id !== null) {
      res
        .status(403)
        .json({
          success: false,
          message: "Forbidden: booking belongs to another salon",
        });
      return;
    }

    res.json({ success: true, data: booking });
  },
);

// PUT /api/admin/bookings/:id (Update booking status or details)
export const updateAdminBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { salon_id } = (req as any).user;
    const {
      booking_status,
      payment_status,
      stylist,
      customer_name,
      customer_email,
      total_price,
      appointment_date,
      appointment_time,
    } = req.body;

    const checkResult = await query(
      "SELECT * FROM public.bookings WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    const booking = checkResult.rows[0];
    if (booking.salon_id !== salon_id && booking.salon_id !== null) {
      res
        .status(403)
        .json({ message: "Forbidden: booking belongs to another salon" });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (booking_status !== undefined) {
      updates.push(`booking_status = $${paramIndex}`);
      values.push(booking_status);
      paramIndex++;
    }

    if (payment_status !== undefined) {
      updates.push(`payment_status = $${paramIndex}`);
      values.push(payment_status);
      paramIndex++;
    }

    if (stylist !== undefined) {
      updates.push(`stylist = $${paramIndex}`);
      values.push(stylist);
      paramIndex++;
    }

    if (customer_name !== undefined) {
      updates.push(`customer_name = $${paramIndex}`);
      values.push(customer_name);
      paramIndex++;
    }

    if (customer_email !== undefined) {
      updates.push(`customer_email = $${paramIndex}`);
      values.push(customer_email);
      paramIndex++;
    }

    if (total_price !== undefined) {
      updates.push(`total_price = $${paramIndex}`);
      values.push(total_price);
      paramIndex++;
    }

    if (appointment_date !== undefined) {
      updates.push(`appointment_date = $${paramIndex}`);
      updates.push(`booking_date = $${paramIndex}`);
      values.push(appointment_date);
      paramIndex++;
    }

    if (appointment_time !== undefined) {
      updates.push(`appointment_time = $${paramIndex}`);
      updates.push(`booking_time = $${paramIndex}`);
      values.push(appointment_time);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);

    values.push(id);
    const q = `UPDATE public.bookings SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(q, values);
    const updatedBooking = result.rows[0];

    if (booking_status === "confirmed" && booking.booking_status !== "confirmed") {
      await sendBookingConfirmationEmail(updatedBooking);
    }

    res.json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  },
);

// DELETE /api/admin/bookings/:id (Delete booking)
export const deleteAdminBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { salon_id } = (req as any).user;

    const checkResult = await query(
      "SELECT salon_id FROM public.bookings WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    if (
      checkResult.rows[0].salon_id !== salon_id &&
      checkResult.rows[0].salon_id !== null
    ) {
      res
        .status(403)
        .json({ message: "Forbidden: booking belongs to another salon" });
      return;
    }

    await query("DELETE FROM public.bookings WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "Booking deleted successfully",
    });
  },
);

export const acceptBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { salon_id, id: admin_id } = (req as any).user;

    const checkResult = await query(
      "SELECT * FROM public.bookings WHERE id = $1 AND salon_id = $2",
      [id, salon_id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ success: false, message: "Booking not found or access denied" });
      return;
    }

    const booking = checkResult.rows[0];

    const q = `
      UPDATE public.bookings
      SET booking_status = 'confirmed', accepted_by = $1, accepted_at = NOW(), updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(q, [admin_id, id]);
    
    // Update notification if it exists
    await query(`UPDATE public.notifications SET type = 'BOOKING_ACCEPTED', title = 'Booking Accepted' WHERE booking_id = $1`, [id]);

    res.json({
      success: true,
      message: "Booking accepted",
      data: result.rows[0],
    });
  }
);

export const rejectBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const { salon_id, id: admin_id } = (req as any).user;

    if (!rejectionReason) {
      res.status(400).json({ success: false, message: "Rejection reason is required" });
      return;
    }

    const checkResult = await query(
      "SELECT * FROM public.bookings WHERE id = $1 AND salon_id = $2",
      [id, salon_id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ success: false, message: "Booking not found or access denied" });
      return;
    }

    const booking = checkResult.rows[0];

    const q = `
      UPDATE public.bookings
      SET booking_status = 'rejected', rejected_by = $1, rejected_at = NOW(), rejection_reason = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await query(q, [admin_id, rejectionReason, id]);
    
    // Update notification if it exists
    await query(`UPDATE public.notifications SET type = 'BOOKING_REJECTED', title = 'Booking Rejected', message = $1 WHERE booking_id = $2`, [rejectionReason, id]);

    res.json({
      success: true,
      message: "Booking rejected",
      data: result.rows[0],
    });
  }
);
