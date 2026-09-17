import "dotenv/config";
import { connectDB } from "@repo/db";
import { updateProblem } from "./updateProblem";

const slug = process.argv[2];

if (!slug) {
  console.log("Provide problem slug");
  process.exit(1);
}

async function run() {
  await connectDB();
  if (!slug) {
    console.log("Provide problem slug");
    process.exit(1);
  }
  await updateProblem(slug);
  process.exit(0);
}

run().catch(error => { console.error(error); process.exit(1); });