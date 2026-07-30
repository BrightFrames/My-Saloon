import { Router } from "express";
import {
  getDashboardStats,
  getServices,
  createService,
  updateService,
  deleteService,
  getTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getSalonProfile,
  createSalonProfile,
  updateSalonProfile,
  createSuperAdminSalon,
  updateSuperAdminSalon,
  deleteSuperAdminSalon,
  changePassword,
  getReviews,
  replyToReview,
  getCustomers,
  getEarnings,
  getReports,
  getCoupons,
  getMemberships,
  getQueries,
  replyToQuery,
  getRevenueAnalytics,
} from "../controllers/admin.controller";
import {
  getAdminBookings,
  getAdminBookingById,
  updateAdminBooking,
  deleteAdminBooking,
} from "../controllers/bookings.controller";
import { createRateLimit } from "../middlewares/rateLimit";
import { requireSuperAdmin } from "../middlewares/auth";

const router = Router();
const writeLimiter = createRateLimit({
  windowMs: 60_000,
  max: 8,
  code: "RATE_LIMIT_EXCEEDED",
  message: "Too many write requests. Please slow down and try again.",
});

// Analytics & Dashboard
router.get("/dashboard-stats", getDashboardStats);
router.get("/analytics/revenue", getRevenueAnalytics);

// Bookings management
router.get("/bookings", getAdminBookings);
router.get("/bookings/:id", getAdminBookingById);
router.put("/bookings/:id", writeLimiter, updateAdminBooking);
router.delete("/bookings/:id", writeLimiter, deleteAdminBooking);

// Services CRUD
router.get("/services", getServices);
router.post("/services", writeLimiter, createService);
router.put("/services/:id", writeLimiter, updateService);
router.delete("/services/:id", writeLimiter, deleteService);

// Team
router.get("/team", getTeam);
router.post("/team", writeLimiter, createTeamMember);
router.put("/team/:id", writeLimiter, updateTeamMember);
router.delete("/team/:id", writeLimiter, deleteTeamMember);

// Salon Profile
router.get("/salon-profile", getSalonProfile);
router.post("/salon-profile", writeLimiter, createSalonProfile);
router.put("/salon-profile", writeLimiter, updateSalonProfile);

// Reviews & Queries
router.get("/reviews", getReviews);
router.post("/reviews/:id/reply", writeLimiter, replyToReview);
router.get("/queries", getQueries);
router.post("/queries/:id/reply", writeLimiter, replyToQuery);

// Customers
router.get("/customers", getCustomers);

// Earnings
router.get("/earnings", getEarnings);

// Reports
router.get("/reports", getReports);

// Coupons & Memberships
router.get("/coupons", getCoupons);
router.get("/memberships", getMemberships);

// Password Management
router.post("/change-password", writeLimiter, changePassword);

// SuperAdmin Salon Management
router.post("/salons", requireSuperAdmin, writeLimiter, createSuperAdminSalon);
router.put("/salons/:id", requireSuperAdmin, writeLimiter, updateSuperAdminSalon);
router.delete("/salons/:id", requireSuperAdmin, writeLimiter, deleteSuperAdminSalon);

export default router;
