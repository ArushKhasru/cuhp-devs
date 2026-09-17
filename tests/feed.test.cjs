const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function loadTypeScript(relativePath, requireMock) {
  const filename = path.resolve(__dirname, "..", relativePath);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(requireMock, module, module.exports);
  return module.exports;
}

function createFeed(initialPosts = []) {
  const state = [];
  const effects = [];
  const listeners = {};
  let resolveCreate;
  const createResponse = new Promise(resolve => { resolveCreate = resolve; });
  const helpers = loadTypeScript("apps/web/lib/feed-posts.ts", require);
  const mocks = {
    react: {
      useState(value) {
        const index = state.length;
        state.push(value);
        return [value, update => { state[index] = typeof update === "function" ? update(state[index]) : update; }];
      },
      useEffect: effect => effects.push(effect),
      useRef: value => ({ current: value }),
    },
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    "@repo/ui/community/Feed": () => null,
    "../lib/api": { apiFetch: () => createResponse },
    "../lib/feed-posts": helpers,
    "../store/useAuthStore": { useAuthStore: () => ({ user: { id: "author" }, token: "test-token" }) },
    "../store/useToastStore": { toast: { success() {}, error() {} } },
    "socket.io-client": { io: () => ({ on: (event, callback) => { listeners[event] = callback; }, disconnect() {} }) },
  };
  const { default: FeedClient } = loadTypeScript("apps/web/components/FeedClient.tsx", name => {
    assert.ok(name in mocks, `Unexpected import: ${name}`);
    return mocks[name];
  });
  const rendered = FeedClient({ initialData: { posts: initialPosts, trendingTags: [], leaderboard: [], events: [] } });
  const cleanup = effects[0]();
  return {
    posts: () => state[0],
    publish: () => rendered.props.onPost({ content: "my first win", type: "WIN" }),
    broadcast: post => listeners["new-post"](post),
    respond: post => resolveCreate({ post }),
    cleanup,
  };
}

for (const socketFirst of [true, false]) {
  test(`a created post renders once when ${socketFirst ? "socket" : "HTTP response"} arrives first`, async () => {
    const existing = { _id: "older", content: "older post" };
    const feed = createFeed([existing]);
    try {
      const pending = feed.publish();
      const post = { _id: "new", content: "my first win" };
      if (socketFirst) feed.broadcast(post);
      feed.respond(post);
      await pending;
      if (!socketFirst) feed.broadcast(post);
      feed.broadcast({ id: "new", content: "my first win" });
      assert.deepEqual(feed.posts().map(post => post.id || post._id), ["new", "older"]);
      assert.equal(feed.posts()[1], existing);
    } finally { feed.cleanup(); }
  });
}

test("distinct posts with identical content are retained", () => {
  const initial = [{ _id: "first", content: "same content" }];
  const feed = createFeed(initial);
  try {
    feed.broadcast({ _id: "second", content: "same content" });
    assert.deepEqual(feed.posts().map(post => post._id), ["second", "first"]);
    assert.equal(initial.length, 1);
  } finally { feed.cleanup(); }
});
