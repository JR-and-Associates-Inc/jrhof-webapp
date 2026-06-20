# Astro Static Foundation

## Outcome

Phase 1 converts the public presentation layer from Next.js runtime assumptions to a fully static Astro site. It targets Cloudflare Pages with `npm run build` and the `dist` output directory. No Cloudflare adapter is installed because all routes are pre-rendered and this phase uses no Pages Functions or Workers.

## What was built

- Shared Astro layout, responsive blue/gold/white styling, header, navigation, footer, and metadata defaults.
- Home, about, archive, 150 biography routes, events, banquet, golf tournament, donate, sponsor, contact, privacy, terms, and 404 pages.
- Searchable client-side inductee archive with all 150 records and direct detail-page links.
- Candidate data generation from the control roster, source reconciliation, original DOCX biographies, and original portraits.
- One intentional `portrait-pending.svg` fallback for unresolved portraits.
- Sitemap generation and a draft Cloudflare Pages `_redirects` manifest.
- Content/build validation for counts, links, critical special cases, and forbidden legacy UI.

## Production-layout parity pass

The static foundation now follows the production homepage's classic content hierarchy rather than a new marketing-site hierarchy:

1. Our Mission
2. 2026 Hall of Fame Inductees
3. Our Latest Events
4. Explore Our Past Events
5. Support the Hall of Fame

The production baseball-diamond background was copied into `public/images/diamond_bg.webp` so the Astro site keeps the familiar setting without loading an asset from WordPress. The header retains the left JRHOF emblem, centered CHSBUA association name, Hall of Fame title, original italic tagline, and right CHSBUA logo. Navigation follows the production order while omitting account/search controls. The footer repeats the emblem, tagline, CHSBUA relationship, nonprofit copyright line, TMCO credit, and policy links.

The implementation deliberately keeps the cleaner semantic markup, keyboard skip link, descriptive image alternatives, responsive menu, mobile card layout, and static-site behavior.

## Intentionally not preserved

- WordPress login/register and comments UI.
- Broken countdowns and stale dates presented as current.
- Eventbrite presented as the future registration architecture.
- Broken banquet form fields.
- Person-specific `Missing` files and generic silhouettes presented as portraits.
- Robert Schnabel's incorrect WordPress/live Joe Rossi biography.
- Legacy contact API calls without an approved static-site backend.
- WordPress search/account controls and plugin-driven layout fragments.

## Deployment boundary

This branch does not deploy. Cloudflare Pages configuration for a future preview is:

- Build command: `npm run build`
- Build output directory: `dist`
- Runtime: none; Astro static output

Stripe, Workers, D1, webhooks, native registration, sponsor checkout, and Google Ads conversion tracking are excluded from this phase.

## Validation expectations

`npm run validate` confirms 150 unique records and detail pages, all archive links, Gene Rozzelle visibility, Robert Schnabel source safety, the shared-placeholder policy, and absence of stale Eventbrite/login/comments UI in built HTML.
