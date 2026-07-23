import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { query } from "../config/db";
import { z } from "zod";
import nodemailer from "nodemailer";
import { ensureUserAccount } from "./auth.controller";
import { getIO } from "../socket";
import { validateFullName, validatePhoneNumber } from "../utils/validation";
import {
  calculateAvailableSlots,
  timeToMinutes,
  minutesToTimeString,
  hasOverlap,
  parseDurationInMinutes,
} from "../utils/slotHelper";

async function ensureBookingColumns() {
  try {
    await query(`
      ALTER TABLE public.bookings
        ADD COLUMN IF NOT EXISTS service_id UUID,
        ADD COLUMN IF NOT EXISTS team_member_id UUID,
        ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30,
        ADD COLUMN IF NOT EXISTS start_time TEXT,
        ADD COLUMN IF NOT EXISTS end_time TEXT;

      ALTER TABLE public.salons
        ADD COLUMN IF NOT EXISTS working_hours JSONB;
    `);
  } catch (err) {
    console.warn("[db] Could not ensure booking/salon columns:", err);
  }
}
ensureBookingColumns();

function normalizeDateVariants(rawDate: string): string[] {
  if (!rawDate) return [""];
  const clean = rawDate.trim();

  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [_, y, m, d] = isoMatch;
    return [
      clean,
      `${y}-${m}-${d}`,
      `${m}/${d}/${y}`,
      `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`,
    ];
  }

  const usMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const [_, m, d, y] = usMatch;
    const mm = m.padStart(2, "0");
    const dd = d.padStart(2, "0");
    return [
      clean,
      `${y}-${mm}-${dd}`,
      `${mm}/${dd}/${y}`,
      `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`,
    ];
  }

  return [clean];
}

async function sendBookingReceivedEmail(booking: any) {
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

    const serviceLabel =
      booking.service_name ||
      booking.serviceName ||
      booking.hairstyle ||
      "Service";
    const formattedDate = new Date(
      booking.booking_date || booking.appointment_date
    ).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const timeSlotLabel = booking.booking_time || booking.appointment_time || "N/A";
    const serviceCharge = Number(booking.service_charge || 0);
    const totalPrice = Number(booking.total_price || 0);

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@glowup.com",
      to: booking.customer_email,
      subject: `Booking Request Received - Glowup Salon (ID: ${booking.id})`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FDFBF9; color: #333333; border: 1px solid #F3ECE7; border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <span style="font-family: Georgia, serif; font-size: 36px; font-weight: 300; font-style: italic; color: #CA9A86; letter-spacing: 4px;">Glowup</span>
          </div>

          <div style="background-color: #FFFFFF; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(202, 154, 134, 0.08); border: 1px solid #FAF6F4;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: 400; color: #313131; margin: 0 0 8px 0;">Booking Request Received</h2>
              <p style="font-family: 'Segoe UI', sans-serif; font-size: 14px; color: #8C8682; margin: 0 0 16px 0;">We have received your booking request, ${booking.customer_name}.</p>
              <div style="background-color: #FAF4F0; border: 1px solid #E8D5CB; color: #8C5E4A; font-family: 'Segoe UI', sans-serif; font-size: 14px; font-weight: 600; padding: 12px 16px; border-radius: 12px; display: inline-block;">
                ⏰ The salon will confirm your appointment within 15 minutes.
              </div>
            </div>

            <hr style="border: 0; border-top: 1px dashed #EBE4E0; margin: 30px 0;" />

            <div style="font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #555555;">
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Booking Type:</span>
                <strong style="color: #313131;">${booking.booking_type === "home" ? "Home Service" : "Salon Visit"}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Hairstyle / Treatment:</span>
                <strong style="color: #313131;">${serviceLabel}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Stylist:</span>
                <strong style="color: #313131;">${booking.stylist || "Assigned Stylist"}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Date:</span>
                <strong style="color: #313131;">${formattedDate}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Time Slot:</span>
                <strong style="color: #313131;">${timeSlotLabel}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Home Service Charge:</span>
                <strong style="color: #313131;">₹${serviceCharge}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Total Amount:</span>
                <strong style="color: #CA9A86; font-size: 16px;">₹${totalPrice}</strong>
              </div>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`Booking received email sent to ${booking.customer_email}`);
  } catch (err: any) {
    console.error("Failed to send booking received email:", err?.message || err);
  }
}

async function sendBookingConfirmedEmail(booking: any) {
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

    const serviceLabel =
      booking.service_name ||
      booking.serviceName ||
      booking.hairstyle ||
      "Service";
    const formattedDate = new Date(
      booking.booking_date || booking.appointment_date
    ).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const timeSlotLabel = booking.booking_time || booking.appointment_time || "N/A";
    const serviceCharge = Number(booking.service_charge || 0);
    const totalPrice = Number(booking.total_price || 0);

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@glowup.com",
      to: booking.customer_email,
      subject: `🎉 Slot Confirmed! Glowup Salon (ID: ${booking.id})`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FDFBF9; color: #333333; border: 1px solid #F3ECE7; border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <span style="font-family: Georgia, serif; font-size: 36px; font-weight: 300; font-style: italic; color: #CA9A86; letter-spacing: 4px;">Glowup</span>
          </div>

          <div style="background-color: #FFFFFF; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(202, 154, 134, 0.08); border: 1px solid #FAF6F4;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: 400; color: #2E7D32; margin: 0 0 8px 0;">Appointment Confirmed</h2>
              <p style="font-family: 'Segoe UI', sans-serif; font-size: 14px; color: #8C8682; margin: 0 0 16px 0;">Great news, ${booking.customer_name}! The salon has accepted your booking and your slot is confirmed.</p>
              <div style="background-color: #E8F5E9; border: 1px solid #A5D6A7; color: #2E7D32; font-family: 'Segoe UI', sans-serif; font-size: 14px; font-weight: 600; padding: 12px 16px; border-radius: 12px; display: inline-block;">
                ✅ Your slot is confirmed for ${formattedDate} at ${timeSlotLabel}.
              </div>
            </div>

            <hr style="border: 0; border-top: 1px dashed #EBE4E0; margin: 30px 0;" />

            <div style="font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #555555;">
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Booking Type:</span>
                <strong style="color: #313131;">${booking.booking_type === "home" ? "Home Service" : "Salon Visit"}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Hairstyle / Treatment:</span>
                <strong style="color: #313131;">${serviceLabel}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Stylist:</span>
                <strong style="color: #313131;">${booking.stylist || "Assigned Stylist"}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Date:</span>
                <strong style="color: #313131;">${formattedDate}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Time Slot:</span>
                <strong style="color: #313131;">${timeSlotLabel}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Home Service Charge:</span>
                <strong style="color: #313131;">₹${serviceCharge}</strong>
              </div>
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between;">
                <span style="color: #8C8682;">Total Amount:</span>
                <strong style="color: #2E7D32; font-size: 16px;">₹${totalPrice}</strong>
              </div>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`Booking confirmed email sent to ${booking.customer_email}`);
  } catch (err: any) {
    console.error("Failed to send booking confirmed email:", err?.message || err);
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
  service_id: z.string().optional().nullable(),
  team_member_id: z.string().optional().nullable(),
  duration_minutes: z.number().optional(),
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

      // Validate customer_name and phone/mobile using strict rules
      const nameVal = validateFullName(validatedData.customer_name);
      if (!nameVal.valid) {
        res.status(400).json({ success: false, message: nameVal.message });
        return;
      }

      const phoneToValidate = validatedData.mobile || validatedData.phone || "";
      if (phoneToValidate) {
        const phoneVal = validatePhoneNumber(phoneToValidate);
        if (!phoneVal.valid) {
          res.status(400).json({ success: false, message: phoneVal.message });
          return;
        }
      }

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

      if (!booking_time) {
        res
          .status(400)
          .json({ success: false, message: "Booking time is required." });
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

      // Determine requested service duration in minutes
      let durationMins = parseDurationInMinutes(validatedData.duration_minutes);
      if (validatedData.service_id) {
        const sRes = await query("SELECT duration FROM public.services WHERE id = $1 LIMIT 1", [
          validatedData.service_id,
        ]);
        if (sRes.rows[0]?.duration) {
          durationMins = parseDurationInMinutes(sRes.rows[0].duration);
        }
      } else if (service_name) {
        const sRes = await query(
          "SELECT duration FROM public.services WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1",
          [service_name],
        );
        if (sRes.rows[0]?.duration) {
          durationMins = parseDurationInMinutes(sRes.rows[0].duration);
        }
      }

      const reqStartMins = timeToMinutes(booking_time);
      const reqEndMins = reqStartMins + durationMins;
      const startTimeStr = minutesToTimeString(reqStartMins);
      const endTimeStr = minutesToTimeString(reqEndMins);

      // Fetch active (non-cancelled) bookings for this barber & date
      const dateVariants = normalizeDateVariants(appointment_date);
      const activeCheck = await query(
        `SELECT id, booking_time, appointment_time, start_time, end_time, duration_minutes, booking_status
         FROM public.bookings
         WHERE (
           booking_date::text = ANY($1)
           OR appointment_date::text = ANY($1)
           OR booking_date::text LIKE $2 || '%'
           OR appointment_date::text LIKE $2 || '%'
         )
         AND (
           LOWER(TRIM(stylist)) = LOWER(TRIM($3))
           OR (team_member_id IS NOT NULL AND team_member_id::text = $4)
         )
         AND booking_status NOT IN ('cancelled', 'completed', 'rejected')`,
        [dateVariants, appointment_date, validatedData.stylist, validatedData.team_member_id || ""],
      );

      // Check for time range overlaps
      for (const exBooking of activeCheck.rows) {
        const exStart = timeToMinutes(
          exBooking.start_time || exBooking.booking_time || exBooking.appointment_time,
        );
        const exDuration = Number(exBooking.duration_minutes) || 30;
        const exEnd = exStart + exDuration;

        if (hasOverlap(reqStartMins, reqEndMins, exStart, exEnd)) {
          res.status(400).json({
            success: false,
            message: "This barber is unavailable during the selected time. Please select another available slot.",
          });
          return;
        }
      }

      const createdUser = await ensureUserAccount({
        email: validatedData.customer_email,
        name: validatedData.customer_name,
        mobile: mobile,
        role: "user",
      });

      let resolvedUserId = validatedData.user_id ?? null;
      if (!resolvedUserId) {
        resolvedUserId = createdUser?.id ? Number(createdUser.id) : null;
      }

      let finalSalonId = validatedData.salon_id ?? null;
      if (!finalSalonId) {
        if (validatedData.service_id) {
          const sRes = await query("SELECT salon_id FROM public.services WHERE id = $1 LIMIT 1", [validatedData.service_id]);
          if (sRes.rows[0]?.salon_id) finalSalonId = sRes.rows[0].salon_id;
        } else if (validatedData.team_member_id) {
          const tmRes = await query("SELECT salon_id FROM public.team_members WHERE id = $1 LIMIT 1", [validatedData.team_member_id]);
          if (tmRes.rows[0]?.salon_id) finalSalonId = tmRes.rows[0].salon_id;
        } else if (validatedData.stylist) {
          const tmRes = await query("SELECT salon_id FROM public.team_members WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1", [validatedData.stylist]);
          if (tmRes.rows[0]?.salon_id) finalSalonId = tmRes.rows[0].salon_id;
        }
        if (!finalSalonId) {
          const firstSalon = await query("SELECT id FROM public.salons ORDER BY created_at ASC LIMIT 1");
          if (firstSalon.rows[0]?.id) finalSalonId = firstSalon.rows[0].id;
        }
      }

      const q = `
        INSERT INTO public.bookings (
          customer_name, customer_email, phone, mobile, country_code,
          service_name, hairstyle, stylist, appointment_date, booking_date,
          appointment_time, booking_time, payment_method, notes, total_price,
          booking_status, payment_status, salon_id, user_id, booking_type, address, landmark, city, pincode, service_charge,
          service_id, team_member_id, duration_minutes, start_time, end_time
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', 'pending', $16, $17, $18, $19, $20, $21, $22, $23,
          $24, $25, $26, $27, $28
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

        finalSalonId,
        resolvedUserId,
        validatedData.booking_type || "salon",
        validatedData.address || null,
        validatedData.landmark || null,
        validatedData.city || null,
        validatedData.pincode || null,
        validatedData.service_charge || 0,

        validatedData.service_id || null,
        validatedData.team_member_id || null,
        durationMins,
        startTimeStr,
        endTimeStr,
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

        // Real-time update via socket.io
        try {
          const io = getIO();
          io.to(`salon_${validatedData.salon_id}`).emit("newBooking", {
            notification: {
              ...newNotif,
              customer_name: validatedData.customer_name,
              service_name,
              appointment_date,
              appointment_time,
              payment_method: validatedData.payment_method,
              booking_status: 'pending'
            },
            booking: newBooking
          });

          io.emit("booking_updated", { action: "create", booking: newBooking });
          io.emit("slot_status_changed", {
            date: booking_date,
            barber: validatedData.stylist,
          });
        } catch (err) {
          console.error("[socket] Failed to emit newBooking:", err);
        }
      } else {
        try {
          const io = getIO();
          io.emit("booking_updated", { action: "create", booking: newBooking });
          io.emit("slot_status_changed", {
            date: booking_date,
            barber: validatedData.stylist,
          });
        } catch (err) {
          console.error("[socket] Failed to emit booking_updated:", err);
        }
      }

      sendBookingReceivedEmail(newBooking);
      if (newBooking.booking_status === "confirmed") {
        sendBookingConfirmedEmail(newBooking);
      }

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: newBooking,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: error.issues,
        });
        return;
      }

      console.error("Booking Creation Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
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
    const updatedBooking = result.rows[0];

    if (updatedBooking.salon_id) {
      try {
        const io = getIO();
        io.to(`salon_${updatedBooking.salon_id}`).emit("bookingUpdated", {
          booking: updatedBooking
        });
      } catch (err) {
        console.error("[socket] Failed to emit bookingUpdated on cancel:", err);
      }
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Booking cancelled successfully",
        data: updatedBooking,
      });
  },
);

export const getAvailableSlots = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const date = (req.query.date || req.query.booking_date || req.query.appointment_date) as string;
      const stylist = (req.query.stylist || req.query.barber || req.query.team_member_id) as string;
      const service_id = req.query.service_id as string;
      const service_name = req.query.service_name as string;
      const queryDuration = req.query.duration ? parseInt(req.query.duration as string, 10) : NaN;
      const salon_id = req.query.salon_id as string;

      if (!date || !stylist) {
        res.status(400).json({
          success: false,
          message: "Date and stylist parameters are required",
        });
        return;
      }

      // Determine requested service duration in minutes
      let requestedDuration = 30; // Default 30 minutes

      if (!isNaN(queryDuration) && queryDuration > 0) {
        requestedDuration = queryDuration;
      } else if (service_id) {
        try {
          const sRes = await query("SELECT duration FROM public.services WHERE id = $1 LIMIT 1", [
            service_id,
          ]);
          if (sRes.rows[0]?.duration) {
            requestedDuration = parseDurationInMinutes(sRes.rows[0].duration);
          }
        } catch (e) {}
      } else if (service_name) {
        try {
          const sRes = await query(
            "SELECT duration FROM public.services WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1",
            [service_name],
          );
          if (sRes.rows[0]?.duration) {
            requestedDuration = parseDurationInMinutes(sRes.rows[0].duration);
          }
        } catch (e) {}
      }

      // Fetch working hours of salon if salon_id provided
      let salonOpeningTime = "09:00 AM";
      let salonClosingTime = "08:00 PM";
      if (salon_id) {
        try {
          const salonRes = await query("SELECT working_hours FROM public.salons WHERE id = $1 LIMIT 1", [
            salon_id,
          ]);
          const hours = salonRes.rows[0]?.working_hours;
          if (hours && typeof hours === "object") {
            if (hours.open) salonOpeningTime = hours.open;
            if (hours.close) salonClosingTime = hours.close;
          }
        } catch (err) {
          // Column working_hours might not exist yet, fallback gracefully
        }
      }

      // Fetch active (non-cancelled) bookings for this barber on this date
      let existingBookings: any[] = [];
      try {
        const dateVariants = normalizeDateVariants(date);
        const checkRes = await query(
          `SELECT id, booking_time, appointment_time, start_time, end_time, duration_minutes, service_name, booking_status
           FROM public.bookings
           WHERE (
             booking_date::text = ANY($1)
             OR appointment_date::text = ANY($1)
             OR booking_date::text LIKE $2 || '%'
             OR appointment_date::text LIKE $2 || '%'
           )
           AND (
             LOWER(TRIM(stylist)) = LOWER(TRIM($3))
             OR team_member_id::text = $3
           )
           AND booking_status NOT IN ('cancelled', 'completed', 'rejected')`,
          [dateVariants, date, stylist],
        );

        existingBookings = checkRes.rows.map((b) => ({
          ...b,
          duration_minutes: parseDurationInMinutes(b.duration_minutes),
        }));
      } catch (err) {
        console.warn("[getAvailableSlots] Failed to fetch existing bookings:", err);
      }

      const result = calculateAvailableSlots({
        requestedDuration,
        salonOpeningTime,
        salonClosingTime,
        slotInterval: 30,
        existingBookings,
      });

      res.status(200).json({
        success: true,
        date,
        stylist,
        service_duration: requestedDuration,
        availableSlots: result.availableSlots,
        allSlots: result.allSlots,
      });
    } catch (err: any) {
      console.error("[getAvailableSlots] Error:", err);
      const fallback = calculateAvailableSlots({
        requestedDuration: 30,
        salonOpeningTime: "09:00 AM",
        salonClosingTime: "08:00 PM",
        slotInterval: 30,
        existingBookings: [],
      });
      res.status(200).json({
        success: true,
        date: req.query.date,
        stylist: req.query.stylist,
        service_duration: 30,
        availableSlots: fallback.availableSlots,
        allSlots: fallback.allSlots,
      });
    }
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
      `SELECT b.*, 
              COALESCE(b.salon_id, s.id, s_fallback.id) AS salon_id,
              COALESCE(s.name, s_fallback.name, 'Salon') AS salon_name, 
              COALESCE(s.address, s_fallback.address) AS salon_address, 
              COALESCE(s.city, s_fallback.city) AS salon_city, 
              COALESCE(s.phone, s_fallback.phone) AS salon_phone, 
              COALESCE(s.image, s_fallback.image) AS salon_image, 
              COALESCE(s.google_maps_link, s_fallback.google_maps_link) AS salon_google_maps_link
       FROM public.bookings b
       LEFT JOIN public.salons s ON b.salon_id::text = s.id::text
       LEFT JOIN public.salons s_fallback ON s_fallback.id = (SELECT id FROM public.salons LIMIT 1)
       WHERE b.customer_email = $1 
       ORDER BY b.created_at DESC`,
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
      await sendBookingConfirmedEmail(updatedBooking);
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
    const updatedBooking = result.rows[0];
    
    // Update notification if it exists
    await query(`UPDATE public.notifications SET type = 'BOOKING_ACCEPTED', title = 'Booking Accepted' WHERE booking_id = $1`, [id]);

    // Emit socket event
    try {
      const io = getIO();
      io.to(`salon_${salon_id}`).emit("bookingUpdated", {
        booking: updatedBooking
      });
    } catch (err) {
      console.error("[socket] Failed to emit bookingUpdated on accept:", err);
    }

    // Send confirmation email to customer
    sendBookingConfirmedEmail(updatedBooking);

    res.json({
      success: true,
      message: "Booking accepted",
      data: updatedBooking,
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
    const updatedBooking = result.rows[0];
    
    // Update notification if it exists
    await query(`UPDATE public.notifications SET type = 'BOOKING_REJECTED', title = 'Booking Rejected', message = $1 WHERE booking_id = $2`, [rejectionReason, id]);

    // Emit socket event
    try {
      const io = getIO();
      io.to(`salon_${salon_id}`).emit("bookingUpdated", {
        booking: updatedBooking
      });
    } catch (err) {
      console.error("[socket] Failed to emit bookingUpdated on reject:", err);
    }

    res.json({
      success: true,
      message: "Booking rejected",
      data: updatedBooking,
    });
  }
);
