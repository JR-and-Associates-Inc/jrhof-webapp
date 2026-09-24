# JRHOF Implementation Guardrails

These rules apply to every change unless the maintainer explicitly approves an exception. `AGENTS.md` carries the short version for coding agents.

## Visual and experience

- The site should feel like a historical archive and community nonprofit. Prioritize trust, legacy, readability, accessibility, and photography over conversion patterns. Avoid SaaS, startup, or marketing-landing conventions: billboard heroes, dashboard layouts, decorative card systems, and conversion-panel clutter.
- Don't redesign the homepage unless explicitly asked.
- Preserve the recognizable JRHOF/CHSBUA header (both logos, including on mobile), the uncluttered footer, the blue/gold/white identity, and the historical tone.
- Use the shared page-surface system for standard pages: a constrained `page-shell`, translucent `page-hero`, and `page-surface`/`surface` panels. Keep the radius, padding, border, shadow, and readable contrast over the baseball-field background consistent.
- Use one light theme, with no theme toggle or `prefers-color-scheme` switching.
- Use eyebrow labels sparingly, and prefer plain section headings.
- Improvements should be restrained, accessible, responsive, and visibly part of the same site.

## Mobile, accessibility, and SEO

- Every page must be usable at 390px width: no horizontal overflow, touch-friendly buttons and links, and readable archive cards.
- Images need meaningful `alt` text. Unresolved portraits use neutral alt text.
- Every public page has a unique title and meta description, set through `BaseLayout`. Canonical URLs, breadcrumbs, and JSON-LD come from the layout and event data, and must match the visible page.
- Donation, sponsor, and event pages have one clear primary call to action.
- Preserve legacy URLs with a direct redirect to the final canonical URL (no chains). Keep sitemap generation in place.

## Public content

- Don't restore WordPress login, registration, comments, sharing controls, or plugin fragments.
- Don't expose migration notes, source provenance, reviewer notes, board-review workflow, aliases under review, or internal status language on public pages.
- Don't copy defects from older versions of the site, such as stale calls to action, broken countdowns, incorrect biographies, or unsafe links.
- Never use the WordPress-era biography for Robert Schnabel.
- Keep event records honest and partial. Never link to or imply a program, flyer, gallery, or media asset that hasn't been verified. Event dates and status must match approved facts, and structured data must match the visible page.
- Don't publish unresolved names, biographies, portraits, dates, legal claims, or organizational claims as settled facts.
- Changes to the inductee roster (adding, removing, or renaming a person) update `EXPECTED_INDUCTEES` deliberately in the same change (see `CONTENT_MODEL.md`).
- Use the shared missing-inductee placeholder for every unresolved portrait. Never treat a person-specific `Missing` filename as identity evidence.

## Transactions, integrations, and security

- Don't implement sponsorship payments, banquet or golf registration, add-ons, newsletters, or other transactions until the operational requirements are approved. Those requirements cover ownership, pricing, capacity, fulfillment, data retention, privacy, receipts, refunds, support, reconciliation, spam controls, and failure handling.
- Stripe Payment Links are the donation path. Donation buttons use approved `PUBLIC_STRIPE_*` values or the confirmed defaults in `src/config/site.ts`, and show a disabled state when a link is absent. Don't hard-code unverified Stripe URLs.
- Contact forms must not fake delivery. Until an approved email backend exists, the form must say that messages are not sent.
- Any future payment, registration, or authorization state must be verified server-side. Never trust client-supplied prices or status.
- Don't add Workers, D1, webhooks, secrets, third-party scripts, analytics, advertising conversions, or deployment configuration as incidental work in a page or content change.
- Keep client-side JavaScript lean. Don't put secrets in public code. Use `rel="noopener noreferrer"` on external `target="_blank"` links. Future forms need Turnstile or equivalent spam protection.
- Security headers and the CSP live in `public/_headers`. Keep the CSP aligned with current site behavior, and extend it only for an approved integration.

## Change control

- Branch from current `main`, keep each branch narrowly scoped, and open a pull request.
- Run `npm run verify` for code and content changes. Documentation-only changes need `git diff --check`.
- Update the relevant document in `docs/` when a decision changes the platform, a workflow, or an invariant.
