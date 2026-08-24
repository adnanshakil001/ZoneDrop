import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.js";
import { pincodesRouter, zonesRouter } from "./routes/config.js";
import { ordersRouter } from "./routes/orders.js";
import { codRouter, rateCardsRouter } from "./routes/pricing.js";
import { usersRouter } from "./routes/users.js";

export function createApp() {
  const app = express();
  
  // Security Headers
  app.use(helmet());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
  });
  
  // Apply the rate limiting middleware to API calls only
  app.use("/api", limiter);

  app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173", credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/zones", zonesRouter);
  app.use("/api/pincodes", pincodesRouter);
  app.use("/api/rate-cards", rateCardsRouter);
  app.use("/api/cod-config", codRouter);
  app.use("/api/orders", ordersRouter);

  return app;
}
