# Security and privacy audit — 18 October 2026

## Scope and evidence

Reviewed all current HTML, JavaScript, CSS, JSON, SVG/raster assets, deployment files, scripts and tests; scanned the working directory (including generated public output) and all **33 reachable Git commits** from the fetched repository refs. Gitleaks **8.30.1**, official Linux release with its published SHA-256 checksum verified, reported **0 findings in each scan**. Commands:

```sh
gitleaks git . --log-opts=--all --redact --report-format=json --report-path=/tmp/history.json
gitleaks dir . --redact --report-format=json --report-path=/tmp/current.json
```

Reports were inspected without printing potential values. No real exposed credentials were identified; no credentials were rotated and no Git history was rewritten. Manual checks covered credential/config patterns, browser-delivered assets, frontend requests, data rendering, provider boundaries and private asset metadata. The public contact email/name are intentionally public identity information; no visitor data is embedded. Original raster assets had no EXIF location metadata. Unused project thumbnails/duplicate portrait/legacy logos were removed, and the font includes its OFL license.

The connected GitHub account confirms a public repository and **zero Actions workflows**. No workflow tokens or permission declarations therefore exist in this checkout. Branch protection and Actions permission settings returned an integration-access 403 during review; they are **unverified**, not known insecure. No Vercel management connector/credentials are available, so account-level environment scopes, firewall configuration, log retention and deployment settings are unverified. No production settings were changed.

Read-only production-path probes were denied by the cloud environment egress proxy (`CONNECT 403`), including the normal home URL. This is **not evidence of production HTTP status, leakage or protection**. Live public headers and sensitive-path exposure must be checked on an authorized preview/production environment after access is available. Prior live GitHub browser checks also hit the environment proxy certificate trust limitation; TLS verification was not disabled and no trust-store workaround was used.

## Findings and fixes

| Area | Finding | Remediation / remaining boundary |
| --- | --- | --- |
| CSP | Unnecessary inline-script/CDN permissions and broad origins | Main pages now allow local scripts, the JSON-LD hash and Turnstile only; no `unsafe-inline` scripts. Local fonts replace external font origins. `object-src`/`base-uri` denied; same-origin forms/framing. Inline styles remain for existing dynamic layouts and Turnstile. |
| Preview execution | Static source executes user-selected repository code | Opaque `allow-scripts` sandbox only; no same-origin, forms, popups or modal permission. Inner CSP denies network/frame/form access. Data scripts are permitted **only on the demo route** to execute rewritten source in the sandbox. External-script-dependent previews may be limited; source links remain available. |
| Preview fetching | Full bodies allocated before size checks; loose URL/path validation; recursive imports | HTTPS GitHub host/path checks, streamed byte limits/timeouts, bounded cache, import depth/cycle checks and nested asset preload. Source-window check for frame messages. |
| Deployment exposure | Repository root could publish tests/reports/helpers | Explicit static-file allowlist packages `public/`; functions/helpers remain server bundles. `.vercelignore` and `.gitignore` exclude secrets/artifacts. Packaging isolation is tested locally; actual Vercel bundling awaits preview verification. |
| Contact | Mailto-only form; no delivery backend | Same-origin validated API, bounded JSON, Turnstile hostname/action checks, shared atomic rate guard, expiring HMAC state, lease + provider idempotency, plain-text email, generic errors and no body logging. See contact setup. |
| Numeric demos | Trailing operators silently ignored; extreme input could produce invalid output | Reject incomplete/oversized expressions; bound Iris measurements. Arithmetic does not use eval/Function. |
| Content/privacy | Residual LLM/RAG skill tags on hash scaffold; unused image metadata/old content | Honest tags and explicit scaffold/concept labels. No tracking scripts or message persistence in frontend storage. |

## Operational limitations

A clean scanner is **not proof of zero possible leaks**. Scope does not include inaccessible/deleted remote refs, forks, Git LFS objects not present in this checkout, private provider stores, Vercel account configuration, CI caches, deployment logs or provider mail retention. Gitleaks heuristics may miss novel secrets or personal information. A discovered credential must be treated as compromised: report only type/path, revoke/rotate with authorization, and separately assess history cleanup.

Email provider, DNS and real inbox delivery are **not verified**. Provider calls are mocked in tests, not live acceptance tests. Turnstile and distributed rate controls reduce spam but do not prove immunity to abuse; enforce account budgets and monitor metadata-only failures. Application IP limits use Vercel edge-provided addresses and the global budget limits distributed sending. Site origins and Turnstile hostnames must be narrowly configured. Contact remains disabled unless explicitly enabled with complete settings.

No merge, production deployment, real test email, secret rotation or access-policy change was performed.
