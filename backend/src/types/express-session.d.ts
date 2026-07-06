import "express-session";

declare module "express-session" {
  interface SessionData {
    otp?: number;
    email?: string;
    isVerified?: boolean;
  }
}
