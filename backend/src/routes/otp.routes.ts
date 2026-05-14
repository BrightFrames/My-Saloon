import { Router } from "express";
import { sendOTP, verifyOTP } from "../controllers/otp.controller";

const router = Router();

// Route to send OTP
outer.post("/send-otp", sendOTP);
// Route to verify OTP
router.post("/verify-otp", verifyOTP);

export default router;
