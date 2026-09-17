import { getProblemDirectory } from "@repo/db/problem-path.js";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Problem, DefaultCode, Language, TestCase, User } from "@repo/db";
import { verifyToken } from "../utils/index.js";
import { generateBoilerplates } from "@repo/boilerplate-generator";

const dedupeTestcases = <T extends { input?: string; output?: string }>(
  testcases: T[]
) => {
  const seen = new Set<string>();
  const normalizeValue = (value?: string) =>
    (value ?? "").replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();

  return testcases.filter((tc) => {
    const normalizedInput = normalizeValue(tc.input);
    const normalizedOutput = normalizeValue(tc.output);

    if (!normalizedInput && !normalizedOutput) {
      return false;
    }

    const key = `${normalizedInput}::${normalizedOutput}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const getProblems = async (req: Request, res: Response) => {
  try {
    const problems = await Problem.find({
      hidden: { $ne: true }, // ✅ include false + undefined
    })
      .select("title slug difficulty solved description")
      .lean();

    // Check if user is authenticated and get their solved problems
    let userSolvedProblems: Set<string> = new Set();
    try {
      const token = (req as any).cookies?.token || req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = verifyToken(token);
        const userId = decoded.id;
        
        if (userId) {
          const user = await User.findById(userId).select('solvedProblems').lean();
          if (user && user.solvedProblems) {
            userSolvedProblems = new Set(
              user.solvedProblems.map((id) => id.toString())
            );
          }
        }
      }
    } catch (authError) {
      // User not authenticated - not an error, just don't mark any as solved
      console.log("Get problems: User not authenticated");
    }

    // Add isSolved flag to each problem
    const problemsWithSolvedStatus = problems.map((problem) => ({
      ...problem,
      isSolved: userSolvedProblems.has(problem._id.toString())
    }));

    return res.status(200).json(problemsWithSolvedStatus);
  } catch (err) {
    console.error("Get problems error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProblemBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const problem = await Problem.findOne({
      slug,
    }).lean();

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Check if user is authenticated and if they've solved this problem
    let isSolved = false;
    try {
      const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = verifyToken(token);
        const userId = decoded.id;
        
        if (userId) {
          const user = await User.findById(userId).select('solvedProblems').lean();
          if (user && user.solvedProblems) {
            isSolved = user.solvedProblems.some(
              (solvedId) => solvedId.toString() === problem._id.toString()
            );
          }
        }
      }
    } catch (authError) {
      // User not authenticated or token invalid - not an error, just not solved
      console.log("Problem fetch: User not authenticated or token invalid");
    }

    // 🔥 load default code for this problem
    let defaultCodes = await DefaultCode.find({
      problemId: problem._id,
    }).lean();

    const testcaseDocs = await TestCase.find({
      problemId: problem._id,
      isSample: true,
    })
      .sort({ order: 1 })
      .select("input output")
      .lean();
    const sampleTestCases = dedupeTestcases(testcaseDocs);

    // 🌍 load languages
    const languages = await Language.find().lean() as any[];

    // 🧠 build map languageId → name
    const langMap = new Map(
      languages.map((l: any) => [l._id.toString(), l.name])
    );

    // 🚀 if missing default code, generate it on the fly
    if (defaultCodes.length === 0) {
      try {
        const structurePath = path.join(getProblemDirectory(problem.slug), "Structure.md");
        console.log(`[ProblemController] Checking structure at: ${structurePath}`);

        if (fs.existsSync(structurePath)) {
          const structureData = fs.readFileSync(structurePath, "utf-8");
          const generated = generateBoilerplates(structureData);
          console.log(`[ProblemController] Generated languages: ${Object.keys(generated).join(", ")}`);
          console.log(`[ProblemController] Available DB languages: ${languages.map(l => l.name).join(", ")}`);

          const newDefaultCodes = [];
          for (const [genName, code] of Object.entries(generated)) {
            if (genName.endsWith("Full")) continue;

            const matchOptions: Record<string, string[]> = {
              cpp: ["c++", "cpp"],
              javascript: ["javascript", "js"],
              python: ["python", "py"],
              rust: ["rust", "rs"]
            };

            const searchOptions = (matchOptions[genName] || [genName]).map(s => s.toLowerCase());

            const lang = languages.find((l: any) => {
              const ln = l.name.toLowerCase();
              return searchOptions.some(opt => ln === opt || ln.includes(opt) || opt.includes(ln));
            });

            if (lang) {
              console.log(`[ProblemController] Found matching lang for ${genName}: ${lang.name}`);
              const dc = await DefaultCode.findOneAndUpdate(
                { problemId: problem._id, languageId: lang._id },
                { code: code as string },
                { upsert: true, returnDocument: "after" }
              ).lean();
              if (dc) newDefaultCodes.push(dc);
            } else {
              console.warn(`[ProblemController] No matching lang found for ${genName} (searched options: ${searchOptions.join(", ")})`);
            }
          }
          defaultCodes = newDefaultCodes;
        } else {
          console.error(`[ProblemController] Structure file not found for slug: ${slug}`);
        }
      } catch (genErr) {
        console.error("Failed to generate boilerplates on the fly:", genErr);
      }
    }

    // 🎯 format for frontend
    const formattedDefaultCode: Record<string, string> = {};

    for (const dc of defaultCodes) {
      const languageId = (dc.languageId as any).toString();
      const langName = langMap.get(languageId);

      if (langName) {
        formattedDefaultCode[langName.toLowerCase()] = dc.code;
      }
    }

    return res.status(200).json({
      problem: {
        ...problem,
        sampleTestCases:
          sampleTestCases.length > 0
            ? sampleTestCases
            : problem.sampleTestCases ?? [],
        isSolved,
      },
      defaultCode: formattedDefaultCode,
    });

  } catch (err) {
    console.error("Get problem error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get solution for a specific problem
 * Requires user to have solved the problem first
 */
export const getProblemSolution = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Verify user is authenticated
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required to view solutions" });
    }

    let userId: string;
    try {
      const decoded = verifyToken(token);
      userId = decoded.id;
    } catch (authError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Find the problem
    const problem = await Problem.findOne({ slug }).lean();
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Check if user has solved this problem
    const user = await User.findById(userId).select('solvedProblems').lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hasSolved = user.solvedProblems?.some(
      (solvedId) => solvedId.toString() === problem._id.toString()
    );

    if (!hasSolved) {
      return res.status(403).json({ 
        message: "You must solve this problem first to view the solution" 
      });
    }

    // TODO: Add 'solution' field to Problem schema to store solutions per language
    // For now, return a placeholder indicating the solution feature is coming soon
    return res.status(200).json({
      message: "Solution access granted",
      problemTitle: problem.title,
      solution: {
        // Placeholder - will be populated from Problem.solution field once added to schema
        description: "Solution explanations and code will be available here soon.",
        approaches: [],
        code: {}
      },
      note: "Solution storage is being implemented. This endpoint is ready to serve solutions once they are added to the database."
    });

  } catch (err) {
    console.error("Get problem solution error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
