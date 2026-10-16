# YasirLab 2.0 validation

Validated in the cloud workspace with Python 3.12, Node 24, system Chromium, Playwright Python, axe-core 4.10.3, and Lighthouse 12.8.2. These results describe local testing, not a production deployment or a guarantee of field performance.

## Browser suite

```text
YASIRLAB_AXE_PATH=/tmp/yasirlab-checks/node_modules/axe-core/axe.min.js \
  python3 -m unittest discover -s tests -v

Ran 15 tests in 52.250s
OK (skipped=1)
```

**14 passed, 1 skipped, 0 failures.** The skip is direct `file://` navigation, which this managed Chromium rejects with `ERR_BLOCKED_BY_ADMINISTRATOR`. The same bundled-catalog fallback is verified over HTTP with the JSON request deliberately blocked.

Passing checks:

- All 15 catalog entries, category filtering, search, empty state, and reset.
- Project dialog keyboard focus containment, Escape close, focus return, and preview navigation.
- All six concept dialogs, explicitly unrun, including keyboard focus return.
- Initial system theme, system preference changes before explicit selection, persistence across reloads/pages, cross-tab updates, and storage-denied fallback.
- Mobile disclosure navigation with keyboard, Escape, anchor navigation, and desktop resize.
- Contact validation, field error associations, correctly encoded `mailto:` draft, and preserving the entered message when a separate email draft opens.
- Calculator precedence, parentheses/powers, divide-by-zero feedback, and rejection of executable input.
- Iris examples for all three species and invalid-input feedback.
- Bundled browser demos with external traffic blocked.
- GitHub runner static-HTML preparation and sandbox execution using explicit fixtures; Python projects show an honest runtime requirement. These are **mocked integration tests**, not live GitHub API tests. A targeted rerun also verifies that Python files under `tests/` and `tools/` do not misclassify this static site, while an actual Python runtime manifest still requires Python.
- No horizontal overflow at 320, 390, 768, and 1440 pixels on the homepage, collection, Iris page, and 404 page.
- One main landmark and one H1 per page, metadata, canonical URLs, and honest Person structured data.
- Core page content and direct email remain available without JavaScript; the draft form cannot accidentally submit a GET request.
- No unexpected JavaScript page errors in passing tests.

Axe audits report **zero violations** for WCAG 2 A/AA, WCAG 2.1 AA, and best-practice checks across the four pages in both themes at mobile and desktop widths, plus open project/lab dialogs and running calculator/Iris examples (25 audited states). The Lighthouse audit also checks accessible-name/visible-label agreement. Keyboard focus and representative desktop/mobile screenshots were reviewed manually. A real screen reader, Safari/WebKit, and physical devices have not been tested.

## Lighthouse

| Local homepage audit | Performance | Accessibility | Best practices | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile, simulated throttling | 99 | 100 | 100 | 100 | 1.8 s | 0 |
| Desktop preset | 100 | 100 | 100 | 100 | 0.5 s | 0 |

See [the machine-readable summary](lighthouse-summary.json). Commands used `--only-categories=performance,accessibility,best-practices,seo`, Chromium with `--headless --no-sandbox --disable-dev-shm-usage`, and the desktop run added `--preset=desktop`. Lighthouse notes that the plain Python server does not compress text or provide long-lived asset caching; deployment behavior depends on the host. Existing Vercel configuration is unchanged and has not been deployed by this work.

## Static checks

- All four JavaScript entry points pass `node --check`.
- `git diff --check` passes.
- All internal HTML asset/link references resolve; SVG assets parse successfully.
- The catalog fallback regenerates deterministically with `python3 tools/sync-catalog.py`.
- HTTP requests for the homepage, gallery, preview, catalog, scripts, social image, robots file, and sitemap succeed.

## Review screenshots

The illustrations in the application are original decorative visual studies. The images below are actual Chromium screenshots of this implementation.

| View | Screenshot |
| --- | --- |
| Desktop, light | [Homepage](screenshots/home-light-desktop.png) |
| Desktop, dark | [Homepage](screenshots/home-dark-desktop.png) |
| Entire homepage | [Full page](screenshots/home-light-full.png) |
| Mobile, light | [Full page](screenshots/home-light-mobile.png) |
| Mobile, dark | [Homepage](screenshots/home-dark-mobile.png) |
| Mobile menu | [Navigation](screenshots/mobile-navigation.png) |
| Project collection | [Gallery](screenshots/gallery-light-desktop.png) |
| Running Iris example | [Demo](screenshots/iris-light-desktop.png) |

## GitHub and live-browser limits

The connected account successfully pushed `redesign/yasirlab-2` and created [PR #1](https://github.com/CodeWithYazzy/portfolio/pull/1). The PR is open, targets `main`, and has not been merged. Read-only GitHub API requests from the shell returned HTTP 200 after initial egress denials resolved.

A live source-preview request from managed Chromium fails with `net::ERR_CERT_AUTHORITY_INVALID` against the environment's proxy certificate. The shell trusts the supplied proxy CA and receives a valid GitHub JSON response with `Access-Control-Allow-Origin: *`; Chromium's separate trust store does not. This is an environment trust limitation, not a demonstrated website failure. Live browser-to-GitHub previews remain unverified. Local browser examples, fixture-based runner tests, and GitHub CLI operations pass.

An optional attempt to add the platform-provided proxy CA to Chromium's persistent user trust store was rejected by automatic approval review because it broadens future TLS trust without specific authorization. No persistent browser trust change was made, and verification was never disabled. The optional live-browser check can remain blocked, or the owner can explicitly authorize that trust-store change separately.
