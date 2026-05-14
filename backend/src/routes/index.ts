import { Router } from "express";
import salonsRoutes from "./salons.routes";

const router = Router();

// Mount all modular routes
router.use("/salons", salonsRoutes);
// OTP routes have been removed

export default router;
