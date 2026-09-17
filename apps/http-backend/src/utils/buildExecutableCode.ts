import fs from "fs";
import path from "path";
import { getProblemDirectory } from "@repo/db/problem-path.js";
const extensionMap: Record<string, string> = {
  python: "py", javascript: "js", node: "js", "c++": "cpp", cpp: "cpp", gcc: "cpp", rust: "rs",
};
export function buildExecutableCode(problemSlug: string, runtime: string, userCode: string) {
  const ext = extensionMap[runtime];
  if (!ext) throw new Error("Unsupported runtime: " + runtime);
  const wrapper = fs.readFileSync(path.join(getProblemDirectory(problemSlug), "boilerplate-full", "function." + ext), "utf8");
  if (!wrapper.includes("## USER_CODE_HERE ##")) throw new Error("Problem wrapper is missing its code placeholder");
  // A callback preserves literal dollar sequences in submitted source.
  return wrapper.replace("## USER_CODE_HERE ##", () => userCode);
}
