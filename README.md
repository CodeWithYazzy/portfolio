# Yasir Javed Khan — portfolio

The source for [yasirlab.in](https://yasirlab.in), a five-page personal site about AI, data science, and machine learning. The centerpiece is a visualization lab: three interactive experiments that run entirely in the browser.

The site is hand-written HTML, CSS, and JavaScript. There is no framework, package manager, or build step. Motion is vendored locally as a progressive enhancement; the pages and labs remain fully usable without it.

## Pages

- `index.html` — name, a short introduction, an interactive neural network, and a preview of the lab.
- `about.html` — portrait and the personal details that have been confirmed.
- `projects.html` — a deliberate “Projects coming soon” page. No placeholder case studies.
- `visualize.html` — the Neural Network Playground, Gradient Descent Simulator, and K-Means Clustering experiments.
- `contact.html` — email, GitHub, and X.
- `404.html` — a utility not-found page.

## Visualization lab

- **Neural Network Playground** trains a real 2→H→1 classifier with tanh hidden units, a sigmoid output, binary cross-entropy loss, and full-batch gradient descent. The background is the current prediction surface; the points are generated ring or XOR data. Controls change the dataset, learning rate, hidden units, and label noise.
- **Gradient Descent Simulator** applies the update `x ← x − learning rate × f′(x)` to a bowl or a double well. It draws the function, the tangent, the current point, and the path of previous positions. The convergence message distinguishes a local minimum from a stationary point that is a local maximum.
- **K-Means Clustering** performs Lloyd iterations with k-means++ initialization on generated 2D data. It shows assignments, centroid movement, cluster counts, and inertia. Controls change the cluster count, point count, and data.

The experiments use no ML libraries. All calculations and drawing happen in `canvas`.

## Files

- `style.css` — design tokens, light/dark themes, responsive layout, reveal and hover states, and reduced-motion rules.
- `theme.js` — applies the stored or system theme before paint.
- `main.js` — theme switching, navigation, the animated mobile menu, copy-email feedback, and small UI details.
- `animations.js` — scroll reveals, the scroll-progress line, pointer spotlight/tilt, and reduced-motion fallbacks.
- `vendor/motion.js` — vendored Motion 14.6.0 (MIT) used for reveals and menu motion. See `vendor/README.md` for source and license notes.
- `canvas-utils.js` — shared canvas sizing, theme colors, seeded random numbers, and shape helpers.
- `hero-network.js` — the subtle interactive network on the home page.
- `neural-network.js`, `gradient-descent.js`, `k-means.js` — the three lab experiments.
- `assets/portrait.webp` — the supplied portrait.
- `tests/test_portfolio.py` — Playwright and axe browser checks, including a normal-motion smoke test.
- `docs/` — content audit, validation notes, Lighthouse results, and screenshots.

## Run locally

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. The explicit `.html` links also work on basic static hosts; the Vercel configuration keeps clean URLs.

## Validate

Python 3, Playwright, Chrome or Chromium, and axe-core are needed for the browser suite.

```powershell
python -m pip install playwright
npm install --prefix "$env:TEMP\portfolio-checks" --no-save --package-lock=false axe-core@4.10.3
$env:PORTFOLIO_AXE_PATH = "$env:TEMP\portfolio-checks\node_modules\axe-core\axe.min.js"
$env:PYTHONIOENCODING = "utf-8"
python -m unittest discover -s tests -v
```

The suite starts its own loopback-only static server and blocks external requests. It checks navigation, page content, both themes, the mobile menu, no-JavaScript fallbacks, responsive overflow at 320–1440 px, metadata, internal links, all three labs, axe audits in 16 desktop/mobile states, and a normal-motion smoke test. Set `CHROMIUM_PATH` if Chrome is not in a standard location.

Useful static checks:

```powershell
node --check main.js
node --check theme.js
node --check animations.js
node --check canvas-utils.js
node --check hero-network.js
node --check neural-network.js
node --check gradient-descent.js
node --check k-means.js
node --check vendor/motion.js
git diff --check
```

See [validation notes](docs/validation.md), the [content audit](docs/content-audit.md), and [screenshots](docs/screenshots/).

## Content policy

The site publishes only details that have been confirmed: the name, Mumbai, an interest in AI/data science/machine learning, the supplied portrait, and the three contact links. Education, employment, skills, achievements, and project outcomes are not invented. The Projects page says “coming soon” until real work exists. Generated lab data is described as generated, not as a real dataset.

Automated checks do not replace testing with a screen reader or on a physical device.

## Deployment

`vercel.json` adds clean URLs, security headers, a strict Content Security Policy, and protections that keep source-control and server files from being served. The site is static, so any host that serves the repository root will work. Deploy only with the owner’s approval.
