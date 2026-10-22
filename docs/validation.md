# Validation notes

Last run: 2026-10-22

## Environment

- Windows, Python 3.11.9
- Google Chrome 155.0.8059.85 (Playwright, headless)
- axe-core 4.10.3
- Lighthouse 12.8.2
- Local static preview: `http://127.0.0.1:8765/`

## Automated browser suite

Result: **15/15 tests passed** in 58.9 seconds.

```powershell
$env:PORTFOLIO_AXE_PATH='C:\path\to\axe.min.js'
$env:PYTHONIOENCODING='utf-8'
python -m unittest discover -s tests -v
```

The suite starts its own loopback-only server and blocks external requests. It covers:

- Exactly five navigation destinations on every page, plus the correct active state in desktop and mobile navigation.
- The hero name, both calls to action, the painted hero canvas, and the three lab preview links.
- The Projects page contains no project cards, old project names, demo pages, or invented work.
- About publishes only the confirmed name, Mumbai, interest areas, supplied portrait, and two profiles.
- Contact publishes the confirmed email/GitHub/X links; the copy button writes the email and shows feedback.
- Neural network training reaches above 80% accuracy on the default data, pauses, resets, and steps deterministically.
- Gradient descent steps reduce the loss, converges on the bowl, and reports a local maximum rather than “converged” at the double well’s hilltop.
- K-means converges, reports inertia and cluster counts, resets, and supports changing `k`.
- Theme choice persists across page navigation.
- Mobile menu has five items, marks the current page, and closes with Escape while returning focus.
- No horizontal overflow at 320, 390, 768, or 1440 px across all five pages and the 404 page.
- Canonical URLs, Open Graph image, sitemap, robots file, and local link targets.
- Core content and a JavaScript notice are available with JavaScript disabled.
- The old project catalog, Iris demo, demo pages, and old project names do not survive anywhere on the site.

### Accessibility

Axe returned **zero violations across 16 states**:

- Five pages in light desktop mode.
- Five pages in dark desktop mode.
- Five pages in dark mobile mode.
- The home page with the mobile menu open.

The audit includes WCAG 2.0 A/AA, WCAG 2.1 A/AA, and axe best-practice rules. Canvas controls have visible labels, status text is exposed separately from high-frequency updates, the mobile menu restores focus, and reduced-motion preferences are respected.

## Lighthouse

All four local runs scored **100** for performance, accessibility, best practices, and SEO.

| Run | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home, mobile | 100 | 100 | 100 | 100 | 1.2 s | 0 | 0 ms |
| Home, desktop | 100 | 100 | 100 | 100 | 0.3 s | 0 | 0 ms |
| Visualize, mobile | 100 | 100 | 100 | 100 | 1.7 s | 0 | 10 ms |
| Visualize, desktop | 100 | 100 | 100 | 100 | 0.4 s | 0 | 0 ms |

Scores are from Lighthouse’s simulated mobile and desktop presets against the local Python static server. They are not a field-data measurement.

## Security and progressive enhancement

- A production-style Content Security Policy was applied to every local response during a separate check:
  `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'`.
- All five pages loaded with that policy with no page errors or CSP console violations. The labs, theme toggle, and metadata remained functional.
- The site does not load third-party scripts, fonts, or analytics.
- With JavaScript disabled, headings, explanations, contact details, and the lab notice remain in the page.

## Visual review

Reviewed in Chrome at 1440 px and 390 px in light and dark mode, including each lab in an active state, the mobile menu, About, Projects, Contact, and the 404 page. The lab controls were exercised in the screenshots so the boundary, descent path, and cluster assignments are visible.

Screenshots:

- [Home, light desktop](screenshots/home-light-desktop.png)
- [Home, dark desktop](screenshots/home-dark-desktop.png)
- [Home, light mobile](screenshots/home-light-mobile.png)
- [Visualize, light desktop](screenshots/visualize-light-desktop.png)
- [Visualize, dark desktop](screenshots/visualize-dark-desktop.png)
- [Visualize, light mobile](screenshots/visualize-light-mobile.png)
- [About, light desktop](screenshots/about-light-desktop.png)
- [Projects, light desktop](screenshots/projects-light-desktop.png)
- [Contact, light desktop](screenshots/contact-light-desktop.png)
- [Mobile navigation](screenshots/mobile-navigation.png)

## Static checks

- `node --check` passed for all seven JavaScript files.
- `git diff --check` passed. Git reports the usual Windows LF/CRLF conversion warnings but no whitespace errors.
- Old catalog, demo, and project assets were removed from the working tree; history retains them.

## Limitations

- No physical-device, Safari, or screen-reader testing was performed in this environment.
- Lighthouse is synthetic and local; production field results may differ.
- The site has not been deployed or pushed in this review. The current branch is still awaiting owner approval.
