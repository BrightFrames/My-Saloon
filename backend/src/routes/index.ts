import { Router } from "express";
import salonsRoutes from "./salons.routes";
import { getPublicServices } from "../controllers/services.controller";
import { getPublicTeam } from "../controllers/team.controller";
import {
  sendOtp,
  verifyOtp,
  adminLogin,
  superAdminLogin,
  createSalonAdmin,
} from "../controllers/auth.controller";
import {
  authenticateJWT,
  requireSuperAdmin,
  requireAdmin,
} from "../middlewares/auth";
import { createRateLimit } from "../middlewares/rateLimit";
import bookingRoutes from "./bookings.routes";
import adminRoutes from "./admin.routes";
import uploadRoutes from "./upload.routes";

const router = Router();
const authLimiter = createRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'Too many authentication attempts. Please wait and try again.',
});

// Mount all modular routes
router.use("/salons", salonsRoutes);
// Public services endpoint (optionally filter by ?salon_id=)
router.get("/services", getPublicServices);
router.get("/team", getPublicTeam);
router.use("/bookings", bookingRoutes);
router.use("/admin", authenticateJWT, requireAdmin, adminRoutes);
router.use("/upload", uploadRoutes);

// Auth routes
router.post("/auth/send-otp", authLimiter, sendOtp);
router.post("/auth/verify-otp", authLimiter, verifyOtp);
router.post("/auth/admin-login", authLimiter, adminLogin);
router.post("/auth/superadmin-login", authLimiter, superAdminLogin);
// Admin creation route (SuperAdmin only)
router.post(
  "/auth/create-salon-admin",
  authenticateJWT,
  requireSuperAdmin,
  authLimiter,
  createSalonAdmin,
);

export default router;
