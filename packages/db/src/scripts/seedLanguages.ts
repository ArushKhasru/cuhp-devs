import "dotenv/config";
import { Language } from "../models";
import { connectDB, disconnectDB } from "../connection";
type Runtime = { language: string; version: string; aliases?: string[] };
const supported = [
  { name: "C++", runtime: "c++", aliases: ["c++", "cpp", "gcc", "g++"] },
  { name: "Javascript", runtime: "javascript", aliases: ["javascript", "node", "js", "nodejs"] },
  { name: "Python", runtime: "python", aliases: ["python", "python3", "py"] },
  { name: "Rust", runtime: "rust", aliases: ["rust", "rs"] },
];
export function selectInstalledLanguages(runtimes: Runtime[]) {
  return supported.map(target => {
    const matches = runtimes.filter(runtime =>
      [runtime.language, ...(runtime.aliases ?? [])].some(name => (target.aliases.includes(name.toLowerCase()) && !(target.runtime === "c++" && name.toLowerCase() === "gcc"))));
    matches.sort((a, b) => b.version.localeCompare(a.version, "en", { numeric: true }));
    const match = matches[0];
    if (!match) throw new Error("Install the " + target.name + " runtime in Piston before syncing languages");
    return { ...target, version: match.version, aliases: [...new Set([...target.aliases, match.language, ...(match.aliases ?? [])])] };
  });
}
export async function seedLanguages() {
  const url = process.env.PISTON_RUNTIMES_URL || "http://localhost:2000/api/v2/runtimes";
  const headers = process.env.PISTON_AUTH_TOKEN ? { Authorization: process.env.PISTON_AUTH_TOKEN } : undefined;
  let response: Response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new Error(
      "Cannot reach Piston. Start Docker Desktop, then run 'pnpm -w piston:up' and retry. " +
      "For a remote executor, check PISTON_RUNTIMES_URL and network access."
    );
  }
  if (!response.ok) throw new Error("Could not read installed Piston runtimes: " + response.status);
  const runtimes = await response.json() as Runtime[];
  if (!Array.isArray(runtimes) || runtimes.some(r => typeof r.language !== "string" || typeof r.version !== "string")) {
    throw new Error("Invalid Piston runtime inventory");
  }
  // Validate the full inventory before writing anything.
  const languages = selectInstalledLanguages(runtimes);
  await connectDB();
  for (const language of languages) {
    await Language.findOneAndUpdate({ name: language.name }, language, { upsert: true });
    console.log("Synced " + language.name + " " + language.version);
  }
}
if (require.main === module) {
  seedLanguages().catch(error => { console.error(error); process.exitCode = 1; }).finally(disconnectDB);
}
