import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { connectDB, disconnectDB, isDatabaseReady } from "@repo/db";
import { setupSocket } from "./socket";

export async function startServer() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
  await connectDB();
  const app = express();
  app.get("/health/live", (_req, res) => { res.json({ status: "ok" }); });
  app.get("/health/ready", (_req, res) => {
    const ready = isDatabaseReady();
    res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "unavailable" });
  });
  const server = http.createServer(app);
  const origins = (process.env.SOCKET_CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",").map(origin => origin.trim()).filter(Boolean);
  const io = new Server(server, {
    cors: { origin: origins, credentials: true },
    allowRequest: (req, callback) => callback(null, !req.headers.origin || origins.includes(req.headers.origin)),
  });
  const stopStreams = setupSocket(io);
  server.listen(Number(process.env.PORT || 4001), "0.0.0.0", () => console.log("Socket service ready"));
  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    const deadline = setTimeout(() => process.exit(1), 25_000);
    deadline.unref();
    await stopStreams();
    await new Promise<void>(resolve => io.close(() => resolve()));
    await disconnectDB();
    clearTimeout(deadline);
  };
  process.once("SIGTERM", () => { void shutdown(); });
  process.once("SIGINT", () => { void shutdown(); });
  return server;
}
if (require.main === module) {
  startServer().catch(async error => {
    console.error("Socket startup failed", error);
    await disconnectDB();
    process.exitCode = 1;
  });
}
