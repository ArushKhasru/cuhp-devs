import fs from "fs";
import path from "path";
import { getProblemDirectory } from "@repo/db/problem-path.js";
export function loadTestcases(slug: string) {
  const base = path.join(getProblemDirectory(slug), "tests");
  const inputs = fs.readdirSync(path.join(base, "input")).filter(file => file.endsWith(".txt"))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  return inputs.map(file => ({
    stdin: fs.readFileSync(path.join(base, "input", file), "utf8"),
    expected: fs.readFileSync(path.join(base, "output", file), "utf8"),
  }));
}
