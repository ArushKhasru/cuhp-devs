import { Request, Response } from "express";
import { Problem, Language, TestCase, SubmissionResult } from "@repo/db";
import { buildExecutableCode } from "../utils/buildExecutableCode";
import { executeCode, ExecutionBusyError } from "../utils/piston";
import { languageQuery, verdict } from "../utils/execution";
const labels: Record<SubmissionResult, string> = {
  PENDING: "Pending", PROCESSING: "Running", ACCEPTED: "Accepted",
  WRONG_ANSWER: "Wrong Answer", TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
  COMPILATION_ERROR: "Compilation Error", RUNTIME_ERROR: "Runtime Error", INTERNAL_ERROR: "Execution Error",
};
export const runCode = async (req: Request, res: Response) => {
  try {
    const { problemSlug, code, language } = req.body;
    const problem = await Problem.findOne({ slug: problemSlug });
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    const lang = await Language.findOne(languageQuery(language)).lean();
    if (!lang) return res.status(400).json({ message: "Invalid language" });
    const testcases = await TestCase.find({ problemId: problem._id, isSample: true }).sort({ order: 1 }).lean();
    if (!testcases.length) return res.status(400).json({ message: "No sample testcases found" });
    const executable = buildExecutableCode(problem.slug, lang.runtime, code);
    const results = [];
    for (const [i, testcase] of testcases.entries()) {
      const result = await executeCode(lang.runtime, lang.version, executable, testcase.input);
      const status = verdict(result, testcase.output);
      results.push({
        testcase: i + 1, status: labels[status],
        stdout: result.run?.stdout ?? "",
        stderr: status === SubmissionResult.COMPILATION_ERROR ? result.compile?.stderr : result.run?.stderr,
        time: result.run?.cpu_time ?? null, memory: result.run?.memory ?? null,
      });
    }
    return res.json({ results });
  } catch (error) {
    if (error instanceof ExecutionBusyError) return res.status(503).json({ message: error.message });
    console.error("Sample execution failed", error);
    return res.status(503).json({ message: "Could not run code. Please try again shortly." });
  }
};
