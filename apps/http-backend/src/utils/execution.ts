import { SubmissionResult } from "@repo/db";

export function verdict(result: any, expected: string): SubmissionResult {
  if (result?.compile && result.compile.code !== 0) return SubmissionResult.COMPILATION_ERROR;
  const run = result?.run;
  if (!run) return SubmissionResult.INTERNAL_ERROR;
  if (run.status === "TO") return SubmissionResult.TIME_LIMIT_EXCEEDED;
  if (run.code !== 0 || run.signal) return SubmissionResult.RUNTIME_ERROR;
  return (run.stdout ?? "").trim() === expected.trim()
    ? SubmissionResult.ACCEPTED : SubmissionResult.WRONG_ANSWER;
}

export function parseExecutionInput(body: any) {
  const { problemSlug, code, language } = body ?? {};
  if (typeof problemSlug !== "string" || !/^[a-z0-9-]{1,120}$/.test(problemSlug)
    || typeof language !== "string" || !language.trim() || language.length > 50
    || typeof code !== "string" || !code.trim() || Buffer.byteLength(code) > 64 * 1024) {
    throw new Error("Provide a valid problem, language, and code (up to 64 KB).");
  }
  return { problemSlug, code, language: language.trim() };
}

export function languageQuery(language: string) {
  const escaped = language.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}$`, "i");
  return { $or: [{ name: pattern }, { runtime: pattern }, { aliases: pattern }] };
}
