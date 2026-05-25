import { Router } from "express";
import {
  createBooking,
  getBooking,
  cancelBooking,
  getAvailableSlots,
  getUserBookings,
  getAllBookings,
} from "../controllers/bookings.controller";

const router = Router();

// Order matters: specific routes before parameterized ones
router.get("/all", getAllBookings); // <--- Added endpoint for admins
router.get("/slots", getAvailableSlots);
router.get("/user/:email", getUserBookings);
router.post("/", createBooking);
router.get("/:id", getBooking);
router.patch("/:id/cancel", cancelBooking);

export default router;
