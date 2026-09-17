const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { createRequire } = require("node:module");
const backendRequire = createRequire(path.resolve(__dirname, "../apps/http-backend/package.json"));
const { verdict, parseExecutionInput, languageQuery } = require("../apps/http-backend/dist/utils/execution");
const { buildExecutableCode } = require("../apps/http-backend/dist/utils/buildExecutableCode");

test("judging never accepts compiler failures, crashes, missing runs, or timeouts", () => {
  assert.equal(verdict({ compile: { code: 1 }, run: { code: 0, stdout: "42" } }, "42"), "COMPILATION_ERROR");
  assert.equal(verdict({ run: { code: 1, stdout: "42" } }, "42"), "RUNTIME_ERROR");
  assert.equal(verdict({ run: { code: 0, signal: "SIGTERM", stdout: "42" } }, "42"), "RUNTIME_ERROR");
  assert.equal(verdict({ run: { code: null, status: "TO" } }, ""), "TIME_LIMIT_EXCEEDED");
  assert.equal(verdict({}, ""), "INTERNAL_ERROR");
  assert.equal(verdict({ run: { code: 0, stdout: "43" } }, "42"), "WRONG_ANSWER");
  assert.equal(verdict({ run: { code: 0, stdout: "42\n" } }, "42"), "ACCEPTED");
});

test("execution input rejects traversal, oversized code and malformed language; strips verdict", () => {
  const input = { problemSlug: "two-sum", language: "C++", code: "return 42;", status: "ACCEPTED" };
  assert.equal(parseExecutionInput(input).status, undefined);
  for (const change of [
    { problemSlug: "../../secret" }, { code: "x".repeat(65537) }, { language: {} }, { code: "" },
  ]) assert.throws(() => parseExecutionInput({ ...input, ...change }));
  const expression = languageQuery("c++").$or[0].name;
  assert(expression.test("C++"));
  assert(!expression.test("c"));
  assert(!languageQuery(".*").$or[0].name.test("python"));
});

test("wrappers preserve literal dollar sequences and resolve independently of cwd", () => {
  const code = 'const literal = "$& $$ $' + "'" + '";';
  const current = process.cwd();
  try {
    process.chdir(os.tmpdir());
    const result = buildExecutableCode("two-sum", "javascript", code);
    assert(result.includes(code));
    assert(!result.includes("## USER_CODE_HERE ##"));
    assert.throws(() => buildExecutableCode("../two-sum", "javascript", code));
  } finally { process.chdir(current); }
});

test("all callers share execution capacity; overflow is rejected and memory limits reach Piston", async t => {
  let active = 0, peak = 0;
  const payloads = [];
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.method === "GET") return res.end(JSON.stringify([{ language: "python", version: "3.10.0" }]));
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      payloads.push(JSON.parse(body));
      active++; peak = Math.max(peak, active);
      setTimeout(() => {
        active--;
        res.end(JSON.stringify({ run: { code: 0, stdout: "42" } }));
      }, 30);
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = "http://127.0.0.1:" + server.address().port;
  process.env.PISTON_URL = url + "/execute";
  process.env.PISTON_RUNTIMES_URL = url + "/runtimes";
  process.env.EXECUTION_CONCURRENCY = "2";
  process.env.EXECUTION_QUEUE_SIZE = "2";
  const { executeCode, ExecutionBusyError } = require("../apps/http-backend/dist/utils/piston");
  const results = await Promise.allSettled(Array.from({ length: 8 }, () => executeCode("python", "3.10.0", "print(42)", "")));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 4);
  assert(results.filter(r => r.status === "rejected").every(r => r.reason instanceof ExecutionBusyError));
  assert.equal(peak, 2);
  assert(payloads.every(p => p.run_memory_limit === 128 * 1024 * 1024 && p.compile_memory_limit === 512 * 1024 * 1024));
  await assert.rejects(executeCode("python", "0.0.0", "", ""), /not installed/);
});
