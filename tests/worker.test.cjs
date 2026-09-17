const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { createRequire } = require("node:module");
const requireBackend = createRequire(path.resolve(__dirname, "../apps/http-backend/package.json"));
const db = requireBackend("@repo/db");
const piston = require("../apps/http-backend/dist/utils/piston");
const { processNextSubmission } = require("../apps/http-backend/dist/workers/result.worker");

function setup(t, options = {}) {
  const job = {
    _id: "job", userId: "user", problemId: "problem", runtime: "python", version: "3.10.0",
    executableCode: "print(42)", testcaseInputs: ["sample", "hidden"], expectedOutputs: ["42", "43"],
    totalTestcases: 2, ...options.job,
  };
  const writes = [], rewards = [];
  t.mock.method(db.Submission, "updateMany", async () => ({ modifiedCount: 0 }));
  t.mock.method(db.Submission, "findOneAndUpdate", (_filter, update) => {
    job.leaseToken = update.$set.leaseToken;
    return { select: async () => job };
  });
  t.mock.method(db.Submission, "updateOne", async (_filter, update) => {
    writes.push(update);
    return { matchedCount: options.lostLease ? 0 : 1 };
  });
  const session = { async withTransaction(callback) { await callback(); }, async endSession() {} };
  t.mock.method(db.Submission.db, "startSession", async () => session);
  t.mock.method(db.User, "updateOne", async (filter, update, options) => { rewards.push({ filter, update, options }); return { matchedCount: 1 }; });
  return { job, writes, rewards, session };
}

test("hidden test failure overrides passing samples and never awards a solve", async t => {
  const state = setup(t);
  let executions = 0;
  t.mock.method(piston, "executeCode", async () => { executions++; return { run: { code: 0, stdout: "42" } }; });
  await processNextSubmission();
  assert.equal(executions, 2);
  assert.equal(state.writes[0].$set.status, "WRONG_ANSWER");
  assert.equal(state.writes[0].$set.testcasesPassed, 1);
  assert.equal(state.writes[0].$set.failedTestcase, 2);
  assert.equal(state.rewards.length, 0);
});

test("accepted jobs commit the verdict and reward in the same transaction", async t => {
  const state = setup(t);
  t.mock.method(piston, "executeCode", async (_l, _v, _c, input) => ({ run: { code: 0, stdout: input === "sample" ? "42" : "43" } }));
  await processNextSubmission();
  assert.equal(state.writes[0].$set.status, "ACCEPTED");
  assert.equal(state.writes[0].$set.testcasesPassed, 2);
  assert.equal(state.rewards.length, 1);
  assert.equal(state.rewards[0].options.session, state.session);
  assert.equal(state.rewards[0].filter.solvedProblems.$ne, state.job.problemId);
});

test("an old worker whose lease was replaced cannot award a solve", async t => {
  const state = setup(t, { lostLease: true });
  t.mock.method(piston, "executeCode", async (_l, _v, _c, input) => ({ run: { code: 0, stdout: input === "sample" ? "42" : "43" } }));
  await processNextSubmission();
  assert.equal(state.rewards.length, 0);
});

test("missing testcases produce internal error, never acceptance", async t => {
  const state = setup(t, { job: { testcaseInputs: ["one"], expectedOutputs: [] } });
  const execute = t.mock.method(piston, "executeCode", async () => { throw new Error("offline"); });
  await processNextSubmission();
  assert.equal(execute.mock.calls.length, 0);
  assert.equal(state.writes[0].$set.status, "INTERNAL_ERROR");
  assert.equal(state.rewards.length, 0);
});

test("compiler failure is recorded correctly without awarding a solve", async t => {
  const state = setup(t);
  t.mock.method(piston, "executeCode", async () => ({ compile: { code: 1, stderr: "bad source" } }));
  await processNextSubmission();
  assert.equal(state.writes[0].$set.status, "COMPILATION_ERROR");
  assert.equal(state.rewards.length, 0);
});

test("an unavailable executor cannot award a solve", async t => {
  const state = setup(t);
  t.mock.method(piston, "executeCode", async () => { throw new Error("executor offline"); });
  await processNextSubmission();
  assert.equal(state.writes[0].$set.status, "INTERNAL_ERROR");
  assert.equal(state.rewards.length, 0);
});
