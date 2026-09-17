const { test } = require("node:test");
const assert = require("node:assert/strict");
const { selectInstalledLanguages } = require("../packages/db/dist/scripts/seedLanguages");
test("language seeds use installed versions and fail before writes when a runtime is missing", () => {
  const inventory = [
    { language: "c", version: "99.0.0", aliases: ["gcc"] },
    { language: "python", version: "3.9.4" },
    { language: "python", version: "3.10.0" },
    { language: "javascript", version: "18.15.0", aliases: ["node"] },
    { language: "gcc", version: "10.2.0", aliases: ["c++"] },
    { language: "rust", version: "1.68.2" },
  ];
  const languages = selectInstalledLanguages(inventory);
  assert.equal(languages.find(l => l.runtime === "python").version, "3.10.0");
  assert.equal(languages.find(l => l.runtime === "c++").version, "10.2.0");
  assert.throws(() => selectInstalledLanguages(inventory.filter(r => r.language !== "rust")), /Rust/);
});
