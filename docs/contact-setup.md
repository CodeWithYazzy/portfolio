# Secure contact setup

The implementation is complete; **delivery is disabled and real delivery has not been tested**. The owner approved preparing Resend, Cloudflare Turnstile and Upstash Redis. No provider account, DNS, production setting or credential has been created or changed, and no real email has been sent.

## Configure the approved services

1. **Resend:** create an account at https://resend.com and add a dedicated sending subdomain you control, such as `send.yasirlab.in`. In Domains → Add domain, select the region. At your authoritative DNS provider, create **exactly the DKIM TXT, SPF TXT and return-path MX records shown by Resend for that domain and region**. Copy the generated host/value/priority verbatim; do not invent values or replace your root domain's existing mailbox MX records. Keep DNS proxying disabled for mail records. Verify the domain in Resend. Add or review a DMARC TXT policy for the sending domain after checking your existing email policy. The account-specific DKIM values and regional MX hostname cannot be supplied before the account exists. Resend's instructions: https://resend.com/docs/dashboard/domains/introduction.
2. Create a Resend API key with **sending access restricted to that verified domain**. Choose a sender mailbox at the verified subdomain and the owner's actual recipient inbox. The visitor's address is only `reply_to`; it never becomes the sender or recipient.
3. **Turnstile:** in Cloudflare → Turnstile → Add widget, select Managed, give it the exact approved site/preview hostnames, and obtain the public site key and private secret key. The application uses the action `contact` and checks the verified hostname and action on the server. Do not use wildcard origins, broad hostname bypasses or Cloudflare test keys in production. Guide: https://developers.cloudflare.com/turnstile/get-started/.
4. **Upstash:** create a Redis database near the Vercel function region. Obtain its HTTPS REST URL and REST token from the database's REST API section. Use a dedicated database, access restricted to this application, and account alerts/usage limits. The token needs GET/SET/INCR/EXPIRE and EVAL access for atomic Lua guards. Guide: https://upstash.com/docs/redis/features/restapi.
5. Generate a cryptographically random `CONTACT_HASH_SECRET` (at least 32 characters; for example `openssl rand -hex 32`) privately. Do not paste it into chat, a PR, a command history containing assignments, or a committed file.

## Vercel environment variables

Set these in Project → Settings → Environment Variables, **initially scoped only to the chosen Preview environment**. Do not enable production or deploy without the owner's approval. No client-prefixed variables are used.

| Variable | Value / purpose |
| --- | --- |
| `CONTACT_ENABLED` | Keep `false` until all settings are supplied and an authorized delivery test is ready. Explicit `true` enables sending. |
| `CONTACT_ALLOWED_ORIGINS` | Comma-separated exact origins, no trailing slash, e.g. `https://yasirlab.in,https://www.yasirlab.in` only if both are intended. Add the exact authorized preview origin for preview testing. No wildcards. |
| `CONTACT_FROM_EMAIL` | Verified sender email at your Resend sending domain; plain address, no display-name syntax. |
| `CONTACT_TO_EMAIL` | Owner's chosen receiving inbox; never visitor-controlled. |
| `RESEND_API_KEY` | Private, domain-restricted sending key. |
| `TURNSTILE_SITE_KEY` | Public widget key; the only provider configuration exposed to the browser. |
| `TURNSTILE_SECRET_KEY` | Private verification key. |
| `UPSTASH_REDIS_REST_URL` | Dedicated `https://…upstash.io` REST URL. |
| `UPSTASH_REDIS_REST_TOKEN` | Private Redis REST token. |
| `CONTACT_HASH_SECRET` | Private random value, at least 32 characters, for HMAC identifiers. |

Vercel supplies `VERCEL`/`VERCEL_ENV` automatically. Configure a supported Node.js LTS runtime (22 or 24). The repository specifies `node tools/build-static.js`, output `public`, and a 60-second function ceiling. No install/build framework is needed. Root `api/` functions and their `lib/` dependency are bundled by Vercel separately from public assets. Confirm that behavior in the preview build before approving production. Changing environment values requires a new preview deployment.

Never commit `.env` files. The environment is intentionally not represented by a checked-in `.env.example` containing mock credentials. Test fixtures use explicitly artificial values and mocked network requests only.

## Authorized end-to-end acceptance

**Dependency: the owner must configure these accounts/variables and separately authorize a real test email.** Do not treat provider approval as permission to send one.

After that authorization, enable contact in the chosen preview only and deploy that preview. Verify `/api/contact-config` returns just `enabled` and `siteKey`. Use the normal browser form, complete the real Turnstile challenge, and send one explicitly authorized test. Confirm the provider accepted it, check the Resend delivery event, and have the owner confirm receipt in the intended inbox (including spam). Confirm Reply goes to the test visitor. Record the date, preview commit and result without including addresses, message contents or provider credentials in public reports. Then exercise a retry without sending additional unauthorized messages. Disable `CONTACT_ENABLED` again if acceptance is incomplete. A provider acceptance response is **not proof of inbox delivery**.

## Controls and retention

The server accepts same-origin JSON POST only, enforces 24 KiB, rejects malformed fields/control characters and unexpected fields, validates name 2–80, subject 3–120, message 20–5000 and email up to 254 characters. Resend receives plain text, never visitor HTML. A hidden honeypot and verified Turnstile challenge protect submission. Validation is repeated server-side.

Redis atomically limits attempts to 5 per IP per 10-minute window, 20 per IP per UTC day, and 100 globally per UTC day. Window boundaries can permit short bursts; these are application controls, not a DDoS shield. Use Vercel Firewall/WAF and provider billing alerts as operational layers. Rate checking precedes new idempotency-record allocation. Repeated identical sends reuse an in-memory browser key, a server fingerprint/45-second lease and Resend idempotency. Deduplication is bounded to 24 hours; reloading or changing text creates a new submission. IPv6 address rotation can bypass a per-address budget, but the shared global cap and challenge remain. Shared networks may hit limits sooner.

No contact body, email address, name or raw IP is stored in Redis or application logs. Redis stores HMAC identifiers, request counters and processing state with expiry no longer than 24 hours. Name, reply address and message are sent to Resend and the owner mailbox; Cloudflare receives verification/browser metadata. Hosting/email providers may retain operational records according to their policies. Configure restricted account access/MFA and suitable retention; delete old contact messages when no longer needed. The website uses no analytics or advertising trackers. The form loads Turnstile only after interaction. Theme preference is the only persistent client state; draft text is kept in memory, not localStorage.

Failures are generic, inputs are preserved, and unavailable Redis/verification/email providers fail closed. Secrets stay server-side. A static-only host has no functions: the form clearly reports unavailable and retains the separate email link.
