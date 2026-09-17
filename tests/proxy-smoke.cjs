// Run after pnpm --filter web build. Uses a local fake API, never a real database.
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
  const observed = [];
  const backend = http.createServer((req, res) => {
    observed.push({ path: req.url, cookie: req.headers.cookie });
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/auth/signin") {
      res.setHeader("Set-Cookie", "token=proxy-smoke; Path=/; HttpOnly; SameSite=Lax");
      return res.end(JSON.stringify({ user: { fullName: "Proxy Test" } }));
    }
    if (req.url === "/auth/github") {
      res.statusCode = 302;
      res.setHeader("Set-Cookie", ["github_oauth_state=state; Path=/; HttpOnly; SameSite=Lax", "github_oauth_redirect=frontend; Path=/; HttpOnly; SameSite=Lax"]);
      res.setHeader("Location", "https://github.com/login/oauth/authorize");
      return res.end();
    }
    if (req.url === "/user/profile") {
      if (req.headers.cookie !== "token=proxy-smoke") {
        res.statusCode = 401; return res.end("{}");
      }
      return res.end(JSON.stringify({ fullName: "Proxy Test", handle: "proxy-test", streak: 0 }));
    }
    res.end("[]");
  });
  // The default production build rewrites to localhost:3001.
  await new Promise((resolve, reject) => {
    backend.once("error", reject);
    backend.listen(3001, resolve);
  });
  let child;
  try {
    const reservation = http.createServer();
    const port = await listen(reservation);
    await new Promise(resolve => reservation.close(resolve));
    let logs = "";
    child = spawn(process.execPath, [requireWeb.resolve("next/dist/bin/next"), "start", "--port", String(port)], {
      cwd: path.resolve(__dirname, "../apps/web"),
      env: { ...process.env, HTTP_BACKEND_URL: "http://localhost:3001", NEXT_TELEMETRY_DISABLED: "1" },
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
    const login = await fetch(base + "/api/auth/signin", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie");
    assert(cookie.includes("token=proxy-smoke"));
    assert(cookie.includes("HttpOnly"));
    assert(!/domain=/i.test(cookie));
    const oauth = await fetch(base + "/api/auth/github", { redirect: "manual" });
    assert.equal(oauth.status, 302);
    assert.equal(oauth.headers.getSetCookie().length, 2);
    assert.equal(oauth.headers.get("location"), "https://github.com/login/oauth/authorize");
    const page = await fetch(base + "/practice", { headers: { Cookie: "token=proxy-smoke" } });
    await page.text();
    assert.equal(page.status, 200);
    assert(observed.some(req => req.path === "/user/profile" && req.cookie === "token=proxy-smoke"));
    console.log("PASS: API proxy forwards session cookies, OAuth redirects and multiple cookies; server-rendered pages forward the same session.");
  } finally {
    if (child && child.exitCode === null) {
      child.kill();
      await new Promise(resolve => child.once("exit", resolve));
    }
    await new Promise(resolve => backend.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
