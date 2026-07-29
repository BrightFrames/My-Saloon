import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import session from "express-session";
import path from "path";
import os from "os";

import routes from "./routes";

import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

dotenv.config();

const app: Express = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS - accept any localhost port in development
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // Normalize origin by removing trailing slash
      const cleanOrigin = origin.trim().replace(/\/$/, "");
      
      const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);
      const isVercel = cleanOrigin.endsWith(".vercel.app") || cleanOrigin.includes(".vercel.app");
      
      const allowedFrontend = process.env.FRONTEND_URL 
        ? process.env.FRONTEND_URL.trim().replace(/\/$/, "") 
        : null;

      if (isLocal || isVercel || cleanOrigin === allowedFrontend) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);

// Body Parsers (Support large payloads such as videos and gallery images)
app.use(express.json({ limit: "100mb" }));

app.use(
  express.urlencoded({
    limit: "100mb",
    extended: true,
  }),
);

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",

    resave: false,

    saveUninitialized: false,

    cookie: {
      secure: false,

      httpOnly: true,

      sameSite: "lax",

      maxAge: 1000 * 60 * 10,
    },
  }),
);

// Logger
app.use(morgan("dev"));

// Serve static files from uploads folder
const uploadsPath = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GlowUp backend is running",
    api: "/api/v1",
    health: "/health",
  });
});

app.use("/api/v1", routes);
app.use("/api", routes);
app.use("/", routes);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

// 404
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
