import { Router } from "express";
import {
  createBooking,
  getBooking,
  cancelBooking,
  getAvailableSlots,
  getUserBookings,
  getAllBookings,
  getSalonBookings,
  allocateBarber
} from "../controllers/bookings.controller";
import { authenticateJWT, requireAdmin } from "../middlewares/auth";
import { createRateLimit } from "../middlewares/rateLimit";

const router = Router();
const writeLimiter = createRateLimit({
  windowMs: 60_000,
  max: 10,
  code: "RATE_LIMIT_EXCEEDED",
  message: "Too many booking actions. Please wait a moment and try again.",
});

// Order matters: specific routes before parameterized ones

// Admin routes
router.get("/admin", authenticateJWT, requireAdmin, getSalonBookings);
router.patch("/admin/:id/allocate", authenticateJWT, requireAdmin, allocateBarber);

router.get("/all", getAllBookings); // <--- Added endpoint for admins
router.get("/slots", getAvailableSlots);
router.get("/user/:email", getUserBookings);
router.post("/", writeLimiter, createBooking);
router.get("/:id", getBooking);
router.patch("/:id/cancel", writeLimiter, cancelBooking);

export default router;
