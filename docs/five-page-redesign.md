# Five-page AI portfolio redesign

## Current scope

The existing HTML/CSS/JavaScript site has been simplified to exactly five main pages: **Home, About, Projects, Visualize and Contact**. The dark-first navy system uses restrained blue/purple accents, readable neutral typography, thin structural borders and modest glass on the navigation. A persistent light theme remains available. No frontend framework, external font service or animation library was introduced.

The owner explicitly said there are no portfolio projects yet. The 15-entry project catalog, invented-looking study imagery, old lab concepts, duplicate homepage sections, calculator/Iris pages and the GitHub preview runner are removed. The owner specifically approved removal of the legacy demos. Vercel redirects old demo URLs to Visualize; the previous gallery leads to Projects. The Projects page uses the exact requested Coming Soon heading and subheading, with no cards, dates or countdowns.

## Confirmed personal content

- Brand: **YasirLab**.
- Approved title: **Class 10 student · Aspiring machine learning engineer**.
- Approved introduction: “I’m learning Python, working with NumPy, and exploring PyTorch to understand how machine learning models are built and trained.”
- Current learning: advanced Python topics in progress, working knowledge of NumPy, beginning PyTorch.
- Background: Class 10 student; interest in computers began with the family's first computer in 2024; Python lessons and a data science course led toward a machine learning engineering goal.
- Confirmed channels: `codewithyazzy@gmail.com`, `https://github.com/codewithyazzy`, `https://youtube.com/codewithyazzy`.
- **Exact display name: still awaiting the owner.** `[Your name]` is deliberately visible. The old name has not been assumed to be the requested updated name.

No advanced-professional title, employment, completed course/certification, university affiliation, awards, school ranking or project achievement is claimed. Ambiguous dates and unnecessary personal details are omitted. Aspirations are presented as goals.

## Visualize: implemented experiences

| Experiment | Actual behavior | Explicit limitation |
| --- | --- | --- |
| Gradient descent | Computes the analytical update for `f(x)=x²`; adjustable learning rate/starting point; trail, step, run/pause, reset, numerical loss and instability feedback. | A one-variable mathematical simulation, not a trained model. Convergence conditions apply to this quadratic. |
| K-means | Seeded synthetic points, farthest-first centers, actual Lloyd assignment/mean iterations, color/shape group labels, SSE, run/pause/reset, new data, mouse or keyboard-coordinate point addition. | Local optima/initialization dependence explained. Empty clusters retain their center. Dataset limited to 150 points for interactivity. |
| Neural network | Adjustable input/output width, hidden layer count/width, exact dense weight/bias counts and keyboard-accessible neuron connection highlighting. Diagram scrolls within its container on narrow screens. | Architecture only. No weights, activations, model training or inference results are fabricated. |

Only the active experiment is rendered initially. Tab controls support arrow keys, Home/End, selected state and shareable URL fragments. Runs stop when switching tabs or hiding the browser page. Reset restores meaningful initial state. No visualization data is uploaded, and no tracking/model API is used. Reduced motion removes decorative transitions; timers run only after explicit interaction.

## Contact behavior

Confirmed email/social links are available without JavaScript. The existing guarded submission backend is retained as an optional capability, not a service required by this portfolio. The form starts hidden and is revealed only when configuration is complete and sending has been explicitly enabled. Absent, failed or unconfigured API responses leave the form hidden. There is no fake functional-looking form.

No provider credentials were created, accounts activated or real emails sent. Real inbox delivery is not verified. Existing [provider setup](contact-setup.md) documents the optional activation requirements and the separate authorization needed for a real test email. The rest of the portfolio works without any provider account.

## Validation

**Final results:** 37 Node tests and all 16 browser methods passed (99.143 seconds), with no skips or unexpected page errors. All 30 axe states reported zero violations. Gitleaks 8.30.1 found zero working-tree secrets; this does not prove no possible leaks. Browser/provider mocks are distinguished from live integrations. Tests exercise the local source; Lighthouse and screenshots use the packaged preview with configured security headers. Local preview results are not production field data.

- Algorithm tests check the exact quadratic derivative, monotonic loss, oscillation/divergence, reproducible datasets, known Lloyd means, decreasing SSE, empty/duplicate clusters and dense parameter formulas.
- Browser tests cover five-route navigation, Coming Soon copy, interactive Home preview, each visualization, keyboard tabs/neuron selection, run/pause/reset, input errors, contact hidden/configured/mock submission states, no-JavaScript fallbacks and theme behavior.
- Responsive widths: 320, 375, 390, 768, 1024, 1440, 1920px, including all three visualization tabs.
- Axe states: five pages plus two extra experiment panels × two themes × desktop/mobile, plus invalid/successful mocked contact states (30 total).
- Build checks exclude server helpers/tests/docs/secrets from static output, and verify the JSON-LD CSP hash.
- 131 local HTML resource/navigation references resolve; JavaScript syntax/SVG parsing and whitespace checks are verified.

Actual Safari, screen readers, physical mobile devices and production hosting/provider behavior remain unverified. The cloud environment blocks direct access to `yasirlab.in`, so no live-deployment review is claimed. GitHub API access is also currently denied; Git transport can be checked independently when publishing the branch.

## Customization and review

`profile.js` holds confirmed public profile fields; update corresponding HTML fallbacks as described in README. The one remaining personal-content dependency is the exact display name. `projects.html` is intentionally an empty state, ready for real project articles later. Algorithms live in `visualize-core.js`; UI controllers live in `visualize.js` and `home.js`; design tokens are at the top of `style.css`.

Screenshots are in [screenshots/five-page](screenshots/five-page/), including all five pages, both themes, desktop/tablet/mobile and actual experiment states. Previous screenshots/audit reports are clearly historical and are not shipped as public site assets.

This is review work on `redesign/ai-portfolio-five-pages`. No merge or production deployment is authorized or performed.

## Measured Lighthouse results

| Mobile preset | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| Home | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| Visualize | 99 | 100 | 100 | 100 | 1.7 s | 0 | 0 ms |

These are local Chromium lab measurements, not a claim about production devices or field performance. [Machine-readable summary](five-page-validation.json).
