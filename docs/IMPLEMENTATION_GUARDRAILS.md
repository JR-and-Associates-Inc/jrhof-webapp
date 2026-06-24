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

## Change-control guardrails

- Start from the current accepted `main` baseline and keep branches narrowly scoped.
- Treat `src/app/**`, `next.config.ts`, and other Next.js artifacts as legacy reference only unless a dedicated approval explicitly revives them.
- Do not hand-edit generated data files such as `src/data/inductees.json` or generated redirect manifests without rerunning the appropriate generators and reviewing the diff.
- Cite [PROJECT_CONTROL.md](PROJECT_CONTROL.md), [LAUNCH_VISION.md](LAUNCH_VISION.md), and the relevant standards/decisions in implementation plans.
- Treat audits as evidence and historical plans as context, not as standing authorization.
- Update authoritative documentation when an approved decision changes status, sequence, scope, or an invariant.
- Validate in proportion to the change. Documentation-only changes require `git diff --check`; implementation changes follow [SITE_QUALITY_STANDARDS.md](SITE_QUALITY_STANDARDS.md) plus feature-specific acceptance tests.
