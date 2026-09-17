// Run after pnpm --filter web build. Uses an isolated fake API and no database.
const assert = require("node:assert/strict");
const http = require("node:http");
const { spawn } = require("node:child_process");
const path = require("node:path");
const { createRequire } = require("node:module");
const requireWeb = createRequire(path.resolve(__dirname, "../apps/web/package.json"));
const listen = server => new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => resolve(server.address().port));
});
async function main() {
  const backend = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = req.url === "/user/profile/handle/existing-user" || req.url === "/user/profile" ? 401 : 404;
    res.end(JSON.stringify({ message: res.statusCode === 404 ? "User not found" : "Not authorized" }));
  });
  const backendPort = await listen(backend);
  let child;
  try {
    const reservation = http.createServer();
    const port = await listen(reservation);
    await new Promise(resolve => reservation.close(resolve));
    let logs = "";
    child = spawn(process.execPath, [requireWeb.resolve("next/dist/bin/next"), "start", "--port", String(port)], {
      cwd: path.resolve(__dirname, "../apps/web"),
      env: { ...process.env, HTTP_BACKEND_URL: "http://127.0.0.1:" + backendPort, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    child.stdout.on("data", data => logs += data);
    child.stderr.on("data", data => logs += data);
    const base = "http://127.0.0.1:" + port;
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error("Next exited: " + logs);
      try { if ((await fetch(base + "/signin")).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert(ready, "Next did not start: " + logs);
    for (const slug of ["activities", "features", "unknown-page"]) {
      for (const headers of [{}, { Cookie: "token=profile-route-smoke" }]) {
        const response = await fetch(base + "/" + slug, { headers, redirect: "manual" });
        await response.text();
        assert.equal(response.status, 404, slug + " must return HTTP 404");
      }
    }
    const protectedProfile = await fetch(base + "/existing-user", { redirect: "manual" });
    await protectedProfile.text();
    assert.equal(protectedProfile.status, 307);
    assert.equal(new URL(protectedProfile.headers.get("location"), base).pathname, "/signin");
    console.log("PASS: missing profile URLs return HTTP 404 with or without a session; existing profiles require sign-in.");
  } finally {
    if (child && child.exitCode === null) {
      const exited = new Promise(resolve => child.once("exit", resolve));
      child.kill();
      await exited;
    }
    await new Promise(resolve => backend.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
