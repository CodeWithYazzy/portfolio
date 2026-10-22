# Validation

Validated locally on Windows 11 with Python 3.11.9, Playwright 1.64.0, Chrome 155, Node 26.8.1, axe-core 4.10.3, and Lighthouse 12.8.2. These results describe this checkout and a local static server, not a production deployment or a guarantee of field performance.

## Browser suite

```text
$env:PORTFOLIO_AXE_PATH = "C:\path\to\axe-core\axe.min.js"
python -m unittest discover -s tests -v

Ran 16 tests in 55.582s
OK
```

All 16 tests passed with no skips and no unexpected JavaScript errors. They cover:

- Pages keep their core content, heading, email link, and selected work with JavaScript disabled.
- One `main` landmark and one `h1` per page; metadata and canonical URLs are present.
- The archive loads all 15 projects, filters by category, searches, shows an honest empty state, and resets.
- Every archive card has a status, category, description, technology line, and at least one working link.
- The homepage Iris demo starts on Setosa and predicts Versicolor and Virginica from changed measurements, with a live announcement and percentages that add up.
- Theme selection starts from the system preference, follows later system changes, persists across reloads and pages, syncs across tabs, and still works when storage is denied.
- Mobile navigation opens by keyboard, traps no focus, closes on Escape and anchor selection, moves focus to the target section, and closes when the viewport widens.
- The copy-email button gives visible feedback.
- The calculator handles precedence, division by zero, and rejects executable input; the full Iris page handles all three species and invalid input.
- Static source previews run in a sandboxed iframe using explicit fixtures. Python projects report their runtime requirement. The tests are mocked integrations, not live GitHub checks.
- The catalog still renders from the bundled fallback when `projects.json` is blocked over HTTP and when opened through `file://`.
- No horizontal overflow at 320, 390, 768, or 1440 pixels on the homepage, archive, Iris page, or 404 page.
- Person structured data contains no job title, and the visible copy makes no awards, certification, or years-of-experience claims.

Axe audits report **zero violations** for WCAG 2 A/AA, WCAG 2.1 AA, and best-practice checks across the homepage, archive, running Iris page, and 404 page in both themes at mobile and desktop widths, plus the mobile menu and copy-email feedback: 20 audited states. Keyboard focus and screenshots were reviewed manually. A screen reader, Safari/WebKit, and physical devices were not tested.

## Lighthouse

| Local homepage audit | Performance | Accessibility | Best practices | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile, simulated throttling | 100 | 100 | 100 | 100 | 1.3 s | 0 |
| Desktop preset | 100 | 100 | 100 | 100 | 0.3 s | 0 |

See [the machine-readable summary](lighthouse-summary.json). Runs used `--only-categories=performance,accessibility,best-practices,seo`, headless Chrome with `--no-sandbox --disable-dev-shm-usage`, and `--preset=desktop` for the second run. Lighthouse notes that the plain Python server does not compress text or provide long-lived asset caching; deployment behavior depends on the host. The Vercel configuration was not changed or deployed by this work.

## Static checks

- All four JavaScript entry points pass `node --check`.
- `python tools/sync-catalog.py` regenerates the fallback without changes.
- `git diff --check` passes.
- All internal HTML links and asset references resolve.

## Review screenshots

These are Chromium screenshots of the current implementation at its real viewport sizes.

| View | Screenshot |
| --- | --- |
| Desktop, light | [Homepage](screenshots/home-light-desktop.png) |
| Desktop, dark | [Homepage](screenshots/home-dark-desktop.png) |
| Entire homepage | [Full page](screenshots/home-light-full.png) |
| Mobile, light | [Full page](screenshots/home-light-mobile.png) |
| Mobile, dark | [Full page](screenshots/home-dark-mobile.png) |
| Mobile menu | [Navigation](screenshots/mobile-navigation.png) |
| Project archive | [All projects](screenshots/gallery-light-desktop.png) |
| Running Iris demo, desktop | [Iris](screenshots/iris-light-desktop.png) |
| Running calculator, desktop dark | [Calculator](screenshots/calculator-dark-desktop.png) |
| Running Iris demo, dark mobile | [Iris](screenshots/iris-dark-mobile.png) |

## Limits

The browser suite mocks GitHub API and raw-content responses. A live source preview depends on GitHub availability, unauthenticated API limits, and the visitor's network; it is not part of this local verification. Automated accessibility checks are a floor, not a substitute for assistive-technology testing.
