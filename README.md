# CodeWithYazzy Portfolio

Static portfolio website for Yasir Javed Khan, focused on AI/ML and data projects.

## Structure

- `index.html` — homepage
- `pages/` — secondary HTML pages (`all-projects`, `demo`)
- `style.css` — site styles
- `script.js` — shared behavior and project rendering
- `assets/` — flat project data, profile image, and project artwork

## Run locally

No tools or servers required — just open `index.html` in any browser (double-click it). Everything works directly from disk:

- Project catalog falls back to the embedded copy in `script.js` when `assets/projects.json` cannot be fetched.
- GitHub-backed demos only need an internet connection (GitHub's APIs allow cross-origin requests, even from `file://` pages).
- The Calculator App evaluates expressions **inside your browser** with a safe parser — Python is not required.

Optional: serve over HTTP for a cleaner setup:

```powershell
python -m http.server 8765
```

Then open `http://localhost:8765/`. Secondary pages are available at `/pages/all-projects.html` and `/pages/demo.html`.

The Calculator App can optionally use its Python backend for evaluation — start it with `python server.py` and it will be detected automatically. Without it, evaluation happens locally in the browser.

## Content updates

Edit `assets/projects.json`. Keep links limited to the real GitHub profile and official website unless a verified project URL is available.

## GitHub-backed demo system

`pages/demo.html` + `demo-runner.js` inspect the **real repository** configured per project (`github`, optional `subdir`, optional `demoUrl`) using the GitHub API and raw file endpoints:

- **Static HTML/CSS/JS repos** are fetched into an in-memory filesystem, relative asset URLs are rewritten, and the actual project UI runs inside a sandboxed iframe (`allow-scripts`, opaque origin).
- **Vite/React/Next repos** run their committed `dist/`/`build/` output when present; otherwise the page says plainly that a live build environment is required ("Source available on GitHub — live build required"). No fake demo is ever shown.
- **Node/Python projects** cannot execute in a browser tab; the reason is displayed instead.
- **Calculator App** uses its verified `calculator-app.py` source (Tkinter desktop app); the web preview evaluates in-browser with a safe parser, upgrading to `server.py` automatically when it is running.

Priority order: deployed `demoUrl` → committed build → build service adapter (`window.DEMO_BUILD_SERVICE`) → static source execution → honest "unavailable" state. Repository metadata/tree/files are cached in memory for the session; reloading the page clears the cache. Unauthenticated GitHub API limits (60/hour/IP) apply and are reported if hit.
