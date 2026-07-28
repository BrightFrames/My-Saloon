import { Router } from "express";
import salonsRoutes from "./salons.routes";
import { getPublicServices } from "../controllers/services.controller";
import { getPublicTeam } from "../controllers/team.controller";
import {
  sendOtp,
  verifyOtp,
  createPin,
  register,
  login,
  sendForgotPinOtp,
  resetPin,
  getProfile,
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
import notificationsRoutes from "./notifications.routes";

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
router.use("/notifications", notificationsRoutes);

// Auth routes
router.get("/auth/me", getProfile);
router.post("/auth/send-otp", authLimiter, sendOtp);
router.post("/auth/verify-otp", authLimiter, verifyOtp);
router.post("/auth/create-pin", authLimiter, createPin);
router.post("/auth/register", authLimiter, register);
router.post("/auth/send-forgot-otp", authLimiter, sendForgotPinOtp);
router.post("/auth/reset-pin", authLimiter, resetPin);
router.post("/auth/login", authLimiter, login);
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
