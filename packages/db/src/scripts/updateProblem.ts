import { getProblemDirectory } from "../problem-path";
import path from "path";
import fs from "fs/promises";
import { Problem, DefaultCode, Language } from "@repo/db";
import { LANGUAGE_MAPPING } from "@repo/common";


async function readFileSafe(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function updateProblem(slug: string) {
  const problemDir = getProblemDirectory(slug);

  const problemMd = await readFileSafe(
    path.join(problemDir, "Problem.md")
  );

  if (!problemMd) throw new Error("Problem.md not found");

  const titleMatch = problemMd.match(/^# (.*)/);
  const title = titleMatch?.[1]?.trim() ?? slug;
  // Clean up title from markdown if needed or use slug as fallback

  const problem = await Problem.findOneAndUpdate(
    { slug },
    {
      title,
      slug,
      description: problemMd,
      hidden: false,
    },
    { upsert: true, returnDocument: "after" }
  );
  if (!problem) throw new Error("Failed to sync problem to database");

  const languages = await Language.find();

  const languageMap = new Map(
    languages.map((l) => [l.name.toLowerCase(), l._id])
  );

  await Promise.all(
    Object.entries(LANGUAGE_MAPPING).map(async ([ext, langName]) => {
      const filePath = path.join(
        problemDir,
        "boilerplate",
        `function.${ext}`
      );

      const code = await readFileSafe(filePath);
      if (!code) return;

      const languageId = languageMap.get(langName.toLowerCase());
      if (!languageId) return;

      await DefaultCode.findOneAndUpdate(
        { problemId: problem._id, languageId },
        { code },
        { upsert: true, returnDocument: "after" }
      );

      console.log(`✅ ${slug} → ${langName}`);
    })
  );

  console.log(`🎉 Problem synced: ${slug}`);
}
