# YasirLab 2.0

A personal developer portfolio, an AI/ML learning laboratory, and an evolving independent technology identity for Yasir Javed Khan.

The site uses semantic HTML, CSS, and vanilla JavaScript. No frontend framework or application package dependencies are required. A small Node script packages an explicit static-file allowlist for Vercel; the app remains HTML/CSS/JavaScript. Manrope is self-hosted under the OFL license, and icons are local SVGs.

## Run locally

```bash
cd /workspace/portfolio  # or your local checkout
node tools/build-static.js
node tools/preview.js
```

Open `index.html`, `pages/all-projects.html`, or `pages/demo.html?project=Iris%20Flower%20Classifier` through that server. The explicit `.html` links also work on basic static hosts. Vercel's existing clean URLs remain supported. The bundled catalog is designed to support direct file browsing too, but this cloud browser prohibits `file://` navigation; use HTTP for the verified workflow.

## Structure

- `index.html`: overview, selected work, six lab concepts, about, and contact.
- `pages/all-projects.html`: searchable collection with category filters and project details.
- `pages/demo.html`, `demo-page.js`, `demo.css`: preview interface and existing calculator/Iris implementation.
- `demo-runner.js`: GitHub source inspection, project-type detection, and sandboxed static previews. Python and server projects display their runtime requirements rather than simulated output.
- `contact.js`, `contact.css`, `api/`, `lib/contact-service.js`: accessible contact UI and server-only delivery controls.
- `motion.js`: bounded scroll-linked transforms, sticky navigation and native motion enhancements.
- `style.css`: shared light/dark tokens, layout, components, and reduced-motion behavior.
- `theme.js`: pre-paint system/stored theme selection; `script.js` handles persistence and interactive components.
- `assets/projects.json`: authoritative project content. Run `python3 tools/sync-catalog.py` after edits to regenerate `assets/projects.js`, the offline fallback.
- `assets/*-study.svg`: original decorative illustrations, explicitly distinguished from product screenshots.
- `tests/test_portfolio.py`: automated browser, accessibility, responsive, and interaction regressions.
- `docs/`: content audit, validation results, and screenshots for review.

## Content standards

Label each item as a browser demo, learning project, scaffold, or website. Describe synthetic and toy datasets explicitly. Record limitations alongside source links. The lab cards are **proposed concepts, not completed experiments**. No awards, years of experience, employment titles, or model-performance figures are claimed without supporting evidence. See [the content audit](docs/content-audit.md).

The calculator uses a recursive-descent parser in the browser, without `eval`. Iris uses the fixed coefficients already bundled with the site. Neither local example needs a Python API or GitHub access. Other source previews may use `api.github.com` and `raw.githubusercontent.com`, subject to GitHub availability and unauthenticated API limits.

The contact form submits to a Vercel Function with server-side validation, Turnstile verification, shared Upstash rate limits and Resend delivery. It is **disabled until explicitly configured**. No real delivery has been tested. See [provider/DNS/environment setup](docs/contact-setup.md) before enabling it. Copy email and a separate email link remain available.

## Validate

Python 3, Chromium, and Playwright Python are required for the browser suite. Axe-core is used as a test tool only. For example, install test tools outside the checkout:

```bash
python3 -m venv /tmp/yasirlab-test-env
/tmp/yasirlab-test-env/bin/pip install playwright==1.55.0
npm install --prefix /tmp/yasirlab-checks --cache /tmp/yasirlab-npm-cache --no-save --package-lock=false axe-core@4.10.3
YASIRLAB_AXE_PATH=/tmp/yasirlab-checks/node_modules/axe-core/axe.min.js \
  /tmp/yasirlab-test-env/bin/python -m unittest discover -s tests -v
```

The cloud environment already provides Python Playwright and `/usr/bin/chromium`, so its tests can use `python3` directly. Set `CHROMIUM_PATH` for another browser binary. The suite starts its own loopback server. It explicitly mocks GitHub for runner tests and blocks external requests elsewhere; it does not claim live GitHub integrations are verified.

```bash
node --test tests/*.test.js
node --check contact.js
node --check motion.js
node --check theme.js
node --check script.js
node --check demo-page.js
node --check demo-runner.js
python3 tools/sync-catalog.py
git diff --check
```

Tests cover mobile navigation, native-dialog focus, theme preference and persistence, filters/search, contact validation, failure preservation and submission deduplication, calculator errors, Iris predictions, offline catalog fallback, responsive overflow, semantic SEO metadata, and axe audits. Automated accessibility checks are supplemented with keyboard and visual review; they do not replace testing with assistive technology.

## Deployment

Vercel runs `node tools/build-static.js` with output `public/`, and builds root `api/` functions separately. Do not upload the repository root to a static host. Source tests/docs/server helpers are excluded from public output. Review [security findings](docs/security-audit.md), [component audit](docs/component-audit.md) and [validation](docs/validation.md). This work is on `enhancement/yasirlab-premium-secure-contact`, from the latest `main`. Merging or production deployment requires the owner’s approval. Configure and verify a preview first; production delivery stays disabled until approved.
