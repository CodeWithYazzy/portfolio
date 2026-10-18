"use strict";
// Local packaged preview, including the real disabled-by-default API and configured headers.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..", "public");
const config = require("../vercel.json");
const contact = require("../api/contact");
const contactConfig = require("../api/contact-config");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
};
http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    for (const item of config.headers[0].headers)
      res.setHeader(item.key, item.value);
    if (/^\/pages\/demo(?:\.html)?\/?$/.test(url.pathname))
      for (const item of config.headers[1].headers)
        res.setHeader(item.key, item.value);
    if (url.pathname === "/api/contact") return contact(req, res);
    if (url.pathname === "/api/contact-config") return contactConfig(req, res);
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      return res.end();
    }
    let relative;
    try {
      relative = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400);
      return res.end();
    }
    if (relative === "/") relative = "/index.html";
    let file = path.resolve(root, "." + relative);
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(404);
      return res.end();
    }
    if (!path.extname(file)) file += ".html";
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.statusCode = 404;
      file = path.join(root, "404.html");
    }
    res.setHeader(
      "Content-Type",
      mime[path.extname(file)] || "application/octet-stream",
    );
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  })
  .listen(Number(process.env.PORT) || 8766, "127.0.0.1", () =>
    console.log(
      "Packaged preview listening on loopback; contact stays disabled unless explicitly configured.",
    ),
  );
