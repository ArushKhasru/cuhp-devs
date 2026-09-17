import { Response } from "express";
import { Problem, Submission, SubmissionResult, TestCase, Language, User } from "@repo/db";
import { AuthRequest } from "../middleware/auth.middleware";
import { buildExecutableCode } from "../utils/buildExecutableCode";
import { languageQuery } from "../utils/execution";

export const createSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { problemSlug, code, language } = req.body;
    const problem = await Problem.findOne({ slug: problemSlug });
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    const lang = await Language.findOne(languageQuery(language));
    if (!lang) return res.status(400).json({ message: "Invalid language" });
    const testcases = await TestCase.find({ problemId: problem._id }).sort({ order: 1 }).lean();
    if (!testcases.length) return res.status(400).json({ message: "No testcases found" });
    // The client can never choose the verdict. Snapshot inputs and expected outputs together.
    const submission = await Submission.create({
      userId, problemId: problem._id, code, language,
      status: SubmissionResult.PENDING,
      runtime: lang.runtime, version: lang.version,
      executableCode: buildExecutableCode(problem.slug, lang.runtime, code),
      totalTestcases: testcases.length,
      testcaseInputs: testcases.map(tc => tc.input),
      expectedOutputs: testcases.map(tc => tc.output),
    });
    return res.status(202).json({ submissionId: submission._id, status: submission.status });
  } catch (error) {
    console.error("Create submission failed", error);
    return res.status(500).json({ message: "Could not queue submission" });
  }
};
export const getUserSubmissionsForProblem = async (req: AuthRequest, res: Response) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug });
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    const submissions = await Submission.find({ userId: req.user.id, problemId: problem._id })
      .select("status language createdAt").sort({ createdAt: -1 }).limit(10).lean();
    return res.json(submissions);
  } catch {
    return res.status(500).json({ message: "Could not load submissions" });
  }
};
export const getSubmissionById = async (req: AuthRequest, res: Response) => {
  if (!/^[a-f\d]{24}$/i.test(String(req.params.id))) return res.status(400).json({ message: "Invalid submission ID" });
  try {
    const submission = await Submission.findOne({ _id: req.params.id, userId: req.user.id })
      .select("status language createdAt testcasesPassed totalTestcases failedTestcase").lean();
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    const user = await User.findById(req.user.id).select("streak").lean();
    return res.json({ ...submission, streak: user?.streak ?? 0 });
  } catch {
    return res.status(500).json({ message: "Could not load submission" });
  }
};
