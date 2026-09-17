import { randomUUID } from "crypto";
import { Submission, TestCase, User, SubmissionResult } from "@repo/db";
import { executeCode } from "../utils/piston";
import { verdict } from "../utils/execution";

const LEASE_MS = 90_000;
const MAX_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export async function processNextSubmission() {
  const now = new Date();
  const stale = { status: SubmissionResult.PROCESSING, $or: [
    { leaseExpiresAt: { $lte: now } },
    { leaseExpiresAt: { $exists: false }, updatedAt: { $lte: new Date(now.getTime() - LEASE_MS) } },
  ] };
  await Submission.updateMany({ ...stale, attempts: { $gte: MAX_ATTEMPTS } }, {
    $set: { status: SubmissionResult.INTERNAL_ERROR }, $unset: { leaseToken: "", leaseExpiresAt: "" },
  });
  const token = randomUUID();
  const sub = await Submission.findOneAndUpdate({
    $and: [
      { $or: [{ status: SubmissionResult.PENDING }, stale] },
      { $or: [{ attempts: { $lt: MAX_ATTEMPTS } }, { attempts: { $exists: false } }] },
    ],
  }, {
    $set: { status: SubmissionResult.PROCESSING, leaseToken: token, leaseExpiresAt: new Date(now.getTime() + LEASE_MS) },
    $inc: { attempts: 1 },
  }, { new: true, sort: { createdAt: 1 } })
    .select("+expectedOutputs +testcaseInputs +executableCode +leaseToken +attempts");
  if (!sub) return false;

  const owner = { _id: sub._id, status: SubmissionResult.PROCESSING, leaseToken: token };
  let lostLease = false;
  let renewing = false;
  const heartbeat = setInterval(async () => {
    if (renewing) return;
    renewing = true;
    try {
      const result = await Submission.updateOne({ ...owner, leaseExpiresAt: { $gt: new Date() } },
        { $set: { leaseExpiresAt: new Date(Date.now() + LEASE_MS) } });
      if (!result.matchedCount) lostLease = true;
    } catch { lostLease = true; }
    finally { renewing = false; }
  }, 20_000);
  heartbeat.unref();

  let status = SubmissionResult.ACCEPTED;
  let passed = 0;
  let failedTestcase: number | undefined;
  try {
    let inputs = sub.testcaseInputs;
    let outputs = sub.expectedOutputs;
    // Jobs queued by older versions did not snapshot inputs.
    if (!inputs?.length) {
      const cases = await TestCase.find({ problemId: sub.problemId }).sort({ order: 1 }).lean();
      inputs = cases.map(tc => tc.input);
      outputs = cases.map(tc => tc.output);
    }
    if (!inputs.length || inputs.length !== outputs.length || inputs.length !== sub.totalTestcases) {
      throw new Error("Missing or inconsistent submission testcases");
    }
    for (let i = 0; i < inputs.length; i++) {
      if (lostLease) return true;
      const result = await executeCode(sub.runtime, sub.version, sub.executableCode, inputs[i]!);
      status = verdict(result, outputs[i]!);
      if (status !== SubmissionResult.ACCEPTED) { failedTestcase = i + 1; break; }
      passed++;
    }
  } catch (error) {
    console.error("Submission execution failed", error);
    status = SubmissionResult.INTERNAL_ERROR;
  } finally {
    clearInterval(heartbeat);
  }
  if (lostLease) return true;

  // Verdict and reward commit together. A restart cannot record success without the reward.
  // MongoDB must be a replica set (Atlas provides this).
  const session = await Submission.db.startSession();
  try {
    await session.withTransaction(async () => {
      const saved = await Submission.updateOne({ ...owner, leaseExpiresAt: { $gt: new Date() } }, {
        $set: { status, testcasesPassed: passed, ...(failedTestcase ? { failedTestcase } : {}) },
        $unset: { leaseToken: "", leaseExpiresAt: "" },
      }, { session });
      if (!saved.matchedCount || status !== SubmissionResult.ACCEPTED) return;
      const acceptedAt = new Date();
      const dayDifference = { $dateDiff: {
        startDate: { $ifNull: ["$lastStreakUpdate", new Date(0)] },
        endDate: acceptedAt, unit: "day", timezone: "UTC",
      } };
      await User.updateOne({ _id: sub.userId, solvedProblems: { $ne: sub.problemId } }, [{
        $set: {
          solvedProblems: { $setUnion: [{ $ifNull: ["$solvedProblems", []] }, [sub.problemId]] },
          streak: { $switch: { branches: [
            { case: { $eq: [dayDifference, 0] }, then: { $ifNull: ["$streak", 1] } },
            { case: { $eq: [dayDifference, 1] }, then: { $add: [{ $ifNull: ["$streak", 0] }, 1] } },
          ], default: 1 } },
          lastStreakUpdate: acceptedAt,
        },
      }], { session });
    });
  } finally {
    await session.endSession();
  }
  return true;
}

export function startResultWorker() {
  let stopped = false;
  const done = (async () => {
    while (!stopped) {
      try {
        if (await processNextSubmission()) continue;
      } catch (error) {
        // Failed finalization leaves a leased job for recovery, never a false accepted verdict.
        console.error("Submission worker error", error);
      }
      if (!stopped) await sleep(2000);
    }
  })();
  return { stop: async () => { stopped = true; await done; } };
}
