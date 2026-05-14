import { Request, Response } from "express";
import { generateOTP } from "../utils/otp";
import { sendOTPEmail } from "../utils/mailer";

// Controller to send OTP to email
export async function sendOTP(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = generateOTP();
  req.session.otp = otp;
  req.session.email = email; // Optionally store email

  try {
    await sendOTPEmail(email, otp);
    res.json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
}

// Controller to verify OTP
export function verifyOTP(req: Request, res: Response) {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ message: "OTP is required" });

  if (req.session.otp && otp === req.session.otp) {
    req.session.otp = null; // Clear OTP after verification
    res.json({ message: "OTP verified successfully" });
  } else {
    res.status(400).json({ message: "Invalid OTP" });
  }
}
