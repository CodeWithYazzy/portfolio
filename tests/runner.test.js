"use strict";
const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const runner = require("../demo-runner");
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  runner.clearCache();
});
test("GitHub URL parser rejects active schemes, credentials, spoofed hosts and encoded traversal", () => {
  for (const url of [
    "http://github.com/a/b",
    "https://evil.github.com/a/b",
    "https://github.com.evil.test/a/b",
    "https://u:p@github.com/a/b",
    "javascript:alert(1)",
    "https://github.com/a/b/tree/main/%E0%A4%A",
    "https://github.com/a/b/tree/main/a%2fb",
    "https://github.com/a/b/issues",
  ])
    assert.equal(runner.parseGithubUrl(url), null, url);
  assert.equal(
    runner.parseGithubUrl(
      "https://github.com/CodeWithYazzy/portfolio/tree/main/assets",
    ).subdir,
    "assets",
  );
});
test("repository path resolver constrains paths to repository and preserves nested parent resolution", () => {
  assert.equal(runner.resolvePath("css/", "../assets/a.svg"), "assets/a.svg");
  assert.equal(runner.resolvePath("", "../../private"), "");
  assert.equal(runner.resolvePath("css/", "%2e%2e/%2e%2e/private"), "");
  assert.equal(
    runner.resolvePath("css/", "/assets/a.svg#part"),
    "assets/a.svg",
  );
});
test("download rejects excessive declared and streamed lengths", async () => {
  global.fetch = async () =>
    new Response("body", {
      headers: { "Content-Length": String(runner.LIMITS.maxFileBytes + 1) },
    });
  await assert.rejects(
    () => runner.fetchGithubFile("owner", "repo", "main", "index.html"),
    (e) => e.code === "FILE_TOO_LARGE",
  );
  global.fetch = async () => new Response(new Uint8Array(1025));
  await assert.rejects(
    () =>
      runner.fetchGithubFile("owner", "repo", "main", "index.html", {
        maxBytes: 1024,
      }),
    (e) => e.code === "FILE_TOO_LARGE",
  );
});
test("invalid repository paths are rejected before network requests", async () => {
  global.fetch = async () => {
    throw new Error("Network must not be called");
  };
  await assert.rejects(
    () => runner.fetchGithubFile("owner", "repo", "main", "../secret"),
    (e) => e.code === "INVALID_PATH",
  );
});
test("static sites with Python test helpers remain browser projects", () => {
  assert.equal(
    runner.detectProjectType([
      "index.html",
      "tests/check.py",
      "tools/helper.py",
    ]).type,
    "A",
  );
  assert.equal(
    runner.detectProjectType(["index.html", "requirements.txt", "app.py"]).type,
    "E",
  );
});
