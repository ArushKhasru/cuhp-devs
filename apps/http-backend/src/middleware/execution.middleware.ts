import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { parseExecutionInput } from "../utils/execution";

// Shared by Run and Submit. Deploy a single API instance until this is backed by shared storage.
const requests = new Map<string, { count: number; expires: number }>();
export function executionGuard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    req.body = parseExecutionInput(req.body);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
  const now = Date.now();
  for (const [key, entry] of requests) if (entry.expires <= now) requests.delete(key);
  const key = String(req.user.id);
  const entry = requests.get(key) ?? { count: 0, expires: now + 60_000 };
  if (entry.count >= 10) {
    res.setHeader("Retry-After", Math.ceil((entry.expires - now) / 1000));
    return res.status(429).json({ message: "Please wait before running or submitting more code." });
  }
  entry.count++;
  requests.set(key, entry);
  next();
}
