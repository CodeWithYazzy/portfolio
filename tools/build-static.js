"use strict";
// Deployment allowlist: server helpers, tests, credentials and reports never become static URLs.
const { cpSync, mkdirSync, rmSync } = require("node:fs");
const { resolve } = require("node:path");
const root = resolve(__dirname, "..");
const output = resolve(root, "public");
rmSync(output, { recursive: true, force: true });
mkdirSync(output);
for (const file of [
  "index.html",
  "404.html",
  "about.html",
  "projects.html",
  "visualize.html",
  "contact.html",
  "profile.js",
  "visualize-core.js",
  "visualize.js",
  "home.js",
  "pages",
  "assets",
  "favicon.ico",
  "style.css",
  "contact.css",
  "theme.js",
  "script.js",
  "contact.js",
  "robots.txt",
  "sitemap.xml",
]) {
  cpSync(resolve(root, file), resolve(output, file), { recursive: true });
}
console.log(
  "Static allowlist packaged in public/. Vercel builds root api/ functions separately.",
);
