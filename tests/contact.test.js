"use strict";

// All network traffic is intercepted. No provider account or real email is used.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { Readable } = require("node:stream");
const { createHandlers, MAX_BODY_BYTES } = require("../lib/contact-service");

const settings = {
  CONTACT_ENABLED: "true",
  CONTACT_ALLOWED_ORIGINS: "https://yasirlab.in,https://www.yasirlab.in",
  CONTACT_FROM_EMAIL: "contact@send.example.com",
  CONTACT_TO_EMAIL: "owner@example.com",
  RESEND_API_KEY: "test-only-provider-value",
  TURNSTILE_SITE_KEY: "test-only-public-site-key",
  TURNSTILE_SECRET_KEY: "test-only-verification-value",
  UPSTASH_REDIS_REST_URL: "https://test-only.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "test-only-database-value",
  CONTACT_HASH_SECRET: "test-only-hash-value-not-a-real-production-secret",
  VERCEL: "1",
  VERCEL_ENV: "production",
};

function submission(overrides = {}) {
  return {
    name: "A visitor",
    email: "visitor@example.com",
    subject: "A question about a project",
    message: "Could you explain the learning goals of this project?",
    website: "",
    turnstileToken: "mock-token",
    idempotencyKey: randomUUID(),
    ...overrides,
  };
}

function request(body = submission(), overrides = {}) {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://yasirlab.in",
      "sec-fetch-site": "same-origin",
      "x-vercel-forwarded-for": "192.0.2.50",
      ...overrides.headers,
    },
    body,
    socket: { remoteAddress: "127.0.0.1" },
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => key !== "headers"),
    ),
  };
}

async function call(handler, req) {
  const headers = {};
  let result;
  await handler(req, {
    setHeader: (key, value) => {
      headers[key] = value;
    },
    statusCode: 200,
    end(body) {
      result = { status: this.statusCode, headers, body: JSON.parse(body) };
    },
  });
  assert.ok(result, "handler must return a JSON response");
  assert.equal(result.headers["Cache-Control"], "no-store, max-age=0");
  return result;
}

function harness(options = {}) {
  const entries = new Map();
  const counts = new Map();
  const calls = [];
  let clock = 1760000000000;
  let provider = options.provider;
  let verification = options.verification;
  let storageFailure = options.storageFailure;
  const fetchImpl = async (url, init) => {
    assert.equal(init.redirect, "error");
    assert.ok(init.signal instanceof AbortSignal);
    const body = JSON.parse(init.body);
    calls.push({ url, init, body });
    if (url === settings.UPSTASH_REDIS_REST_URL) {
      if (storageFailure?.(body))
        throw new Error("test-only-private-storage-error");
      const [, script, numberOfKeys, ...args] = body;
      const keys = args.slice(0, numberOfKeys);
      const values = args.slice(numberOfKeys);
      let result;
      // Stateful shared Redis double lets independent handler instances share limits.
      if (script.startsWith("-- contact:acquire")) {
        const [fingerprint, now, lease, ttl] = values;
        let entry = entries.get(keys[0]);
        if (entry && entry.expires <= now) {
          entries.delete(keys[0]);
          entry = undefined;
        }
        if (
          entry?.fingerprint !== undefined &&
          entry.fingerprint !== fingerprint
        )
          result = "CONFLICT";
        else if (entry?.state === "sent") result = "SENT";
        else if (entry?.lease > now) result = "BUSY";
        else {
          entries.set(keys[0], {
            fingerprint,
            state: "pending",
            lease,
            expires: entry?.expires || now + ttl * 1000,
          });
          result = "ACQUIRED";
        }
      } else if (script.startsWith("-- contact:update")) {
        const entry = entries.get(keys[0]);
        if (!entry) result = "MISSING";
        else if (entry.fingerprint !== values[0]) result = "CONFLICT";
        else {
          entry.state = values[1];
          entry.lease = 0;
          result = "OK";
        }
      } else if (script.startsWith("-- contact:rate")) {
        if (keys.some((key, i) => (counts.get(key) || 0) >= values[i * 2]))
          result = 0;
        else {
          keys.forEach((key) => counts.set(key, (counts.get(key) || 0) + 1));
          result = 1;
        }
      } else assert.fail("Unexpected storage command");
      return { ok: true, json: async () => ({ result }) };
    }
    if (url === "https://challenges.cloudflare.com/turnstile/v0/siteverify")
      return {
        ok: true,
        json: async () =>
          verification || {
            success: true,
            hostname: "yasirlab.in",
            action: "contact",
          },
      };
    if (url === "https://api.resend.com/emails")
      return provider
        ? provider(body, init)
        : { ok: true, json: async () => ({ id: "mock-message-id" }) };
    assert.fail(`Unexpected provider URL: ${url}`);
  };
  const env = { ...settings, ...options.env };
  const handlers = () => createHandlers({ env, fetchImpl, now: () => clock });
  return {
    ...handlers(),
    handlers,
    entries,
    counts,
    calls,
    env,
    setProvider(value) {
      provider = value;
    },
    setVerification(value) {
      verification = value;
    },
    setStorageFailure(value) {
      storageFailure = value;
    },
    advance(value) {
      clock += value;
    },
    mailCalls() {
      return calls.filter(({ url }) => url === "https://api.resend.com/emails");
    },
  };
}

test("contact remains disabled without explicit enablement and complete valid configuration", async () => {
  for (const env of [
    { CONTACT_ENABLED: "false" },
    { CONTACT_ENABLED: "TRUE" },
    { RESEND_API_KEY: "" },
    { CONTACT_HASH_SECRET: "short" },
    { CONTACT_ALLOWED_ORIGINS: "https://yasirlab.in/" },
    { CONTACT_ALLOWED_ORIGINS: "http://localhost:3000" },
    { UPSTASH_REDIS_REST_URL: "https://attacker.example.com" },
    { CONTACT_FROM_EMAIL: "sender@example.com\r\nBcc:other@example.com" },
  ]) {
    const h = harness({ env });
    assert.deepEqual((await call(h.config, { method: "GET" })).body, {
      enabled: false,
    });
    const response = await call(h.contact, request());
    assert.equal(response.status, 503);
    assert.equal(response.body.code, "disabled");
    assert.equal(h.calls.length, 0);
  }
});

test("public config exposes only enablement and public Turnstile site key", async () => {
  const h = harness();
  assert.deepEqual((await call(h.config, { method: "GET" })).body, {
    enabled: true,
    siteKey: settings.TURNSTILE_SITE_KEY,
  });
  assert.equal((await call(h.config, { method: "POST" })).status, 405);
  assert.equal(h.calls.length, 0);
});

test("rejects other methods without CORS permission", async () => {
  const h = harness();
  for (const method of ["GET", "PUT", "OPTIONS", "DELETE"]) {
    const response = await call(h.contact, request(undefined, { method }));
    assert.equal(response.status, 405);
    assert.equal(response.headers.Allow, "POST");
    assert.equal(response.headers["Access-Control-Allow-Origin"], undefined);
  }
  assert.equal(h.calls.length, 0);
});

test("rejects missing, hostile, suffix, null origins and cross-site requests", async () => {
  const h = harness();
  for (const headers of [
    { origin: undefined },
    { origin: "null" },
    { origin: "https://yasirlab.in.attacker.example" },
    { origin: "https://attacker.example" },
    { "sec-fetch-site": "cross-site" },
    { "sec-fetch-site": "same-site" },
  ]) {
    assert.equal(
      (await call(h.contact, request(undefined, { headers }))).status,
      403,
    );
  }
  assert.equal(h.calls.length, 0);
});

test("accepts a plaintext submission after durable guard and server challenge verification", async () => {
  const h = harness();
  const input = submission({
    name: "Zoë <visitor>",
    message: '<script>alert("test")</script>\r\nThis must remain plain text.',
  });
  const response = await call(h.contact, request(input));
  assert.deepEqual(response.body, { ok: true });
  assert.equal(response.status, 200);
  assert.deepEqual(
    h.calls.map(({ url }) => new URL(url).hostname),
    [
      "test-only.upstash.io",
      "test-only.upstash.io",
      "challenges.cloudflare.com",
      "api.resend.com",
      "test-only.upstash.io",
    ],
  );
  const mail = h.mailCalls()[0];
  assert.equal(mail.body.html, undefined);
  assert.equal(mail.body.from, settings.CONTACT_FROM_EMAIL);
  assert.deepEqual(mail.body.to, [settings.CONTACT_TO_EMAIL]);
  assert.equal(mail.body.reply_to, input.email);
  assert.match(mail.body.text, /<script>/);
  assert.ok(!mail.body.text.includes("\r"));
  assert.match(mail.init.headers["Idempotency-Key"], /^contact\/[0-9a-f]{64}$/);
});

test("validation rejects short, long, missing, nonstring fields and returns safe field errors", async () => {
  for (const overrides of [
    { name: "x" },
    { name: "x".repeat(81) },
    { name: 40 },
    { email: "visitor" },
    { email: ".first@example.com" },
    { email: "a..b@example.com" },
    { email: "x".repeat(65) + "@example.com" },
    { subject: "hi" },
    { subject: "x".repeat(121) },
    { message: "too short" },
    { message: "x".repeat(5001) },
    { email: undefined },
  ]) {
    const h = harness();
    const response = await call(h.contact, request(submission(overrides)));
    assert.equal(response.status, 400, JSON.stringify(overrides));
    assert.ok(Object.keys(response.body.fieldErrors).length);
    assert.equal(h.calls.length, 0);
  }
});

test("blocks CRLF email-header injection and control characters before network calls", async () => {
  for (const overrides of [
    { name: "Visitor\r\nBcc:bad@example.com" },
    { email: "visitor@example.com\r\n" },
    { subject: "Hello\nBcc:other@example.com" },
    { subject: "Subject\u0000" },
    { message: "A sufficiently long message with a \u0000 null byte" },
  ]) {
    const h = harness();
    assert.equal(
      (await call(h.contact, request(submission(overrides)))).status,
      400,
    );
    assert.equal(h.calls.length, 0);
  }
});

test("honeypot, absent tokens, malformed idempotency and unexpected fields never reach providers", async () => {
  for (const overrides of [
    { website: "https://spam.example" },
    { website: true },
    { turnstileToken: "" },
    { turnstileToken: "x".repeat(2049) },
    { idempotencyKey: "not-a-uuid" },
    { html: "<p>extra</p>" },
  ]) {
    const h = harness();
    assert.equal(
      (await call(h.contact, request(submission(overrides)))).status,
      400,
    );
    assert.equal(h.calls.length, 0);
  }
});

test("enforces content type, encoding, declared size and actual UTF-8 body size", async () => {
  const h = harness();
  for (const headers of [
    { "content-type": "text/plain" },
    { "content-type": "application/x-www-form-urlencoded" },
    { "content-encoding": "gzip" },
  ])
    assert.equal(
      (await call(h.contact, request(undefined, { headers }))).status,
      415,
    );
  assert.equal(
    (
      await call(
        h.contact,
        request(undefined, {
          headers: { "content-length": String(MAX_BODY_BYTES + 1) },
        }),
      )
    ).status,
    413,
  );
  assert.equal(
    (
      await call(
        h.contact,
        request(JSON.stringify(submission({ message: "🧪".repeat(8000) }))),
      )
    ).status,
    413,
  );
  assert.equal(
    (
      await call(
        h.contact,
        request(submission({ message: "x".repeat(MAX_BODY_BYTES) })),
      )
    ).status,
    413,
  );
  assert.equal(h.calls.length, 0);
});

test("rejects malformed JSON and arrays and accepts a bounded raw request stream", async () => {
  const h = harness();
  for (const body of ["{ broken", "null", [], 42, true])
    assert.equal((await call(h.contact, request(body))).status, 400);
  const stream = Readable.from([JSON.stringify(submission())]);
  Object.assign(stream, request());
  delete stream.body;
  assert.equal((await call(h.contact, stream)).status, 200);
  const tooLarge = Readable.from(["x".repeat(MAX_BODY_BYTES), "more"]);
  Object.assign(tooLarge, request());
  delete tooLarge.body;
  assert.equal((await call(h.contact, tooLarge)).status, 413);
});

test("does not use arbitrary forwarded IP chains or missing edge IPs", async () => {
  const h = harness();
  for (const value of [undefined, "unknown", "192.0.2.1, 192.0.2.2"]) {
    assert.equal(
      (
        await call(
          h.contact,
          request(undefined, { headers: { "x-vercel-forwarded-for": value } }),
        )
      ).status,
      503,
    );
  }
  assert.equal(h.calls.length, 0);
});

test("local runtime uses socket IP instead of attacker-controlled forwarding header", async () => {
  const h = harness({
    env: {
      VERCEL: "",
      VERCEL_ENV: "development",
      CONTACT_ALLOWED_ORIGINS: "http://localhost:3000",
    },
    verification: { success: true, hostname: "localhost", action: "contact" },
  });
  assert.equal(
    (
      await call(
        h.contact,
        request(undefined, {
          headers: {
            origin: "http://localhost:3000",
            "x-vercel-forwarded-for": "not-an-ip",
          },
        }),
      )
    ).status,
    200,
  );
});

test("server rejects failed challenge, other hostname or wrong action without emailing", async () => {
  for (const verification of [
    { success: false },
    { success: true, hostname: "attacker.example", action: "contact" },
    { success: true, hostname: "yasirlab.in", action: "login" },
  ]) {
    const h = harness({ verification });
    const response = await call(h.contact, request());
    assert.equal(response.status, 403);
    assert.equal(response.body.code, "verification");
    assert.equal(h.mailCalls().length, 0);
  }
});

test("duplicate successful retries reuse stored acknowledgement without re-verification or email", async () => {
  const h = harness();
  const input = submission();
  assert.equal((await call(h.contact, request(input))).status, 200);
  const count = h.calls.length;
  assert.equal(
    (
      await call(
        h.handlers().contact,
        request({ ...input, turnstileToken: "fresh-token" }),
      )
    ).status,
    200,
  );
  assert.equal(h.calls.length, count + 2); // Shared rate guard plus duplicate lookup.
  assert.equal(h.mailCalls().length, 1);
});

test("same idempotency key cannot be reused for changed content", async () => {
  const h = harness();
  const input = submission();
  await call(h.contact, request(input));
  const response = await call(
    h.handlers().contact,
    request({ ...input, subject: "Another subject" }),
  );
  assert.equal(response.status, 409);
  assert.equal(response.body.code, "idempotency_conflict");
  assert.equal(h.mailCalls().length, 1);
});

test("concurrent invocations reserve one lease before reaching email provider", async () => {
  let started;
  let release;
  const entered = new Promise((resolve) => {
    started = resolve;
  });
  const deferred = new Promise((resolve) => {
    release = resolve;
  });
  const h = harness({
    provider: async () => {
      started();
      await deferred;
      return { ok: true, json: async () => ({ id: "mock-id" }) };
    },
  });
  const input = submission();
  const first = call(h.contact, request(input));
  await entered;
  const second = await call(h.handlers().contact, request(input));
  assert.equal(second.status, 409);
  assert.equal(second.body.code, "in_progress");
  release();
  assert.equal((await first).status, 200);
  assert.equal(h.mailCalls().length, 1);
});

test("per-IP rate limit persists across function instances and fails before provider work", async () => {
  const h = harness();
  for (let i = 0; i < 5; i++)
    assert.equal((await call(h.handlers().contact, request())).status, 200);
  const limited = await call(h.handlers().contact, request());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers["Retry-After"], "600");
  assert.equal(h.mailCalls().length, 5);
  h.advance(600001);
  assert.equal((await call(h.contact, request())).status, 200);
});

test("daily IP limit persists beyond short windows", async () => {
  const h = harness();
  for (let period = 0; period < 4; period++) {
    for (let i = 0; i < 5; i++)
      assert.equal((await call(h.handlers().contact, request())).status, 200);
    h.advance(600001);
  }
  assert.equal((await call(h.contact, request())).status, 429);
  assert.equal(h.mailCalls().length, 20);
});

test("global daily cap limits distributed abuse", async () => {
  const h = harness();
  for (let i = 0; i < 100; i++)
    assert.equal(
      (
        await call(
          h.contact,
          request(undefined, {
            headers: { "x-vercel-forwarded-for": `192.0.2.${i + 1}` },
          }),
        )
      ).status,
      200,
    );
  assert.equal(
    (
      await call(
        h.contact,
        request(undefined, {
          headers: { "x-vercel-forwarded-for": "198.51.100.1" },
        }),
      )
    ).status,
    429,
  );
  assert.equal(h.mailCalls().length, 100);
});

test("storage outage fails closed with generic errors and no email", async () => {
  const h = harness({ storageFailure: () => true });
  const result = await call(h.contact, request());
  assert.equal(result.status, 503);
  assert.ok(!JSON.stringify(result.body).includes("private-storage"));
  assert.equal(h.mailCalls().length, 0);
});

test("provider timeout retries preserve upstream idempotency key", async () => {
  const h = harness({
    provider: async () => {
      throw new Error("private provider credentials and details");
    },
  });
  const input = submission();
  const result = await call(h.contact, request(input));
  assert.equal(result.status, 503);
  assert.ok(!JSON.stringify(result.body).includes("credentials"));
  h.setProvider(undefined);
  assert.equal(
    (
      await call(
        h.contact,
        request({ ...input, turnstileToken: "fresh-token" }),
      )
    ).status,
    200,
  );
  assert.equal(h.mailCalls().length, 2);
  assert.equal(
    h.mailCalls()[0].init.headers["Idempotency-Key"],
    h.mailCalls()[1].init.headers["Idempotency-Key"],
  );
});

test("unconfirmed storage after provider acceptance retains lease and safe retry identity", async () => {
  const h = harness({
    storageFailure: (command) => command[1].startsWith("-- contact:update"),
  });
  const input = submission();
  assert.equal((await call(h.contact, request(input))).status, 503);
  assert.equal((await call(h.contact, request(input))).status, 409);
  h.advance(45001);
  h.setStorageFailure(undefined);
  assert.equal((await call(h.contact, request(input))).status, 200);
  assert.equal(
    h.mailCalls()[0].init.headers["Idempotency-Key"],
    h.mailCalls()[1].init.headers["Idempotency-Key"],
  );
});

test("provider non-2xx and invalid responses never report success", async () => {
  for (const provider of [
    async () => ({ ok: false }),
    async () => ({ ok: true, json: async () => ({ error: "private detail" }) }),
  ]) {
    const h = harness({ provider });
    const response = await call(h.contact, request());
    assert.equal(response.status, 503);
    assert.ok(!JSON.stringify(response.body).includes("private detail"));
  }
});

test("Redis receives only expiring digests and counters, not contact data or raw visitor IP", async () => {
  const h = harness();
  const input = submission();
  await call(h.contact, request(input));
  const storage = JSON.stringify(
    h.calls
      .filter(({ url }) => url === settings.UPSTASH_REDIS_REST_URL)
      .map(({ body }) => body),
  );
  for (const privateValue of [
    input.name,
    input.email,
    input.subject,
    input.message,
    input.turnstileToken,
    input.idempotencyKey,
    "192.0.2.50",
  ])
    assert.ok(!storage.includes(privateValue));
  assert.ok([...h.entries.values()].every((entry) => entry.expires));
  const turnstile = h.calls.find(({ url }) => url.includes("siteverify"));
  assert.equal(
    turnstile.body.remoteip,
    undefined,
    "server verification does not need an additional raw IP disclosure",
  );
});
