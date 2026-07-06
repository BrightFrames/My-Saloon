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
      // Check if origin is localhost or 127.0.0.1 on any port
      const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isVercelPreview = /^https:\/\/.+\.vercel\.app$/.test(origin);
      const allowedFrontend = process.env.FRONTEND_URL;

      if (isLocal || isVercelPreview || origin === allowedFrontend) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);

// Body Parsers
app.use(express.json());

app.use(
  express.urlencoded({
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
