import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import routes from "./routes";
// import otpRoutes from "./routes/otp.routes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

dotenv.config();

const app: Express = express();

// 1. Core middlewares
app.use(helmet()); // Secure HTTP headers
app.use(
  cors({
    origin: "*", // Best to configure this tightly in production
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Session middleware (for OTP)
// Removed session middleware

// 2. Logging
app.use(morgan("dev"));

// 3. API Routes
app.use("/api/v1", routes);
// Removed OTP endpoints

// 4. Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

// 5. Fallbacks and Error Handling
app.use(notFoundHandler); // Catch 404s
app.use(errorHandler); // Global generic error catcher

export default app;
