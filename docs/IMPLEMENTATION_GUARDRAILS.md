# JRHOF Implementation Guardrails

These guardrails apply to every future implementation branch unless an explicit, documented approval supersedes a specific item.

## Visual and experience guardrails

- Do not redesign the homepage unless explicitly approved.
- Keep standard public pages on the shared Astro page surface system: a constrained `page-shell`, translucent `page-hero`, `page-surface`/`surface` panels, consistent radius, padding, border, shadow, readable contrast, and 390px-safe responsive behavior over the baseball-field background.
- Do not add SaaS-, startup-, or marketing-style hero treatments, billboard intros, dashboard compositions, conversion-panel clutter, or decorative card systems that make JRHOF feel unfamiliar.
- Prefer the live production site’s visual rhythm, hierarchy, density, and nonprofit/archive character unless the production behavior is broken, risky, stale, inaccessible, or operationally weak.
- Preserve the recognizable JRHOF/CHSBUA header, blue/gold/white identity, historical tone, and direct content hierarchy.
- Improvements should be restrained, accessible, responsive, and visibly part of the same site.

## Legacy and public-content guardrails

- Do not restore WordPress login, registration, comments, sharing controls, search/plugin fragments, or other plugin clutter.
- Do not expose migration lanes, source provenance, reviewer notes, board-review workflow, aliases under review, implementation explanations, or internal status language on public pages.
- Do not copy production defects merely for parity, including stale event calls to action, broken countdowns, malformed details, incorrect biographies, unsafe links, or fragmented payment flows.
- Never use the live/WordPress biography for Robert Schnabel.

## Archive and content guardrails

- Preserve exactly 150 unique inductee records, archive entries, and canonical biography routes unless an approved roster decision explicitly changes the count.
- Keep event archive records honest and partial. A record may identify a pending scan, pending upload, pending photos, or planned gallery migration, but must not link to or imply the existence of a program, flyer, gallery, or media asset that has not been verified.
- Do not add gallery image manifests, bulk media imports, scanned documents, PDF imports, lightboxes, R2 storage, or another media pipeline as incidental work in the Layer 1 event archive.
- Tentative event dates must remain visibly tentative and must not receive time-sensitive `Event` schema.
- Preserve validation for unique records/routes, working archive links, Gene archive visibility, Robert Schnabel source safety, placeholder handling, and forbidden legacy UI.
- Preserve aliases, provenance, review states, and redirect candidates internally even when they should not be prominent publicly.
- Preserve the production-familiar missing-inductee placeholder when its use is approved; use one shared unresolved-portrait state and neutral alt text. Never treat person-specific `Missing` filenames as identity evidence.
- Do not publish unresolved names, biographies, portraits, dates, legal claims, or organizational claims as settled facts without approval.

## Transaction and operations guardrails

- Do not implement sponsorship payments, banquet registration, golf registration, add-ons, newsletters, or other transactions until operational requirements are approved.
- Stripe is the intended online donation processor. Donation buttons may use approved `PUBLIC_STRIPE_DONATE_ONETIME_URL` and `PUBLIC_STRIPE_DONATE_MONTHLY_URL` values, but the site must show a disabled/not-configured state when links are absent. Do not hard-code unverified Stripe URLs.
- Contact forms must not fake delivery. Until an approved transactional email provider, secrets, backend route, spam controls, and retention process exist, the public form may be review-ready but must clearly report that messages are not sent.
- Approval must cover ownership, prices/packages, capacity, fulfillment, data collection and retention, privacy/consent, confirmations, receipts, refunds/cancellations, support, reconciliation/reporting, fraud/spam controls, and failure handling.
- Future payment state, prices, inventory, registration state, and authorization must be verified server-side. Never trust client-supplied values.
- Do not add Workers, D1, webhooks, secrets, third-party scripts, analytics, advertising conversions, or deployment configuration as incidental work in a page/content branch.

## Security header guardrails

- Use `public/_headers` for Cloudflare Pages-compatible static security headers on the Astro build output.
- Keep the initial CSP conservative and aligned to the current site behavior rather than to future integrations.
- Allow inline script and style only when the current page surface still requires it, and document why those allowances exist.
- Defer HSTS until the production domain and cutover path are verified; do not enable preload in a pre-cutover branch.

## Change-control guardrails

- Start from the current accepted `main` baseline and keep branches narrowly scoped.
- Treat `src/app/**`, `next.config.ts`, and other Next.js artifacts as legacy reference only unless a dedicated approval explicitly revives them.
- Do not hand-edit generated data files such as `src/data/inductees.json` or generated redirect manifests without rerunning the appropriate generators and reviewing the diff.
- Cite [PROJECT_CONTROL.md](PROJECT_CONTROL.md), [LAUNCH_VISION.md](LAUNCH_VISION.md), and the relevant standards/decisions in implementation plans.
- Treat audits as evidence and historical plans as context, not as standing authorization.
- Update authoritative documentation when an approved decision changes status, sequence, scope, or an invariant.
- Validate in proportion to the change. Documentation-only changes require `git diff --check`; implementation changes follow [SITE_QUALITY_STANDARDS.md](SITE_QUALITY_STANDARDS.md) plus feature-specific acceptance tests.
