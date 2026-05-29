import { Router } from "express";
import {
  getDashboardStats,
  getServices,
  createService,
  updateService,
  deleteService,
  getTeam,
  getSalonProfile,
  updateSalonProfile,
} from "../controllers/admin.controller";
import {
  getAdminBookings,
  getAdminBookingById,
  updateAdminBooking,
  deleteAdminBooking
} from "../controllers/bookings.controller";

const router = Router();

// Dashboard
router.get("/dashboard-stats", getDashboardStats);

// Bookings management
router.get("/bookings", getAdminBookings);
router.get("/bookings/:id", getAdminBookingById);
router.put("/bookings/:id", updateAdminBooking);
router.delete("/bookings/:id", deleteAdminBooking);

// Services CRUD
router.get("/services", getServices);
router.post("/services", createService);
router.put("/services/:id", updateService);
router.delete("/services/:id", deleteService);

// Team
router.get("/team", getTeam);

// Salon Profile
router.get("/salon-profile", getSalonProfile);
router.put("/salon-profile", updateSalonProfile);

export default router;
