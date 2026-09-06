# YasirLab — Machine Learning Engineering Laboratory

> **yasirlab.in** — premium personal portfolio on the surface, AI/ML engineering lab underneath. 4 destinations, 15 builds, zero fake demos.

![Status](https://img.shields.io/badge/Status-Live-brightgreen) ![Stack](https://img.shields.io/badge/Stack-HTML%20%7C%20CSS%20%7C%20JS-blue) ![License](https://img.shields.io/badge/License-MIT-green)

---

## Live

**https://yasirlab.in** — auto-deployed via Vercel from `main`.

---

## Structure — 4 nav

**Home · About · Projects · Contact** — everything else lives inside.

- **Home** — hero (Yasir Javed Khan • ML Developer • AI Systems Builder) + compact flagship + lab teaser + workflow mini + stats bar
- **About** — `About` + `Why I Build` + `Skills (7 groups, 26 tech)` + `Workflow Build→Iterate` + `Achievements (5)` as editorial subsections
- **Projects** — flagship `iris-classifier` (97% held-out) + **ML Lab 6 experiments** (CNN vs Transfer, Evaluation, Hyperparams, Transformers, Data, Optimization — modals `Hypothesis→Conclusion`) + 15 project grid + GitHub/demo links
- **Contact** — email `codewithyazzy@gmail.com`, GitHub, X, form (mailto)

Design: Figma-inspired editorial, ink/blue, Plus Jakarta Sans + JetBrains Mono, 104px whitespace, hand-crafted irregularity, no AI-template look.

---

## Run locally

No build step — just open `index.html` or:

```powershell
python -m http.server 8765
# http://localhost:8765
# /pages/all-projects.html
# /pages/demo.html?project=Iris%20Flower%20Classifier
```

- `assets/projects.json` — 15 projects, `localDemo: iris/calculator` for browser demos
- `script.js` — fallback catalog for `file://`, project rendering, lab modals, nav observer mapped to 4 nav
- `demo-runner.js` — **real GitHub fetch** (`api.github.com` + `raw.githubusercontent.com`), static rewrite to `data:` URLs, sandboxed iframe, honest `Python required` for true Python projects

Calculator & Iris run **in-browser** via safe `evaluateLocally()` / `StandardScaler+LR` JS — no server needed.

---

## Projects — CodeWithYazzy/projects

Monorepo `https://github.com/CodeWithYazzy/projects` — each folder real, runnable:

`iris-classifier` · `sales-dashboard` · `pytorch-image-classifier` · `house-price-predictor` · `portfolio-website` · `sentiment-analysis` · `numpy-explorer` · `matplotlib-visualizer` · `pytorch-chatbot` · `heart-disease-predictor` · `customer-segmentation` · `handwritten-digit-classifier` · `stock-predictor` · `ai-assistant` · `calculator-app`

See that repo’s `README.md` for catalog table + per-project quick starts.

---

## Deploy

```bash
git push origin main  # Vercel auto-builds yasirlab.in
```

`vercel.json` — `cleanUrls`, `HSTS`, `CSP` (`script-src 'self' https://unpkg.com`, `connect-src api.github.com`).

---

© Yasir Javed Khan — Build → Experiment → Evaluate → Deploy → Iterate
