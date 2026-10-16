# YasirLab 2.0

A personal developer portfolio, an AI/ML learning laboratory, and an evolving independent technology identity for Yasir Javed Khan.

The site uses semantic HTML, CSS, and vanilla JavaScript. No application dependencies, package manager, framework, or build step are required. Fonts and icons use system typography and local SVGs; core functionality works without third-party CDNs.

## Run locally

```bash
cd /workspace/portfolio  # or your local checkout
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `index.html`, `pages/all-projects.html`, or `pages/demo.html?project=Iris%20Flower%20Classifier` through that server. The explicit `.html` links also work on basic static hosts. Vercel's existing clean URLs remain supported. Opening files directly supports the bundled catalog and local demos, but HTTP is the recommended workflow.

## Structure

- `index.html`: overview, selected work, six lab concepts, about, and contact.
- `pages/all-projects.html`: searchable collection with category filters and project details.
- `pages/demo.html`, `demo-page.js`, `demo.css`: preview interface and existing calculator/Iris implementation.
- `demo-runner.js`: GitHub source inspection, project-type detection, and sandboxed static previews. Python and server projects display their runtime requirements rather than simulated output.
- `style.css`: shared light/dark tokens, layout, components, and reduced-motion behavior.
- `theme.js`: pre-paint system/stored theme selection; `script.js` handles persistence and interactive components.
- `assets/projects.json`: authoritative project content. Run `python3 tools/sync-catalog.py` after edits to regenerate `assets/projects.js`, the offline fallback.
- `assets/*-study.svg`: original decorative illustrations, explicitly distinguished from product screenshots.
- `tests/test_portfolio.py`: automated browser, accessibility, responsive, and interaction regressions.
- `docs/`: content audit, validation results, and screenshots for review.

## Content standards

Label each item as a browser demo, learning project, scaffold, or website. Describe synthetic and toy datasets explicitly. Record limitations alongside source links. The lab cards are **proposed concepts, not completed experiments**. No awards, years of experience, employment titles, or model-performance figures are claimed without supporting evidence. See [the content audit](docs/content-audit.md).

The calculator uses a recursive-descent parser in the browser, without `eval`. Iris uses the fixed coefficients already bundled with the site. Neither local example needs a Python API or GitHub access. Other source previews may use `api.github.com` and `raw.githubusercontent.com`, subject to GitHub availability and unauthenticated API limits.

The contact form validates fields and opens a `mailto:` draft. Nothing is transmitted to a form service, and the page preserves entered text if an email app is unavailable. Copy email uses the Clipboard API where supported.

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
node --check theme.js
node --check script.js
node --check demo-page.js
node --check demo-runner.js
python3 tools/sync-catalog.py
git diff --check
```

Tests cover mobile navigation, native-dialog focus, theme preference and persistence, filters/search, email draft encoding, calculator errors, Iris predictions, offline catalog fallback, responsive overflow, semantic SEO metadata, and axe audits. Automated accessibility checks are supplemented with keyboard and visual review; they do not replace testing with assistive technology.

## Deployment

The existing `vercel.json` remains in place. This redesign is developed on `redesign/yasirlab-2` for pull-request review. Merging to `main` can trigger the repository's existing production deployment; do so only with the owner's approval.
