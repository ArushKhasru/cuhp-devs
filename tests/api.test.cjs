const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { createRequire } = require("node:module");
const requireBackend = createRequire(path.resolve(__dirname, "../apps/http-backend/package.json"));
process.env.JWT_SECRET = "isolated-regression-test-secret";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.BACKEND_CORS_ORIGINS = "http://localhost:3000";
const db = requireBackend("@repo/db");
const { signToken } = require("../apps/http-backend/dist/utils");
const { createApp } = require("../apps/http-backend/dist/app");
const userId = "123456789012345678901234";
const token = signToken({ id: userId, email: "test@example.invalid" });
const headers = { "Content-Type": "application/json", Authorization: "Bearer " + token };
const input = { problemSlug: "two-sum", language: "javascript", code: "function twoSum() { return [0, 1]; }", status: "ACCEPTED" };

test("API authentication, validation, rate limiting and server-owned submission state", async t => {
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = "http://127.0.0.1:" + server.address().port;
  assert.equal((await fetch(base + "/health/live")).status, 200);
  assert.equal((await fetch(base + "/health/ready")).status, 503);
  for (const endpoint of ["/runCode", "/submissions"]) {
    const response = await fetch(base + endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    assert.equal(response.status, 401);
  }
  assert.equal((await fetch(base + "/runCode", { method: "POST", headers: { ...headers, Origin: "https://untrusted.invalid" }, body: JSON.stringify(input) })).status, 403);
  assert.equal((await fetch(base + "/runCode", { method: "POST", headers, body: JSON.stringify({ ...input, problemSlug: "../secret" }) })).status, 400);
  t.mock.method(db.Problem, "findOne", async () => ({ _id: "aaaaaaaaaaaaaaaaaaaaaaaa", slug: "two-sum" }));
  t.mock.method(db.Language, "findOne", async () => ({ runtime: "javascript", version: "18.15.0" }));
  t.mock.method(db.TestCase, "find", () => ({ sort: () => ({ lean: async () => [{ input: "sample", output: "expected" }, { input: "hidden", output: "secret" }] }) }));
  const created = [];
  t.mock.method(db.Submission, "create", async value => { created.push(value); return { ...value, _id: "bbbbbbbbbbbbbbbbbbbbbbbb" }; });
  const reward = t.mock.method(db.User, "updateOne", () => { throw new Error("Must not reward unjudged submissions"); });
  const response = await fetch(base + "/submissions", { method: "POST", headers, body: JSON.stringify(input) });
  assert.equal(response.status, 202);
  const queued = await response.json();
  assert.equal(queued.status, "PENDING");
  assert.equal(queued.expectedOutputs, undefined);
  assert.equal(created[0].status, "PENDING");
  assert.deepEqual(created[0].testcaseInputs, ["sample", "hidden"]);
  assert.deepEqual(created[0].expectedOutputs, ["expected", "secret"]);
  assert.equal(reward.mock.calls.length, 0);
  for (let i = 0; i < 9; i++) {
    assert.equal((await fetch(base + "/submissions", { method: "POST", headers, body: JSON.stringify(input) })).status, 202);
  }
  const limited = await fetch(base + "/runCode", { method: "POST", headers, body: JSON.stringify(input) });
  assert.equal(limited.status, 429);
  assert(Number(limited.headers.get("retry-after")) > 0);
  assert.equal((await fetch(base + "/submissions/not-an-id", { headers })).status, 400);
});

test("submission polling filters by the authenticated owner and hides internal fields", async t => {
  let filter, projection;
  t.mock.method(db.Submission, "findOne", query => {
    filter = query;
    return { select: fields => { projection = fields; return { lean: async () => null }; } };
  });
  const { getSubmissionById } = require("../apps/http-backend/dist/controller/submission.controller");
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await getSubmissionById({ user: { id: userId }, params: { id: "bbbbbbbbbbbbbbbbbbbbbbbb" } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(filter.userId, userId);
  assert(!projection.includes("expectedOutputs"));
  assert(!projection.includes("testcaseInputs"));
  assert(!projection.includes("leaseToken"));
});


test("missing profile handles return 404 before auth while existing profiles stay protected", async t => {
  t.mock.method(db.User, "exists", async ({ handle }) => handle === "existing-user" ? { _id: userId } : null);
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = "http://127.0.0.1:" + server.address().port;
  for (const slug of ["activities", "features", "unknown-page"]) {
    for (const requestHeaders of [{}, headers]) {
      const response = await fetch(base + "/user/profile/handle/" + slug, { headers: requestHeaders });
      assert.equal(response.status, 404, slug);
      assert.equal((await response.json()).message, "User not found");
    }
  }
  assert.equal((await fetch(base + "/user/profile/handle/existing-user")).status, 401);
  assert.equal((await fetch(base + "/user/profile")).status, 401);
});
