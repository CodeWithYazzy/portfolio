"use strict";

const { createHmac } = require("node:crypto");
const { isIP } = require("node:net");

const MAX_BODY_BYTES = 24 * 1024;
const REQUEST_TIMEOUT_MS = 8000;
const IDEMPOTENCY_TTL = 86400;
const LEASE_MS = 45000;
const CONTROL = /[\u0000-\u001f\u007f]/;
const EMAIL =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Lua keeps the read/modify/write operations atomic across serverless instances.
const ACQUIRE = `-- contact:acquire
local stored = redis.call('GET', KEYS[1])
if stored then
  local value = cjson.decode(stored)
  if value.fingerprint ~= ARGV[1] then return 'CONFLICT' end
  if value.state == 'sent' then return 'SENT' end
  if value.lease > tonumber(ARGV[2]) then return 'BUSY' end
  value.lease = tonumber(ARGV[3])
  redis.call('SET', KEYS[1], cjson.encode(value), 'KEEPTTL')
else
  redis.call('SET', KEYS[1], cjson.encode({fingerprint=ARGV[1], state='pending', lease=tonumber(ARGV[3])}), 'EX', ARGV[4])
end
return 'ACQUIRED'`;

const UPDATE = `-- contact:update
local stored = redis.call('GET', KEYS[1])
if not stored then return 'MISSING' end
local value = cjson.decode(stored)
if value.fingerprint ~= ARGV[1] then return 'CONFLICT' end
value.state = ARGV[2]
value.lease = 0
redis.call('SET', KEYS[1], cjson.encode(value), 'KEEPTTL')
return 'OK'`;

const RATE = `-- contact:rate
for i,key in ipairs(KEYS) do
  if tonumber(redis.call('GET', key) or '0') >= tonumber(ARGV[(i-1)*2+1]) then return 0 end
end
for i,key in ipairs(KEYS) do
  if redis.call('INCR', key) == 1 then redis.call('EXPIRE', key, ARGV[(i-1)*2+2]) end
end
return 1`;

class ContactError extends Error {
  constructor(status, code, message, fieldErrors) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

function validEmail(value) {
  if (typeof value !== "string" || value.length > 254 || CONTROL.test(value))
    return false;
  const local = value.split("@")[0];
  return (
    EMAIL.test(value) &&
    local.length <= 64 &&
    !local.startsWith(".") &&
    !local.endsWith(".") &&
    !local.includes("..")
  );
}

function readConfig(env) {
  if (env.CONTACT_ENABLED !== "true") return null;
  const required = [
    "CONTACT_ALLOWED_ORIGINS",
    "CONTACT_FROM_EMAIL",
    "CONTACT_TO_EMAIL",
    "RESEND_API_KEY",
    "TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "CONTACT_HASH_SECRET",
  ];
  if (required.some((key) => typeof env[key] !== "string" || !env[key].trim()))
    return null;
  if (!validEmail(env.CONTACT_FROM_EMAIL) || !validEmail(env.CONTACT_TO_EMAIL))
    return null;
  if (env.CONTACT_HASH_SECRET.length < 32) return null;
  const origins = env.CONTACT_ALLOWED_ORIGINS.split(",").map((value) =>
    value.trim(),
  );
  try {
    if (
      origins.some((origin) => {
        const url = new URL(origin);
        const local = ["localhost", "127.0.0.1", "[::1]"].includes(
          url.hostname,
        );
        return (
          url.origin !== origin ||
          (url.protocol !== "https:" &&
            !(
              env.VERCEL_ENV !== "production" &&
              local &&
              url.protocol === "http:"
            ))
        );
      })
    )
      return null;
    const redis = new URL(env.UPSTASH_REDIS_REST_URL);
    if (
      redis.protocol !== "https:" ||
      !redis.hostname.endsWith(".upstash.io") ||
      redis.username ||
      redis.password ||
      redis.port ||
      redis.pathname !== "/" ||
      redis.search ||
      redis.hash
    )
      return null;
  } catch {
    return null;
  }
  return {
    origins,
    from: env.CONTACT_FROM_EMAIL,
    to: env.CONTACT_TO_EMAIL,
    resendKey: env.RESEND_API_KEY,
    siteKey: env.TURNSTILE_SITE_KEY,
    turnstileKey: env.TURNSTILE_SECRET_KEY,
    redisUrl: env.UPSTASH_REDIS_REST_URL.replace(/\/$/, ""),
    redisToken: env.UPSTASH_REDIS_REST_TOKEN,
    hashSecret: env.CONTACT_HASH_SECRET,
    vercel: env.VERCEL === "1",
  };
}

function respond(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

function fail(status, code, message, fieldErrors) {
  throw new ContactError(status, code, message, fieldErrors);
}

function checkOrigin(req, config) {
  const origin = req.headers.origin;
  if (typeof origin !== "string" || !config.origins.includes(origin))
    fail(403, "origin", "This request must come from the website.");
  const site = req.headers["sec-fetch-site"];
  if (site && site !== "same-origin")
    fail(403, "origin", "This request must come from the website.");
  return new URL(origin).hostname;
}

async function readBody(req) {
  const type = req.headers["content-type"];
  if (
    typeof type !== "string" ||
    !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(type)
  )
    fail(415, "content_type", "Please submit the form as JSON.");
  if (
    req.headers["content-encoding"] &&
    req.headers["content-encoding"] !== "identity"
  )
    fail(415, "content_type", "Compressed form requests are not supported.");
  const declared = req.headers["content-length"];
  if (
    declared &&
    (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)
  )
    fail(413, "too_large", "Your message is too large.");
  let body = req.body;
  // Vercel can preparse JSON; raw streams are also supported for local Node tests.
  if (body === undefined) {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > MAX_BODY_BYTES)
        fail(413, "too_large", "Your message is too large.");
      chunks.push(bytes);
    }
    body = Buffer.concat(chunks).toString("utf8");
  }
  if (Buffer.isBuffer(body)) body = body.toString("utf8");
  try {
    if (typeof body === "string") {
      if (Buffer.byteLength(body) > MAX_BODY_BYTES)
        fail(413, "too_large", "Your message is too large.");
      body = JSON.parse(body);
    } else if (Buffer.byteLength(JSON.stringify(body) || "") > MAX_BODY_BYTES)
      fail(413, "too_large", "Your message is too large.");
  } catch (error) {
    if (error instanceof ContactError) throw error;
    fail(400, "validation", "Please check the form and try again.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    fail(400, "validation", "Please check the form and try again.");
  return body;
}

function validate(body) {
  const allowed = new Set([
    "name",
    "email",
    "subject",
    "message",
    "website",
    "turnstileToken",
    "idempotencyKey",
  ]);
  if (Object.keys(body).some((key) => !allowed.has(key)))
    fail(400, "validation", "Please check the form and try again.");
  const values = {};
  const fieldErrors = {};
  for (const [field, min, max] of [
    ["name", 2, 80],
    ["subject", 3, 120],
    ["message", 20, 5000],
  ]) {
    const value = typeof body[field] === "string" ? body[field].trim() : "";
    const badControl =
      field === "message"
        ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
        : CONTROL.test(body[field] || "");
    if (value.length < min || value.length > max || badControl)
      fieldErrors[field] =
        `Use ${min}–${max} characters${field === "message" ? "." : " on one line."}`;
    values[field] = value.replace(/\r\n?/g, "\n");
  }
  values.email = typeof body.email === "string" ? body.email.trim() : "";
  if (
    typeof body.email !== "string" ||
    CONTROL.test(body.email) ||
    !validEmail(values.email)
  )
    fieldErrors.email = "Enter a valid email address.";
  if (Object.keys(fieldErrors).length)
    fail(
      400,
      "validation",
      "Please check the highlighted fields.",
      fieldErrors,
    );
  if (
    body.website !== undefined &&
    (typeof body.website !== "string" || body.website !== "")
  )
    fail(
      400,
      "verification",
      "The form could not be verified. Please try again.",
    );
  if (
    typeof body.turnstileToken !== "string" ||
    body.turnstileToken.length < 1 ||
    body.turnstileToken.length > 2048 ||
    CONTROL.test(body.turnstileToken)
  )
    fail(400, "verification", "Complete the verification and try again.");
  if (
    typeof body.idempotencyKey !== "string" ||
    !UUID.test(body.idempotencyKey)
  )
    fail(400, "validation", "Refresh the page before submitting again.");
  values.turnstileToken = body.turnstileToken;
  values.idempotencyKey = body.idempotencyKey.toLowerCase();
  return values;
}

function clientIp(req, config) {
  // Vercel overwrites these headers at its edge. Never trust them on a local server.
  const address = config.vercel
    ? req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"]
    : req.socket?.remoteAddress;
  if (typeof address !== "string" || !isIP(address.trim()))
    fail(
      503,
      "unavailable",
      "Messages are temporarily unavailable. Please try again later.",
    );
  return address.trim();
}

function digest(config, value) {
  return createHmac("sha256", config.hashSecret).update(value).digest("hex");
}

async function jsonRequest(fetchImpl, url, init) {
  const response = await fetchImpl(url, {
    ...init,
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("Provider request failed");
  return response.json();
}

function createHandlers({
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = Date.now,
} = {}) {
  async function config(req, res) {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return respond(res, 405, { enabled: false });
    }
    const settings = readConfig(env);
    return respond(
      res,
      200,
      settings
        ? { enabled: true, siteKey: settings.siteKey }
        : { enabled: false },
    );
  }

  async function contact(req, res) {
    let settings;
    let key;
    let fingerprint;
    let acquired = false;
    let accepted = false;
    const redis = async (command) => {
      const result = await jsonRequest(fetchImpl, settings.redisUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });
      if (!result || result.error || !("result" in result))
        throw new Error("Storage unavailable");
      return result.result;
    };
    try {
      if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        fail(405, "method", "Use the contact form to send a message.");
      }
      settings = readConfig(env);
      if (!settings)
        fail(
          503,
          "disabled",
          "Direct messages are not enabled yet. You can use the email link instead.",
        );
      const hostname = checkOrigin(req, settings);
      const values = validate(await readBody(req));
      const ip = clientIp(req, settings);
      const timestamp = now();
      fingerprint = digest(
        settings,
        JSON.stringify([
          values.name,
          values.email,
          values.subject,
          values.message,
        ]),
      );
      key = `yl:{contact}:idempotency:${digest(settings, values.idempotencyKey)}`;
      const ipHash = digest(settings, ip);
      const rate = await redis([
        "EVAL",
        RATE,
        3,
        `yl:{contact}:ip10m:${ipHash}:${Math.floor(timestamp / 600000)}`,
        `yl:{contact}:ipday:${ipHash}:${Math.floor(timestamp / 86400000)}`,
        `yl:{contact}:global:${Math.floor(timestamp / 86400000)}`,
        5,
        600,
        20,
        86400,
        100,
        86400,
      ]);
      if (rate !== 1) {
        res.setHeader("Retry-After", "600");
        fail(
          429,
          "rate_limit",
          "Too many attempts. Please wait before trying again.",
        );
      }
      const state = await redis([
        "EVAL",
        ACQUIRE,
        1,
        key,
        fingerprint,
        timestamp,
        timestamp + LEASE_MS,
        IDEMPOTENCY_TTL,
      ]);
      if (state === "SENT") return respond(res, 200, { ok: true });
      if (state === "BUSY")
        fail(
          409,
          "in_progress",
          "This message is already being processed. Wait a moment before retrying.",
        );
      if (state === "CONFLICT")
        fail(
          409,
          "idempotency_conflict",
          "The message changed. Please submit it again.",
        );
      if (state !== "ACQUIRED") throw new Error("Storage unavailable");
      acquired = true;
      const verification = await jsonRequest(
        fetchImpl,
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: settings.turnstileKey,
            response: values.turnstileToken,
          }),
        },
      );
      if (
        verification?.success !== true ||
        verification.hostname !== hostname ||
        verification.action !== "contact"
      )
        fail(
          403,
          "verification",
          "Verification expired or failed. Please verify again.",
        );
      const mail = await jsonRequest(
        fetchImpl,
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.resendKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `contact/${digest(settings, values.idempotencyKey)}`,
          },
          body: JSON.stringify({
            from: settings.from,
            to: [settings.to],
            reply_to: values.email,
            subject: `[YasirLab] ${values.subject}`,
            text: `A message from the YasirLab contact form.\n\nName: ${values.name}\nReply email: ${values.email}\n\n${values.message}`,
          }),
        },
      );
      if (typeof mail?.id !== "string" || !mail.id)
        throw new Error("Provider response invalid");
      accepted = true;
      const saved = await redis(["EVAL", UPDATE, 1, key, fingerprint, "sent"]);
      if (saved !== "OK") throw new Error("Storage unavailable");
      return respond(res, 200, { ok: true });
    } catch (error) {
      // Keep the same upstream idempotency key after a timeout or an ambiguous send.
      // No request bodies, addresses, provider responses or secrets are ever logged.
      if (acquired && !accepted) {
        try {
          await redis(["EVAL", UPDATE, 1, key, fingerprint, "pending"]);
        } catch {
          /* Existing lease safely expires. */
        }
      }
      const safe =
        error instanceof ContactError
          ? error
          : new ContactError(
              503,
              "unavailable",
              "The message could not be confirmed. Your text is safe here; please retry shortly.",
            );
      return respond(res, safe.status, {
        ok: false,
        code: safe.code,
        message: safe.message,
        ...(safe.fieldErrors ? { fieldErrors: safe.fieldErrors } : {}),
      });
    }
  }
  return { contact, config };
}

module.exports = { createHandlers, readConfig, MAX_BODY_BYTES };
