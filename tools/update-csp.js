"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const schema = html.match(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
)[1];
const hash = crypto.createHash("sha256").update(schema).digest("base64");
const file = path.join(root, "vercel.json");
const config = JSON.parse(fs.readFileSync(file, "utf8"));
const header = config.headers[0].headers.find(
  (item) => item.key === "Content-Security-Policy",
);
header.value = header.value.replace(/'sha256-[^']+'/, `'sha256-${hash}'`);
fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
