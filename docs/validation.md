# Validation — premium/security follow-up

Local verification on 18 October 2026, using Chromium 154, Python Playwright, Node 24, axe-core 4.10.3 and Lighthouse 12.8.2. Results describe this branch, **not a production deployment**.

## Automated results

- **31 Node tests passed**: 24 contact/security/provider-mock tests, 5 runner URL/path/download tests, 2 deployment isolation/CSP tests.
- Main browser run: **20 methods, 19 passed, 1 skipped**, 72.367 seconds. The final expanded contact subset is tested separately and adds one loading/network retry regression (five contact methods total, all passed in 13.000 seconds), bringing coverage to 21 distinct browser methods.
- **27 axe audit states, zero violations**: 25 page/theme/dialog/demo states plus invalid-contact and accepted-contact states. Tags: WCAG 2A, 2AA, 2.1AA and best practices.
- Responsive matrix: 320, 375, 390, 768, 1024, 1440 and 1920 CSS pixels across home, gallery, demo and 404. No horizontal document overflow.
- 82 internal HTML asset/link references resolve; SVGs parse; all runtime/server/tool JavaScript syntax checks pass; `git diff --check` passes.
- Actual packaged HTTP checks: disabled config returns `{enabled:false}`, contact POST returns 503, and `.env`, `.git/config`, server helper, test, deployment config and deep-missing paths return 404. These are local preview checks, not Vercel production evidence.

The single skipped test is direct `file://` navigation, prohibited by managed Chromium (`ERR_BLOCKED_BY_ADMINISTRATOR`). HTTP catalog fallback is tested separately and passes. Contact provider, Turnstile and GitHub fixture traffic is explicitly mocked. No real email is sent by any test.

Coverage includes mobile menu/anchors/escape/resize, persistent/system/cross-tab theme behavior, unavailable localStorage, filters/search/empty reset, six lab notes, project dialog focus containment/restoration, no-JavaScript content, calculator operator precedence/errors/oversized input, three Iris species and invalid inputs, gallery offline fallback, SEO semantics, scroll-linked transforms and dynamic reduced-motion switching. Contact coverage includes validation, loading/disabled buttons, duplicate clicks, accepted feedback, server errors, network ambiguity, preserving text and retry idempotency. Preview tests verify nested CSS/image resolution, circular imports, actual code execution under configured CSP and inability to access the parent document.

## Lighthouse

Measured on the loopback packaged preview, with the real disabled API and configured headers. The local preview serves uncompressed assets. Production caching, compression, network and devices will change results; these are lab measurements, not Core Web Vitals field data.

| Preset | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| Mobile |95|100|100|100|2.9s|0|0ms|
| Desktop |100|100|100|100|0.6s|0|0ms|

The mobile LCP remains above the 2.5 s “good” threshold under this simulated preset; no universal performance guarantee is claimed. Font preload,22 KB self-hosted subset, explicit image dimensions, lazy below-fold images, no animation library, no idle render loop, mobile parallax suppression and removal of unused assets limit cost. Detailed score summary: [lighthouse-summary.json](lighthouse-summary.json).

## Visual evidence

Fresh **before** and **after** screenshots include light/dark at 1440 desktop,768 tablet and 390 mobile, both viewport and full-page captures. The after set also covers project, laboratory, contact, gallery and Iris views. Actual browser screenshots were inspected, and the tablet sculpture crop was corrected. Contact screenshots show its honest unconfigured state.

- [Before, desktop light](screenshots/before/home-light-desktop.png)
- [After, desktop light](screenshots/after/home-light-desktop.png)
- [After, desktop dark](screenshots/after/home-dark-desktop.png)
- [After, mobile light](screenshots/after/home-light-mobile.png)
- [After, mobile dark](screenshots/after/home-dark-mobile.png)
- [After, tablet](screenshots/after/home-light-tablet.png)
- [Full homepage](screenshots/after/home-light-desktop-full.png)
- [Gallery](screenshots/after/gallery-light-desktop.png)
- [Iris demo](screenshots/after/iris-light-desktop.png)

## Reproduce

```sh
node tools/build-static.js
node tools/preview.js
# In another terminal:
node --test tests/*.test.js
YASIRLAB_AXE_PATH=/path/to/axe.min.js python 3 -m unittest discover -s tests -v
python 3 tools/capture-review.py
CHROME_PATH=/usr/bin/chromium /path/to/lighthouse http://127.0.0.1:8766/ \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage' \
  --only-categories=performance,accessibility,best-practices,seo --output=json
# Add --preset=desktop for the desktop measurement.
```

Run `node tools/update-csp.js` whenever the inline JSON-LD formatting/content changes. The deployment test catches stale hashes. `tools/preview.js` is a loopback-only development server, not a production server.

## Limits and next acceptance steps

No real Resend/Turnstile/Upstash integration or inbox-delivery acceptance was performed. Real provider configuration and authorization for one test email are required; see [contact setup](contact-setup.md). Production public-path/header checks are blocked by environment egress; Vercel account settings and GitHub protection settings cannot be inspected with current access. See [security audit](security-audit.md).

Actual Safari, physical mobile hardware, real screen readers, provider outages and measured 60FPS interactions are not verified by these tests. Automated accessibility checks and Chromium keyboard review do not establish complete WCAG conformance. A Vercel preview build must confirm function bundling, headers, configured origin/hostname behavior and provider delivery before any approved production release. No merge or production deployment was performed.
