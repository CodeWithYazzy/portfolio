# YasirLab

A five-page AI/Data Science learning portfolio, built with HTML, CSS and vanilla JavaScript. No frontend framework, runtime package installation, authentication or visualization service is required.

## Pages

- **Home** — personal introduction and a functional quadratic gradient-descent preview.
- **About** — the owner's confirmed Class 10 learning story, Python/NumPy experience, PyTorch learning and goals.
- **Projects** — the requested Coming Soon empty state. There is no project catalog or invented work.
- **Visualize** — gradient descent, K-means clustering and an interactive dense-network architecture explorer.
- **Contact** — confirmed email, GitHub and YouTube links. A submission form is hidden unless the pre-existing server integration is fully configured and explicitly enabled.

The exact display name remains a clearly marked placeholder until the owner supplies it. No professional employment, certifications, achievements, university affiliation or completed projects are claimed.

## Run and build

```sh
node tools/build-static.js
node tools/preview.js
```

The loopback preview serves `public/` on port 8766. `PORT` can select another port. On a static-only host, serve the packaged `public/` folder; the contact form stays hidden when its API is absent. Vercel builds root `api/` functions separately. No provider accounts are needed to use the five pages or the visualizations.

The build copies an explicit list of browser files. Tests, docs, credentials, server helpers and source tools are excluded from public URLs. Vercel keeps clean URLs; explicit `.html` navigation also works on basic static servers.

## Customize content

Edit `profile.js` for the confirmed display name, title, introduction, skills, background, email and approved public links. `name:null` deliberately leaves `[Your name]` visible. Use only verified personal details. These values are public; never place credentials in this file.

Core content and confirmed contact links also exist directly in the HTML so they remain useful without JavaScript. After changing personal copy in `profile.js`, update the matching HTML fallback in `index.html`, `about.html` or `contact.html`. The `data-profile` attributes identify those locations. Social links are limited to the user-provided GitHub/YouTube profiles; no LinkedIn account is invented.

To add real projects later, replace the Coming Soon content in `projects.html` with semantic project articles and genuine source/demo links. Add only projects the owner confirms. There are no hidden fake cards, countdowns or promised dates.

## Educational experiments

`visualize-core.js` contains pure, deterministic algorithms, shared by the browser and Node tests. `visualize.js` renders accessible SVG plots and connects the controls. `home.js` runs the small Home preview.

- Gradient descent uses `f(x)=x²`, derivative `2x`, and the exact update `x ← x − η·2x`. The explanation documents convergence/oscillation/divergence for this specific function. Runs stop on convergence, chart-range escape or an iteration bound.
- K-means runs actual nearest-center assignment and mean updates (Lloyd iterations), with seeded synthetic data and farthest-first initialization. Empty clusters retain their center. Changing data resets iteration state. Color and shape distinguish groups; numeric coordinate inputs provide a keyboard alternative to plot clicking.
- The network explorer shows fully connected layer structures and exact weight/bias counts. Selecting a neuron highlights its connections. It does **not** train a model, invent weights or produce predictions.

Tabs support arrow/Home/End keys, sharable fragments and hidden-panel focus isolation. Runs stop when switching experiments or hiding the browser tab. Reduced-motion preferences remove decorative animation. No data is uploaded and there are no analytics, model APIs, animation libraries or external font requests.

## Contact

The supplied public inbox is `codewithyazzy@gmail.com`. Email and confirmed social links work immediately. The earlier guarded server implementation remains optional and disabled by default; see [contact setup](docs/contact-setup.md). Its form is not displayed unless `GET /api/contact-config` reports complete, explicitly enabled configuration. Do not enable it with dummy keys. Real email delivery remains unverified and requires separately authorized testing. No real emails were sent during this redesign.

## Validation

```sh
node --test tests/*.test.js
YASIRLAB_AXE_PATH=/path/to/axe.min.js python3 -m unittest discover -s tests -v
python3 tools/capture-review.py
node tools/update-csp.js  # after changing the Home JSON-LD block
```

Browser tests need Python Playwright, Chromium and a local axe-core bundle. Tool dependencies can be installed outside the repository, for example `npm install --prefix /tmp/yasirlab-checks axe-core@4.10.3 lighthouse@12.8.2`. They are development tools, not app dependencies.

See [five-page review and measured validation](docs/five-page-redesign.md) and [screenshots](docs/screenshots/five-page/). Earlier audit/screenshot documents refer to prior iterations. Calculator/Iris demos and the old catalog were removed at the owner's explicit request. Their old demo URLs redirect to Visualize on Vercel; the old gallery URL leads to Projects.

No merge or production deployment is authorized by this change. Review the branch and preview before approving a release.
