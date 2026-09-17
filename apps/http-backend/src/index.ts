import "dotenv/config";
import { connectDB, disconnectDB, Submission, User } from "@repo/db";
import { createApp } from "./app";
import { startResultWorker } from "./workers/result.worker";

export async function startServer() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
  const connection = await connectDB();
  const hello = await connection.connection.db!.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid") {
    throw new Error("Submission judging requires a MongoDB replica set. Use Atlas or a local replica set.");
  }
  await Promise.all([Submission.init(), User.init()]);
  const app = createApp();
  const server = app.listen(Number(process.env.PORT || 3001), "0.0.0.0", () => {
    console.log("HTTP API ready");
  });
  const worker = startResultWorker();
  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    const deadline = setTimeout(() => process.exit(1), 25_000);
    deadline.unref();
    const closed = new Promise<void>(resolve => server.close(() => resolve()));
    await worker.stop();
    await closed;
    await disconnectDB();
    clearTimeout(deadline);
  };
  process.once("SIGTERM", () => { void shutdown(); });
  process.once("SIGINT", () => { void shutdown(); });
  return server;
}
if (require.main === module) {
  startServer().catch(async error => {
    console.error("API startup failed", error);
    await disconnectDB();
    process.exitCode = 1;
  });
}
