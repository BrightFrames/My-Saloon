import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { query } from "../config/db";
import { z } from "zod";
import nodemailer from "nodemailer";

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

    const paymentLabel = booking.payment_method.replace('_', ' ').toUpperCase();
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@glowup.com",
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
                <span style="color: #8C8682;">Hairstyle / Treatment:</span>
                <strong style="color: #313131;">${booking.hairstyle}</strong>
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
            </div>
          </div>
        </div>
      `
    });
    console.log(`Booking confirmation email sent successfully to ${booking.customer_email}`);
  } catch (err: any) {
    console.error("Failed to send booking confirmation email:", err?.message || err);
  }
}

const bookingSchema = z.object({
  customer_name: z.string().min(1, "Name is required"),
  customer_email: z.string().email("Invalid email format"),
  mobile: z.string().min(1, "Mobile number is required"),
  country_code: z.string().min(1, "Country code is required"),
  hairstyle: z.string().min(1, "Hairstyle is required"),
  stylist: z.string().min(1, "Stylist is required"),
  booking_date: z.string().min(1, "Booking date is required"),
  booking_time: z.string().min(1, "Booking time is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
  total_price: z.number().min(0, "Total price must be valid"),
  salon_id: z.string().uuid("Valid salon ID required").optional().nullable(),
});

export const createBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = bookingSchema.parse(req.body);

      const bookingDate = new Date(validatedData.booking_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (bookingDate < today) {
        res.status(400).json({ success: false, message: "Cannot book for a past date." });
        return;
      }

      const checkRes = await query(
        `SELECT id FROM public.bookings WHERE booking_date = $1 AND booking_time = $2 AND stylist = $3 AND booking_status = 'confirmed'`,
        [validatedData.booking_date, validatedData.booking_time, validatedData.stylist]
      );
      
      if (checkRes.rows.length > 0) {
        res.status(400).json({ success: false, message: "Slot already booked for this stylist." });
        return;
      }

      const q = `
        INSERT INTO public.bookings (
          customer_name, customer_email, mobile, country_code,
          hairstyle, stylist, booking_date, booking_time,
          payment_method, notes, total_price, booking_status, salon_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmed', $12
        ) RETURNING *;
      `;
      const values = [
        validatedData.customer_name,
        validatedData.customer_email,
        validatedData.mobile,
        validatedData.country_code,
        validatedData.hairstyle,
        validatedData.stylist,
        validatedData.booking_date,
        validatedData.booking_time,
        validatedData.payment_method,
        validatedData.notes || null,
        validatedData.total_price,
        validatedData.salon_id || null
      ];

      const result = await query(q, values);
      const newBooking = result.rows[0];

      sendBookingConfirmationEmail(newBooking);

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: newBooking,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: "Validation Error", errors: error.issues });
        return;
      }
      console.error("Create booking error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);

export const getBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: "Booking ID is required" });
      return;
    }
    const result = await query("SELECT * FROM public.bookings WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  }
);

export const cancelBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: "Booking ID is required" });
      return;
    }
    const result = await query(
      "UPDATE public.bookings SET booking_status = 'cancelled' WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Booking cancelled successfully", data: result.rows[0] });
  }
);

export const getAvailableSlots = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { date, stylist } = req.query;
    if (!date || !stylist) {
      res.status(400).json({ success: false, message: "Date and stylist parameters are required" });
      return;
    }

    const allSlots = [
      "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
      "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
      "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
    ];

    let bookedSlots: string[] = [];
    const checkRes = await query(
      "SELECT booking_time FROM public.bookings WHERE booking_date = $1 AND stylist = $2 AND booking_status = 'confirmed'",
      [date, stylist]
    );
    bookedSlots = checkRes.rows.map(b => b.booking_time);
    const availableSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));
    res.status(200).json({ success: true, date, stylist, availableSlots });
  }
);

export const getUserBookings = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.params;
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }
    const result = await query("SELECT * FROM public.bookings WHERE customer_email = $1 ORDER BY created_at DESC", [email]);
    res.status(200).json({ success: true, data: result.rows });
  }
);

// Admin / Superadmin handlers
export const getAllBookings = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { salon_id } = req.query;

    let result;
    if (salon_id) {
      result = await query("SELECT * FROM public.bookings WHERE salon_id = $1 ORDER BY created_at DESC", [salon_id]);
    } else {
      result = await query("SELECT * FROM public.bookings ORDER BY created_at DESC");
    }

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  }
);