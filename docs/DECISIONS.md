# Architecture Decisions

> This file is intentionally limited to durable ADR-style decisions. Superseded decisions stay in place with a note pointing at their replacement.

## ADR-001: Astro static output

Use Astro static generation so public routes do not require application sessions or a database. The project has no Cloudflare adapter because every current route is prerendered; the direct `dist/` output is published by Workers Static Assets. Add a server adapter or Worker entrypoint only when an approved request-time feature requires one.

## ADR-002: Generated JSON candidate model

Use `src/data/inductees.json` as the Astro data layer. A standard-library Python generator reads the reconciliation CSV and original DOCX files. The generated JSON is committed, so normal Node/Cloudflare builds do not depend on Python or DOCX libraries.

This is a candidate layer, not final board-approved canonical data.

*Superseded by ADR-015: the generator was retired and the JSON is now hand-maintained.*

## ADR-003: Preserve WordPress detail paths

Use the reconciled WordPress slug under `/inductees/` as the proposed canonical detail URL. Redirect root-level legacy Next.js routes and known variants directly to those paths. This avoids redirect chains and prioritizes current production URLs.

## ADR-004: Conservative source publication

Prefer clearly mapped original DOCX biographies. Do not use WordPress/live text for Robert Schnabel. Render a pending state when no readable original biography is available. Carry board-review flags into the data and page UI.

## ADR-005: One placeholder policy

Only person-specific, non-placeholder original photos become candidate portraits. Named `Missing` files, the common placeholder, four byte-identical generic silhouettes, and Terry/Ray identity-uncertain media do not qualify. All unresolved records use the shared missing-inductee placeholder (`inductees/placeholders/v1/missing-inductee.webp` on R2).

## ADR-006: No native transactional behavior in the static site

Do not introduce native payment storage, D1, webhooks, or server-verified registration inside the static foundation without separate approval. Dashboard-managed Cloudflare Web Analytics and Google measurement configured through GTM are operational platform configuration, not authorization for new transaction or conversion flows.

## ADR-007: Project-wide quality standards

Adopt the project-wide quality standards (now part of `docs/IMPLEMENTATION_GUARDRAILS.md`) as the standing baseline for single-theme behavior, security, SEO, mobile usability, visual parity, and validation. Treat it as a cross-cutting requirement for all future page and platform work.

## ADR-008: Single light-theme foundation

Keep the site on a single light theme that matches the historical JRHOF presentation. Do not ship localStorage preference handling, `prefers-color-scheme` switching, or a visible theme toggle in the static foundation.

## ADR-009: Archival visual tone

Soften the eyebrow-label style and keep the light palette aligned with the classic JRHOF/CHSBUA nonprofit archive feel. Preserve the classic header/footer structure and avoid making the site feel like a SaaS or tech landing page.

## ADR-010: Separate originals from public media

Archive original event photography permanently in the organization-controlled Google Drive. Publish only approved optimized derivatives to R2. Git is not the originals archive or the long-term gallery delivery store.

## ADR-011: One Google measurement loader

Use Google Tag Manager container `GTM-WGDF4SBN` as the single loader for Google Analytics 4 (`G-VYQQ5E7ZHM`) and Google Ads (`AW-17438185594`). Cloudflare Zaraz must not load GA4, Google Ads, GTM, or another Google measurement tag. Do not add duplicate hardcoded Google tags. Cloudflare Web Analytics remains a separate dashboard-managed tool for baseline traffic/performance measurement. Microsoft Clarity, approved after review, loads through GTM (ADR-018; this replaces the earlier "never through GTM" rule).

## ADR-012: Workers Static Assets is the canonical target

The Cloudflare Worker `jrhof-webapp` under the JR and Associates account is the production target for `https://jrhof.org`. Use `main` as the production source branch, asset-only `dist/` delivery, and preview versions for non-production branches. Keep custom-domain and DNS state account-managed; their deliberate absence from `wrangler.jsonc` prevents routine repository deployments from changing domain routing.

## ADR-013: AdSense is not used

JRHOF does not use AdSense. Google Ad Grants and Google Ads documentation is separate and remains in scope. Remove and do not restore `public/ads.txt` or other AdSense artifacts unless JR and Associates, Inc. makes a new explicit decision.

## ADR-014: Eventbrite is a temporary bridge

*Superseded by ADR-019: Eventbrite is retired.*

Eventbrite is not the permanent registration architecture. Keep current approved external links only while they are needed for event continuity.

*The July 2026 plan for a custom Stripe Checkout, Worker and D1 registration system is superseded by ADR-017.*

## ADR-015: Hand-maintained data; migration generators retired

The Python generators for `src/data/inductees.json` and `public/_redirects` were retired in September 2026. Their migration inputs no longer reproduced the published data: regenerating would have reset 117 verified portraits and dropped hand-added redirects. Both files are now edited directly. `scripts/validate-foundation.mjs` guards the roster invariants, and the migration inputs, the retired Next.js source, and the historical audits remain available in Git history.

## ADR-016: The Stripe return counts as the donation conversion

*Superseded by ADR-019: donations and their conversion moved to Zeffy.*

Google Ad Grants requires valid conversion tracking that records meaningful conversions, and the site reported none: `donation_complete` had been reserved for a signature-verified server flow that was never built, and the thank-you page sent only an observational `donation_return`. Starting September 2026, the thank-you page emits `donation_complete` with the Checkout Session ID as `transaction_id` when `?cs=` holds a live session ID, deduplicated per browser session. Stripe substitutes that ID only after a successful payment. A forged visit would need a well-formed live session ID and would inflate a single conversion, which is acceptable for marketing measurement. Stripe remains the financial record, and the event carries no amount. Event registrations will use the same pattern with `registration_complete`. This supersedes the July 2026 "observational `donation_return` only" rule.

## ADR-017: Zeffy for event registration

On October 11, 2026 the board chose Zeffy for 2027 banquet registration and as the long-term ticketing platform, over the custom Stripe Checkout flow built on `feature/banquet-stripe-registration`. Board members can configure and run Zeffy themselves; it needs no server code, database, secrets or custom dashboards in this repository; and it charges JRHOF no platform or processing fees (buyers may add an optional contribution to Zeffy). The site embeds the Zeffy form on its own register page, which shows the form only when the event's registration status is `open`, and counts completions as `registration_complete` through `src/lib/zeffyTracking.ts` (no amount; see `docs/ANALYTICS.md`). Golf moves from Eventbrite to Zeffy when its next tournament is set up. The Stripe branch is kept only for reference.

## ADR-018: Microsoft Clarity loads through GTM

From October 2026, Clarity (`v8l2xfpqpy`) loads only through Google Tag Manager `GTM-WGDF4SBN`, on Initialization – All Pages with the exception trigger "Guard | Non-prod hostname", so it never runs on `workers.dev` previews or local hosts. The site no longer ships `src/components/Clarity.astro` or reads `PUBLIC_CLARITY_PROJECT_ID`. Reasons: every third-party measurement tag now lives in one place with one publish history and one hostname guard; Clarity can be paused or changed without a code deploy; and the old build-time variable silently dropped Clarity from any build made without it. The Clarity origins stay in the CSP because GTM injects the script into the page. Containers around Zeffy embeds carry `data-clarity-mask="true"`, and the project's masking mode stays Balanced or Strict. `scripts/audit-launch-readiness.mjs` and `scripts/test-clarity-via-gtm.mjs` fail if a hard-coded Clarity loader returns. This supersedes the Clarity sentence in ADR-011.
## ADR-019: Zeffy for donations; Stripe and Eventbrite retired

In October 2026 donations moved from Stripe Payment Links to the Zeffy donation form `help-preserve-colorados-umpiring-legacy`, embedded on `/donate/` with `ZeffyEmbed`. Reasons: one platform for gifts, tickets and donor records that board members run themselves; no platform or processing fees for JRHOF (donors may add an optional contribution to Zeffy, which they can set to $0); and a conversion the site can actually count. The Stripe `?cs=` return never fired because the links were never configured with `{CHECKOUT_SESSION_ID}`; the embed's thank-you message now drives `donation_complete` through `src/lib/zeffyTracking.ts` (no amount, `_test` names off jrhof.org). The page never links out to zeffy.com, because Google Ad Grants requires ads to land on the nonprofit's own domain and only gifts inside the embed can be counted. The page keeps its own indexable copy, since the iframe isn't indexed.

Retired with this change: every Stripe Payment Link on the site (donations, golf raffle, golf mulligans), `stripeLinks`, `withDonationUtm`, the Stripe `client_reference_id` rewriter, the `?cs=` / `donation_complete` logic and the `/donate/thank-you/` and `/donate/return/` pages (both now redirect to `/donate/`), the Eventbrite golf registration link and its validation exception, and the Stripe and Eventbrite origins in the CSP. Past golf pages say the tournament has ended and offer nothing to buy; golf registration returns on Zeffy with the next tournament. Validation fails on any `stripe.com` or `eventbrite.com` URL. Existing monthly gifts that began on Stripe are not cancelled; the owner decides whether to leave them there or invite donors to move. This supersedes ADR-014 and ADR-016.
