// Extend express-session types to include OTP and email
import "express-session";
declare module "express-session" {
  interface SessionData {
    otp?: string;
    email?: string;
  }
}
