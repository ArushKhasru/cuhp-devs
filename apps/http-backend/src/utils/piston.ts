import axios from "axios";
import pLimit from "p-limit";
const executeUrl = process.env.PISTON_URL || "http://localhost:2000/api/v2/execute";
const runtimesUrl = process.env.PISTON_RUNTIMES_URL || "http://localhost:2000/api/v2/runtimes";
function positiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(name + " must be a positive integer");
  return value;
}
const concurrency = positiveInteger("EXECUTION_CONCURRENCY", 2);
const maxQueue = positiveInteger("EXECUTION_QUEUE_SIZE", 20);
const runMemory = positiveInteger("PISTON_RUN_MEMORY_MB", 128) * 1024 * 1024;
const compileMemory = positiveInteger("PISTON_COMPILE_MEMORY_MB", 512) * 1024 * 1024;
// Shared by sample runs and the worker. Run one API instance until a distributed queue is added.
const limit = pLimit(concurrency);
const headers = process.env.PISTON_AUTH_TOKEN ? { Authorization: process.env.PISTON_AUTH_TOKEN } : undefined;
export type PistonRuntime = { language: string; version: string; aliases?: string[] };
let cached: { runtimes: PistonRuntime[]; expires: number } | undefined;
let loading: Promise<PistonRuntime[]> | undefined;
export async function getPistonRuntimes(): Promise<PistonRuntime[]> {
  if (cached && cached.expires > Date.now()) return cached.runtimes;
  if (!loading) {
    loading = axios.get<PistonRuntime[]>(runtimesUrl, { timeout: 10_000, headers })
      .then(res => {
        if (!Array.isArray(res.data)) throw new Error("Invalid Piston runtime inventory");
        cached = { runtimes: res.data, expires: Date.now() + 60_000 };
        return res.data;
      }).catch(() => { throw new Error("Could not load execution runtimes"); })
      .finally(() => { loading = undefined; });
  }
  return loading;
}
export class ExecutionBusyError extends Error {
  constructor() { super("Execution service is busy. Please try again shortly."); }
}
export async function executeCode(language: string, version: string, code: string, stdin: string) {
  if (limit.activeCount + limit.pendingCount >= concurrency + maxQueue) throw new ExecutionBusyError();
  return limit(async () => {
    const runtimes = await getPistonRuntimes();
    const runtime = runtimes.find(r =>
      [r.language, ...(r.aliases ?? [])].some(n => n.toLowerCase() === language.toLowerCase())
      && r.version === version);
    if (!runtime) throw new Error("Requested language version is not installed");
    try {
      const response = await axios.post(executeUrl, {
        language: runtime.language, version: runtime.version, files: [{ content: code }], stdin,
        run_timeout: 3000, compile_timeout: 10000,
        run_memory_limit: runMemory, compile_memory_limit: compileMemory,
      }, { timeout: 15_000, headers });
      return response.data;
    } catch {
      throw new Error("Execution service is unavailable. Please try again shortly.");
    }
  });
}
