import { Router } from "express";
import salonsRoutes from "./salons.routes";
import { sendOtp, verifyOtp, adminLogin, superAdminLogin } from "../controllers/auth.controller";
import bookingRoutes from "./bookings.routes";

const router = Router();

// Mount all modular routes
router.use("/salons", salonsRoutes);
router.use("/bookings", bookingRoutes);

// Auth routes
router.post("/auth/send-otp", sendOtp);
router.post("/auth/verify-otp", verifyOtp);
router.post("/auth/admin-login", adminLogin);
router.post("/auth/superadmin-login", superAdminLogin);

export default router;
