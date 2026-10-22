# Content audit

Last reviewed: 2026-10-22

This audit records what the site publishes, where it came from, and what was deliberately removed. The governing rule for this redesign was: if a personal detail was not confirmed, it does not appear.

## Confirmed personal content

The following details are published:

| Detail | Where it appears |
| --- | --- |
| Name: Yasir Javed Khan | Header, home, About, footer, page titles, structured data |
| Location: Mumbai, India | About, home page metadata, structured data |
| Interests: AI, data science, machine learning | Home, About, footer, structured data |
| Portrait | About (`assets/portrait.webp`) |
| Email: `codewithyazzy@gmail.com` | Contact, footer, copy button |
| GitHub: `https://github.com/CodeWithYazzy` | About, Contact, footer |
| X: `https://x.com/codewithyazzy` | About, Contact, footer |

No other personal facts are asserted.

## Not published

The redesign does not include education, employment, job title, student status, years of experience, a skills list, certifications, awards, achievements, project metrics, testimonials, or client work. These were not confirmed for publication.

The previous copy described a “student and developer” and listed Python, data, and machine-learning project work. That copy was removed rather than rephrased.

## Projects

The previous site contained 15 project entries, a catalog, filter/search pages, demo pages, and project images. Those entries were not verified work and have been removed from the working site. The current Projects page says:

> Projects coming soon.
>
> I haven’t published any projects yet. When there’s something real to show, it will appear here.

There are no placeholder case studies, invented outcomes, fake screenshots, or links that imply a project exists.

## Visualization lab

The three experiments are real programs, not recordings or static mockups:

- **Neural Network Playground** generates synthetic ring or XOR data, trains a small classifier with full-batch gradient descent, and recomputes the prediction surface from the current weights. The generated data is not presented as a real dataset.
- **Gradient Descent Simulator** evaluates known mathematical functions and their derivatives. The path, tangent, loss, and convergence message come from those calculations.
- **K-Means Clustering** generates synthetic two-dimensional points and runs Lloyd iterations. Inertia and cluster counts are computed from the current assignments.

The explanations state the algorithms and their limits. K-means is explicitly described as finding geometric groups, not meaning. The neural network is presented as a small interactive experiment, not a production classifier.

## Contact

Only the confirmed email address and two confirmed profiles are linked. The page has no contact form, no third-party form service, and no unverified social accounts. The footer repeats the same three destinations.

## Removed material

The following were removed from the working tree and remain available in Git history:

- The 15-project catalog, project records, category filters, search, and archive pages.
- The Iris classifier demo, calculator demo, demo runner, and preview sandbox.
- Project screenshots and decorative “study” assets for the removed work.
- The old catalog synchronization tool and generated catalog fallback.
- Unverified claims about education, work, skills, and project outcomes.

## Maintenance rule

Before adding a personal detail or a project, confirm it with the site owner and record the confirmation in this file. Do not fill empty sections with plausible copy.
