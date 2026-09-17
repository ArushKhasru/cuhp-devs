import { getProblemsRoot } from "../problem-path";
import "dotenv/config";
import fs from "fs/promises";
import { connectDB } from "@repo/db";
import { updateProblem } from "./updateProblem";

const PROBLEMS_PATH = getProblemsRoot();

async function getAllProblemSlugs() {
  const entries = await fs.readdir(PROBLEMS_PATH, {
    withFileTypes: true,
  });

  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

async function run() {
  await connectDB();

  const slugs = await getAllProblemSlugs();

  console.log(`🚀 Syncing ${slugs.length} problems...\n`);

  for (const slug of slugs) {
    await updateProblem(slug);
  }

  console.log("\n🎉 All problems synced");
  process.exit(0);
}

run().catch(error => { console.error(error); process.exit(1); });
