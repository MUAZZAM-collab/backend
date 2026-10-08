import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";

import connectDB from "./src/config/db.js";
import enquiryRoutes from "./src/routes/enquiryRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import { notFound, errorHandler } from "./src/middleware/errorHandler.js";
import { generalLimiter } from "./src/middleware/rateLimit.js";

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ---- CORS setup ----
const rawOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// "*" means allow every origin
const allowAllOrigins = rawOrigins.includes("*");
const allowedOrigins = rawOrigins.filter((o) => o !== "*");

const corsOptions = {
  origin(origin, callback) {
    // No origin (curl, Postman, server-to-server) → always allow
    if (!origin) return callback(null, true);

    // Explicit wildcard → allow everything
    if (allowAllOrigins) return callback(null, true);

    // Empty config → allow everything (dev convenience)
    if (allowedOrigins.length === 0) return callback(null, true);

    // Otherwise, check the allow list
    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
  optionsSuccessStatus: 204,
};

// ---- App ----
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors(corsOptions));
// Explicitly handle CORS preflight requests for all routes
app.options("*", cors(corsOptions));
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(generalLimiter);

// ---- Health check ----
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "moazum-group-api",
    env: NODE_ENV,
    time: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ---- Routes ----
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/admin", adminRoutes);

// ---- 404 + errors ----
app.use(notFound);
app.use(errorHandler);

// ---- Boot ----
async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`✅ API listening on http://localhost:${PORT}`);
      console.log(`   env: ${NODE_ENV}`);
      console.log(
        `   CORS: ${allowAllOrigins ? "wildcard (*)" : allowedOrigins.join(", ") || "(all)"}`,
      );
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received — closing server…`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log("MongoDB connection closed. Bye.");
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

start();

export default app;