import { Router } from "express";
import {
  createReview,
  getMyReviews,
  getSalonReviews,
} from "../controllers/reviews.controller";
import { authenticateJWT } from "../middlewares/auth";
import { createRateLimit } from "../middlewares/rateLimit";

const router = Router();
const writeLimiter = createRateLimit({
  windowMs: 60_000,
  max: 10,
  code: "RATE_LIMIT_EXCEEDED",
  message: "Too many requests. Please slow down and try again.",
});

// Customer Routes
router.post("/", writeLimiter, createReview);
router.get("/my", authenticateJWT, getMyReviews);

// Public Salon Reviews Route
router.get("/salon/:salonId", getSalonReviews);

export default router;
