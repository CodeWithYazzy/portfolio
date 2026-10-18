"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
test("packaged output only contains public runtime files", () => {
  execFileSync(process.execPath, [path.join(root, "tools/build-static.js")]);
  for (const excluded of [
    "lib",
    "api",
    "docs",
    "tests",
    "tools",
    ".git",
    ".env",
    "README.md",
    "vercel.json",
  ])
    assert.equal(
      fs.existsSync(path.join(root, "public", excluded)),
      false,
      excluded,
    );
  for (const required of [
    "index.html",
    "404.html",
    "contact.js",
    "motion.js",
    "assets/fonts/manrope-latin.woff2",
    "pages/demo.html",
  ])
    assert.equal(
      fs.existsSync(path.join(root, "public", required)),
      true,
      required,
    );
});
test("main CSP excludes unsafe scripts and schema hash matches the actual document", () => {
  const config = require("../vercel.json");
  const csp = config.headers[0].headers.find(
    (h) => h.key === "Content-Security-Policy",
  ).value;
  const scripts = csp.match(/(?:^|;)\s*script-src ([^;]+)/)[1];
  assert.ok(
    !scripts.includes("'unsafe-inline'") &&
      !scripts.includes("data:") &&
      !scripts.includes("unpkg"),
  );
  const schema = fs
    .readFileSync(path.join(root, "index.html"), "utf8")
    .match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  assert.ok(
    scripts.includes(
      crypto.createHash("sha256").update(schema).digest("base64"),
    ),
  );
  assert.ok(csp.includes("object-src 'none'"));
  assert.ok(csp.includes("base-uri 'none'"));
});
