import { Router } from "express";
import salonsRoutes from "./salons.routes";
import { sendOtp, verifyOtp, adminLogin, superAdminLogin, createSalonAdmin } from "../controllers/auth.controller";
import { authenticateJWT, requireSuperAdmin, requireAdmin } from "../middlewares/auth";
import bookingRoutes from "./bookings.routes";
import adminRoutes from "./admin.routes";

const router = Router();

// Mount all modular routes
router.use("/salons", salonsRoutes);
router.use("/bookings", bookingRoutes);
router.use("/admin", authenticateJWT, requireAdmin, adminRoutes);

// Auth routes
router.post("/auth/send-otp", sendOtp);
router.post("/auth/verify-otp", verifyOtp);
router.post("/auth/admin-login", adminLogin);
router.post("/auth/superadmin-login", superAdminLogin);
// Admin creation route (SuperAdmin only)
router.post("/auth/create-salon-admin", authenticateJWT, requireSuperAdmin, createSalonAdmin);

export default router;
