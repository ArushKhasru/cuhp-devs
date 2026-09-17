import path from "path";
export function getProblemsRoot() {
  return process.env.PROBLEMS_DIR
    ? path.resolve(process.env.PROBLEMS_DIR)
    : path.resolve(__dirname, "../../../apps/problems");
}
export function getProblemDirectory(slug: string) {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) throw new Error("Invalid problem slug");
  return path.join(getProblemsRoot(), slug);
}
