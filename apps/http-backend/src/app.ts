import express, { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { isDatabaseReady } from "@repo/db";
import authRoutes from "./routes/auth.routes";
import problemRoutes from "./routes/problem.routes";
import submissionRoutes from "./routes/submission.routes";
import languageRoutes from "./routes/language.routes";
import runCodeRoutes from "./routes/runCode.routes";
import userRoutes from "./routes/user.routes";
import postRoutes from "./routes/post.routes";

export function createApp(): Application {
  const app = express();
  const origins = (process.env.BACKEND_CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",").map(origin => origin.trim()).filter(Boolean);
  app.disable("x-powered-by");
  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: "96kb" }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin");
      if ((origin && !origins.includes(origin)) || (!origin && req.cookies.token && !req.get("authorization"))) {
        return res.status(403).json({ message: "Request origin is not allowed" });
      }
    }
    next();
  });
  app.get("/health/live", (_req, res) => { res.json({ status: "ok" }); });
  app.get("/health/ready", (_req, res) => {
    const ready = isDatabaseReady();
    res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "unavailable" });
  });
  app.use("/auth", authRoutes);
  app.use("/user", userRoutes);
  app.use("/problems", problemRoutes);
  app.use("/submissions", submissionRoutes);
  app.use("/languages", languageRoutes);
  app.use("/runCode", runCodeRoutes);
  app.use("/posts", postRoutes);
  app.get("/", (_req, res) => { res.json({ service: "cuhp-api" }); });
  return app;
}
