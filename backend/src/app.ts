import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import session from "express-session";

import routes from "./routes";

import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

dotenv.config();

const app: Express = express();

// Security
app.use(helmet());

// CORS - accept any localhost port in development
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175", "http://127.0.0.1:5176"],

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

// Routes
app.use("/api/v1", routes);

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
