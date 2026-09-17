import { getProblemsRoot } from "../problem-path";
import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

import { Problem, TestCase } from "../models";
import { connectDB } from "../connection";

const PROBLEMS_DIR = getProblemsRoot();
console.log(`[SeedTestcases] Using PROBLEMS_DIR: ${PROBLEMS_DIR}`);

async function seed() {
  await connectDB();

  const problemSlugs = fs.readdirSync(PROBLEMS_DIR);

  for (const slug of problemSlugs) {
    const problem = await Problem.findOne({ slug });

    if (!problem) {
      console.log(`❌ Problem not found in DB: ${slug}`);
      continue;
    }

    const inputDir = path.join(PROBLEMS_DIR, slug, "tests", "input");

    const outputDir = path.join(PROBLEMS_DIR, slug, "tests", "output");

    if (!fs.existsSync(inputDir)) continue;

    const inputFiles = fs
      .readdirSync(inputDir)
      .filter((f) => f.endsWith(".txt"))
      .sort((a, b) => parseInt(a) - parseInt(b));

    const testcases: any[] = [];
    for (let i = 0; i < inputFiles.length; i++) {
      const file = inputFiles[i];
      if (!file) continue;
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);

      if (!fs.existsSync(outputPath)) {
        console.log(`Missing output for ${file}`);
        continue;
      }

      const input = fs.readFileSync(inputPath, "utf-8").trim();
      const output = fs.readFileSync(outputPath, "utf-8").trim();

      if (!input || !output) {
        console.log(`Empty testcase skipped: ${file}`);
        continue;
      }

      testcases.push({
        problemId: problem._id,
        input,
        output,
        isSample: true,
        order: i,
      });
    }

    await TestCase.deleteMany({
      problemId: problem._id,
      isSample: true,
    });

    if (testcases.length > 0) {
      await TestCase.insertMany(testcases);
    }

    console.log(`✅ Seeded ${testcases.length} testcases for ${slug}`);
  }

  await mongoose.disconnect();
}

seed().catch(error => { console.error(error); process.exit(1); });
