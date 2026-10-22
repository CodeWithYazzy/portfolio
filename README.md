# Yasir Javed Khan — portfolio

The source for [yasirlab.in](https://yasirlab.in), a personal portfolio for Yasir Javed Khan, a student and developer in Mumbai. It collects small browser demos and learning projects in Python, data, and machine learning.

The site is hand-written HTML, CSS, and JavaScript. There is no framework, package manager, or build step.

## Pages

- `index.html`: name, a short introduction, a working Iris classifier, selected work, about, and contact.
- `pages/all-projects.html`: all 15 projects with category filters, search, status, technology, and direct demo or source links.
- `pages/demo.html`: project pages. Browser demos come first; written project details and source links follow.
- `404.html`: a plain not-found page.

## How it works

- `style.css` holds the shared design system, responsive layout, themes, and reduced-motion rules.
- `theme.js` chooses the stored or system theme before paint. `script.js` handles navigation, theme changes, the archive, copy-email feedback, and the live Iris demo.
- `assets/projects.json` is the authoritative project catalog. After editing it, run `python tools/sync-catalog.py` to regenerate the offline fallback in `assets/projects.js`.
- The Iris classifier uses fixed logistic-regression coefficients bundled with the site. The calculator uses a small recursive-descent parser, not `eval`. Both run entirely in the browser.
- `demo-runner.js` inspects public GitHub repositories and can preview static HTML in a sandboxed iframe. Python and server projects report their runtime requirements instead of pretending to run.
- Contact is a direct `mailto:` link with a copy button. There is no contact form and no third-party service.

All project descriptions are deliberately short and factual. Statuses and limitations are shown next to the work. Synthetic datasets and unfinished exercises are labeled as such. See [the content audit](docs/content-audit.md).

## Run locally

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. The explicit `.html` links also work on basic static hosts, and the existing Vercel clean URLs remain supported.

## Validate

Python 3, Playwright, Node, Chrome or Chromium, and axe-core are needed for the browser suite. Axe is a test tool only; it is not shipped to visitors.

```bash
python -m pip install playwright
npm install --prefix /tmp/portfolio-checks --no-save --package-lock=false axe-core@4.10.3
PORTFOLIO_AXE_PATH=/tmp/portfolio-checks/node_modules/axe-core/axe.min.js \
  python -m unittest discover -s tests -v
```

On PowerShell:

```powershell
$env:PORTFOLIO_AXE_PATH = "C:\path\to\axe.min.js"
python -m unittest discover -s tests -v
```

The suite starts its own loopback-only server and blocks external requests except for explicit GitHub fixtures. Set `CHROMIUM_PATH` if Chrome is not in a standard location.

Static checks:

```bash
node --check theme.js
node --check script.js
node --check demo-page.js
node --check demo-runner.js
python tools/sync-catalog.py
git diff --check
```

The browser suite covers the live homepage demo, archive filtering and search, theme persistence, mobile navigation, calculator and Iris behavior, the sandboxed preview runner, offline catalog fallback, responsive overflow, metadata, and axe audits in both themes at mobile and desktop widths. See [validation notes](docs/validation.md) for the latest local results and [screenshots](docs/screenshots/).

Automated checks do not replace testing with a screen reader or a physical device.

## Deployment

`vercel.json` is unchanged. The site is static, so any host that serves the repository root will work. Merging to the production branch can trigger the existing Vercel deployment; do that with the owner's approval.
