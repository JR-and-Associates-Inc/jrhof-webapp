# JRHOF Repository and Migration Audit

**Repository:** `JR-and-Associates-Inc/jrhof-webapp`  
**Audit date:** June 19, 2026 (America/Denver)  
**Production source of truth:** [jrhof.org](https://jrhof.org) WordPress site  
**Scope:** Read-only application, content, payment, analytics, SEO, security, and deployment assessment. No production behavior was changed.

## Executive summary

The repository is a buildable but incomplete legacy Next.js 15 static-export application. Its strongest asset is the inductee archive: 150 structured records, 150 routed Markdown files, a searchable archive, static biography generation, and 121 usable portraits. Its weakest areas are the transactional system and release engineering: only a partial 2025 golf checkout exists, banquet registration and donations are absent, sponsor packages are not modeled, payment persistence depends on external Azure Functions that are not in this repository, analytics claims in the README do not match the code, deployment configuration is missing, and the dependency lockfile currently reports 48 security advisories.

The current WordPress site is ahead of the repository in several important ways. It has 159 published pages, four event posts, 150 inductee biography pages, newer content, working Stripe Payment Links for one-time and monthly donations, and current 2026 golf content. It still sends primary event registration to Eventbrite, so neither system satisfies the target native-registration requirement.

Recommendation: **selectively rebuild as a hybrid Astro + serverless application**, reusing the verified content, images, visual patterns, and route knowledge from this repository while replacing the payment/registration backend and stale page shell. Astro is a better fit for the mostly static archive and campaign landing pages. Use narrowly scoped server endpoints (preferably Cloudflare Workers with D1) for Stripe Checkout session creation, signed webhooks, registration records, exports, and contact handling. This is a selective rebuild, not a line-by-line port.

Do not cut over until the WordPress content has been exported and reconciled, all legacy URLs have a redirect plan, both event forms have passed end-to-end payment/webhook testing, and conversion tracking has been validated.

### Readiness at a glance

| Area | Status | Disposition |
|---|---|---|
| Static build | Builds successfully | Reusable as evidence, not release-ready |
| Inductee data and Markdown | Strong base with quality gaps | Reuse after reconciliation and validation |
| Inductee portraits | 121/150 exact matches | Reconcile from WordPress/media archive |
| Event pages | Mostly static and stale | Rebuild from structured event data |
| Native banquet registration | Missing | Build |
| Native golf registration | Partial proof of concept | Replace |
| Stripe Checkout | Partial client flow; external backend | Redesign and verify end to end |
| Donations | Placeholder in repo | Rebuild; WordPress Payment Links are interim reference |
| Sponsor packages | Missing | Build |
| Registration storage | External/undocumented here | Replace with D1 plus export workflow |
| Analytics | Clarity only | Add consent-aware GTM/GA4 and conversion events |
| SEO | Basic global metadata and generated sitemap | Rebuild metadata, redirects, schema, and landing pages |
| Deployment | Static-export intent, no deploy config | Replace/document |
| Security | Not release-ready | Dependency and transactional remediation required |

## Audit method and verification

- Inspected repository structure, source, data, static assets, scripts, lockfile, recent Git history, and configuration.
- Quantified JSON, Markdown, portrait, route, and sitemap coverage with local scripts.
- Installed the locked dependencies in a temporary checkout and ran `npm run lint`, `npm run build`, and `npm audit`.
- Queried the public WordPress REST API and production markup on June 19, 2026 to compare current routes and key donation/event content.
- Did not inspect the separate Azure Function repositories, Stripe Dashboard, Azure configuration, Cloudflare account data, GTM container, GA4 property, or nonprofit spreadsheets. Claims about those systems remain unverified.

Verification results:

- `npm run lint`: passes with five `no-img-element` warnings.
- `npm run build`: succeeds and exports 174 pages (22 fixed pages, the framework 404, and 150 biography paths). The build logs `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` as `undefined`, so build success does not prove checkout readiness.
- `npm audit`: 48 advisories: 3 low, 8 moderate, 36 high, and 1 critical. Directly affected packages include `next` (critical), `xlsx`, `pdfjs-dist`, both React PDF Viewer packages, `next-pwa`, and `@azure/functions`.
- No tests or CI workflow were found.

## Current architecture

### Application model

- Next.js App Router, Next `15.3.3` from the lockfile, React `19.1.0`, TypeScript, and Tailwind CSS 4.
- `next.config.ts` sets `output: 'export'`, `trailingSlash: true`, and unoptimized Next images. The output is a fully static site.
- The root layout is marked `"use client"` and manually writes global `<head>` tags. This limits normal App Router server metadata patterns and causes every route without explicit metadata to inherit generic SEO.
- Biographies are statically generated from `src/data/inductees.json`; Markdown is loaded from the filesystem during build.
- Search and slideshow behavior run in the browser.
- No application API routes are present. Contact and checkout call external hosts.

### Dependencies

Clearly used dependencies include Next/React, Tailwind, `gray-matter`, `react-markdown`, `remark-gfm`, Stripe.js, Clarity, `xlsx`, and the lightbox package.

The following appear unused in application source or are remnants that should not be carried forward without a demonstrated need: `@azure/functions`, server-side `stripe`, both React PDF Viewer packages, `react-pdf`, `pdfjs-dist`, `cookieconsent`, `next-pwa`, `rehype-raw`, and `worker-loader`. Several of these account for a large part of the vulnerability tree.

### Scripts and source generation

- `scripts/generateInducteesJson.js` treats `src/data/All_Inductees.xlsx` as an upstream source and rewrites `inductees.json`.
- `scripts/generateInducteesMarkdown.js` and existing Markdown introduce a second content source.
- `scripts/generateParsedInductees.js` produces a third, committed derived source (`parsedInductees.json`) for the slideshow.
- The parsed-data generator lowercases slugs before opening capitalized Markdown filenames. This is unsafe on Linux/case-sensitive filesystems.
- There is no runtime schema validation or build-time content integrity check.
- `generate:parsed` invokes `ts-node` on a JavaScript file.

The next implementation should establish one canonical content model and deterministically generate all derived output.

## Route inventory

The repository contains 23 page modules: 22 fixed routes and one dynamic route producing 150 biography pages.

### Fixed routes

| Route | Assessment |
|---|---|
| `/` | Stale 2026 banquet promotion; reusable layout/content concepts |
| `/404` | Incorrect App Router pattern; should be `not-found.tsx`; links to nonexistent `/programs` |
| `/about` | Reusable after WordPress reconciliation |
| `/contact` | UI reusable; external endpoint/security behavior needs verification |
| `/donate` | Placeholder only |
| `/events` | Hand-maintained archive; reusable content references |
| `/inductee-slideshow` | Reusable concept; oversized client payload and stale derived data |
| `/inductees` | Reusable search/archive concept |
| `/privacy` | Reconcile with current production policy and actual vendors |
| `/register` | Partial 2025 golf proof of concept; replace |
| `/success` | Stale 2025 confirmation; trusts a query parameter rather than verified payment state |
| `/terms` | Reconcile with production and new payment/data handling |
| `/thanks` | Reusable contact confirmation concept |
| `/events/2010/hof-banquet` | Historical static page |
| `/events/2023/hof-banquet` | Historical static page |
| `/events/2024/golf-tournament` | Historical static page; copy-forward component naming debt |
| `/events/2024/hof-banquet` | Historical static page |
| `/events/2025/golf-tournament` | Historical static page |
| `/events/2025/golf-tournament/signup` | Hard-coded Stripe test Buy Button; stale |
| `/events/2025/hof-banquet` | Historical static page |
| `/events/2026/golf-tournament` | Incorrect/stale date, venue, address, price, and Eventbrite URL compared with production |
| `/events/2026/hof-banquet` | Past event still offering Eventbrite registration |

### Dynamic route

- `src/app/[bio]/page.tsx` emits 150 top-level routes such as `/Joe_Bellich/`.
- `dynamicParams = false` means only JSON-listed routes are valid.
- All 150 JSON entries currently have a corresponding exact-case Markdown file.
- Top-level biographies risk collisions with future campaign or organizational pages.
- Production WordPress normally uses `/inductees/{slug}/`; one production outlier, `gene_rozelle`, is at the root.

The migration should adopt normalized lowercase hyphenated slugs under `/inductees/` and preserve every repository and WordPress URL through explicit 301 redirects.

## Content inventory

| Content type | Repository count/condition |
|---|---|
| Inductee JSON records | 150 |
| Parsed slideshow records | 150; committed derived data |
| Routed Markdown biographies | 150 |
| Extra/orphan Markdown files | 5 |
| Portrait files referenced successfully | 121 |
| Referenced portraits missing | 29 |
| Placeholder portrait files | 2 |
| Event data JSON files | 2024 and 2025 golf only |
| Event page modules | 10 event-detail/signup modules plus index |
| Spreadsheet source | `All_Inductees.xlsx` |
| Public sitemap artifacts | Generated but committed/stale before audit build |
| Public event assets | Limited; many pages depend on `cdn.jrhof.org` |

The five unreferenced Markdown files are `Boody.md`, `Borgmann.md`, `Burns.md`, `Butler.md`, and `Dick_Reininger.md`. Several duplicate routed biographies; at least one has incorrect frontmatter. They should be reconciled, not blindly imported.

## Inductee archive assessment

### What is strong and reusable

- Exactly 150 unique records, names, and route identifiers.
- Every record has `Name`, `Year`, `Image`, and `Bio URL` fields.
- Every routed record has a Markdown file.
- Search, reverse-year sorting, static generation, portrait fallback, and biography rendering are solid prototypes.
- The archive already spans 1987–2026 plus a `Pre 1990` group.

### Data and content issues

- `Year` is numeric for 121 records and the string `"Pre 1990"` for 29, while the TypeScript interface declares only `number`. Consumers bypass this with unsafe casts.
- 29 referenced portrait files are missing. Two orphan files strongly indicate naming errors: `Sam_Corsentino.jpg` vs. JSON `Sam_Corentino.jpg`, and `Mike_Kronkright.jpg` vs. JSON `David_Kronkright.jpg`.
- 28 biographies have no substantive body content; 31 have fewer than 50 body words. The 2026 biographies are placeholders.
- Names/slugs contain likely archival spelling or normalization issues (for example `Manual Boody`, `Sam Corentino`, and `Pete DAmato`). These must be checked against WordPress and original records rather than automatically “fixed.”
- No stable internal ID, aliases, source provenance, excerpt, alt text, updated date, or SEO fields exist.
- `parsedInductees.json` duplicates all biography content and creates drift and a roughly 112 KB route bundle for the slideshow.

### WordPress comparison

Production exposes 150 inductee detail pages. Repo and WordPress counts align, but three slug aliases differ:

- Repo `Dave_Chick_Baker` vs. WordPress `dave_baker`
- Repo `Sam_Corentino` vs. WordPress `sam_corsentino`
- Repo `Richard_Dick_Reininger` vs. WordPress `richard_reininger`

Production also displays `Steve Usecheck Jr.` while the repo record says `Steve Usecheck`. Production content and media were modified into February 2026, after the last repository commit (November 2025), so the WordPress export must win conflicts unless the nonprofit approves an override.

### Required migration model

Create one validated record per inductee with:

- stable ID;
- canonical display name;
- normalized slug;
- induction year or explicit era label;
- portrait plus alt text and credit/source;
- Markdown/MDX biography;
- excerpt/meta description;
- legacy URL aliases from both systems;
- source and last-reviewed dates;
- status such as complete, placeholder, or needs review.

Add build checks for duplicate IDs/slugs, missing images, filename case, empty bios, broken aliases, and sitemap coverage.

## Event-registration assessment

### Current repository behavior

The only custom form is `/register`, a golf form with one-to-four golfer names/emails, contact email, raffle quantity, and comments. It sends client-selected Stripe Price IDs and quantities to an external Azure Function, then sends a separate `logregistration` request before redirecting to Checkout.

This is a proof of concept, not a production registration system:

- It is generic and not tied to a versioned event record.
- It supports golf only; no banquet-specific form exists.
- Required golfer data is not actually validated.
- There is no sponsor package selection, company information, player/team assignment workflow, dietary/accessibility fields, guest fields, or configurable questions.
- Registration is logged before payment completes, creating unpaid/abandoned records unless external reconciliation is perfect.
- No webhook code, registration schema, admin view, export, resend/lookup flow, capacity control, refund/cancellation handling, or idempotency logic is in this repository.
- Success copy is hard-coded to June 28, 2025.

The 2026 banquet and golf pages still link to Eventbrite. The 2025 signup page injects a Stripe Buy Button with a hard-coded test-mode publishable key and is not a substitute for custom registration.

### Target form requirements

Model banquet and golf as separate form definitions sharing common infrastructure:

- **Banquet:** purchaser, attendee count, attendee names, honoree relationship/affiliation, meal or dietary needs if applicable, seating requests, accessibility needs, sponsor/table package, consent, and optional donation.
- **Golf:** purchaser, individual/foursome package, golfer names/emails, team request, handicap or event-specific questions if needed, sponsorship package, add-ons such as raffle/mulligans, consent, and optional donation.

Questions and sellable packages should be versioned by event year. Prices must be resolved server-side from approved package IDs; never trust arbitrary client price/amount input.

### Recommended registration lifecycle

1. Validate and normalize the event-specific form server-side.
2. Create a `pending` registration with a random public reference and no payment claim.
3. Resolve Stripe Price IDs server-side from event/package configuration.
4. Create Checkout with the registration ID in Stripe metadata and an idempotency key.
5. Mark the registration paid only from a verified `checkout.session.completed` webhook.
6. Handle delayed payment, expiration, refund, and dispute events.
7. Show confirmation from server-verified registration state, not a query parameter alone.
8. Send receipts/notifications and expose CSV/Google Sheets export.

## Stripe and payment assessment

### Existing integration

- `@stripe/stripe-js` initializes from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Golf and raffle Price IDs come from public environment variables.
- Checkout creation and registration logging call `https://jrhof-stripe-api.azurewebsites.net/api/...`.
- The README says three separate Azure Function repositories create Checkout sessions, log to Excel/Graph, and process webhooks. None is present or verifiable here.
- A legacy route uses a hard-coded Stripe test Buy Button.
- The donation route contains only “Later we'll embed `<DonationForm />`.”

### Production WordPress behavior

As of the audit, WordPress uses Stripe-hosted Payment Links for one-time and monthly donations. The 2026 golf post uses Eventbrite for primary registration and separate Stripe links for add-ons such as raffle tickets and mulligans. This is operationally useful evidence but fragments attendee and payment records.

### Required replacement

- One server-owned Stripe integration for event checkout, sponsorships, and donations.
- Separate test/live configuration with documented environment variables.
- Signed webhook verification using the raw request body.
- Idempotent event processing and auditable payment-state transitions.
- Server-side allowlist for events, packages, prices, quantities, deadlines, and capacities.
- Stripe Customer/receipt email handling only where necessary; minimize stored card-adjacent data.
- Donation Checkout supporting one-time and recurring modes, campaign attribution, and clear tax-receipt language approved by the nonprofit.
- Sponsor package products with fulfillment/contact details stored in registration records.
- Reconciliation tools comparing D1 registration/payment status with Stripe.

### Storage recommendation

Use **Cloudflare D1 as the system of record**, Stripe as the payment authority, and Google Sheets as a staff-facing export/sync target—not the transactional database.

Why:

- D1 supports relational records, unique constraints, idempotency, state transitions, event-year queries, and durable webhook processing.
- Sheets is familiar to nonprofit staff but weak for concurrent writes, integrity, secrets, webhook idempotency, and historical auditability.
- A scheduled/manual CSV export or limited service-account sync provides usability without making Sheets the critical path.

Minimum tables should cover `events`, `packages`, `registrations`, `attendees_or_golfers`, `registration_answers`, `payments`, `webhook_events`, and `export_runs`. Define retention and deletion policy before collecting personal data.

## WordPress migration considerations

WordPress must be exported immediately before content freeze and again at cutover. The repository is not current enough to be the migration source by itself.

### Production inventory observed

- 159 published pages.
- 4 event posts.
- 150 inductee detail pages (149 under `/inductees/` plus the `gene_rozelle` root-path outlier).
- Current donation page and thank-you page.
- Current golf/banquet posts and media newer than the repository.
- WordPress media URLs, block markup, comments, categories, user sitemap, and plugin-generated styling/tracking.

### Migration procedure

1. Export pages, posts, media metadata, menus, categories, redirects, SEO fields, and relevant forms/settings through WP-CLI or authenticated REST/export tooling.
2. Download original media, not thumbnail derivatives; calculate hashes and preserve credits/alt text.
3. Reconcile all 150 production inductees against JSON, Markdown, spreadsheet, and image files.
4. Convert Gutenberg/plugin markup into clean structured content rather than carrying rendered Stackable CSS into the new site.
5. Build a URL manifest from WordPress sitemap, repository sitemap, and analytics/Search Console landing pages.
6. Preserve or redirect every indexed biography and event URL. Include case, underscore, trailing-slash, and known alias variants.
7. Freeze editorial changes, run a delta export, verify content counts/hashes, then cut over.
8. Retain a private WordPress backup and media archive after launch.

Comments appear enabled on the current golf post. Decide whether they are intentional; otherwise do not migrate them and disable comments before/at cutover.

## Security concerns

### High priority

- The locked dependency tree reports 48 advisories, including a critical advisory on the pinned Next.js version and high advisories involving `xlsx`, PDF tooling, and PWA dependencies. Remove unused packages, upgrade direct dependencies, and re-audit before any deployment.
- Checkout trusts client-provided Price IDs/quantities unless the external Function rejects them. The server must map approved packages to prices and enforce bounds.
- Registration logging occurs before confirmed payment and separately from Checkout/webhook state, inviting inconsistent or spoofed records.
- External Azure Functions, CORS rules, secret storage, webhook verification, authentication, rate limiting, logging, and spreadsheet permissions are outside this repository and unverified.
- Contact and registration endpoints have no visible CAPTCHA/Turnstile, abuse controls, or rate-limit contract.
- No content security policy or deployment security headers are configured.

### Medium priority

- Browser console logging includes the publishable key, checkout payload metadata, and response objects. A publishable key is not secret, but customer data and verbose production logs should be removed.
- The 2025 Buy Button uses an embedded test key and stale test product.
- The success route treats the presence of `payment_id` as success; confirmation must be server-verified.
- Personal data retention, staff access, export permissions, breach response, and deletion are not defined.
- Privacy text mentions Google Analytics and AdSense while the code does not implement them and the future design adds Stripe/D1/Sheets. Policies must match actual processing.
- No Dependabot/Renovate, secret scanning configuration, tests, CI gates, or deployment review workflow is committed.
- The service worker is unregistered/stale and caches incorrect root-level asset paths; remove it unless an offline strategy is intentionally designed.

Do not store card details. Store only Stripe identifiers, payment status, amounts/currency, necessary purchaser/attendee data, consent timestamps, and operational notes.

## Analytics, SEO, and Google Ad Grants readiness

### Current analytics

- Repository code initializes Microsoft Clarity in production with a hard-coded project ID.
- No GTM container, GA4 tag, Google Ads conversion tag, data layer, consent banner implementation, or event taxonomy was found despite README claims.
- Production WordPress includes Google Tag Manager/Google tag markup and a different Clarity project ID than the repository, indicating configuration drift that must be resolved with account owners.

### Current SEO

- Global title, description, OG URL, and social image are manually fixed in the root layout.
- Inductee pages have no route-specific metadata, canonical, social portrait, or Person/profile structured data.
- The 2026 golf page uses `next/head` inside App Router and contains stale/incorrect SportsEvent schema (June 14, Littleton, placeholder street address, $150) compared with production (June 27, Applewood, $130 at audit time).
- Before the audit build regenerated it, the committed sitemap was timestamped July 2025 and omitted the three 2026 inductee paths.
- Robots configuration is basic and points to the sitemap.
- No redirect manifest, Search Console migration plan, campaign landing-page framework, or conversion definitions exist.

### Google Ad Grants requirements for this project

Build focused, content-rich landing pages around real nonprofit intent rather than sending paid traffic to the homepage. Candidate funnels include:

- support/preserve Colorado baseball umpire history → donation;
- Hall of Fame banquet attendance/table sponsorship → banquet registration;
- charity golf tournament/foursome/sponsorship → golf registration;
- corporate/community sponsorship → sponsor package inquiry or Checkout;
- Colorado umpire history/inductee archive → archive engagement, then a relevant support CTA.

Each landing page needs one primary conversion, clear nonprofit identity, useful original content, trust/tax information, mobile performance, accessible forms, privacy links, and campaign-specific copy.

Recommended event taxonomy:

- `view_inductee`, `search_inductees`
- `view_event`, `select_event_package`
- `begin_registration`, `registration_validation_error`
- `begin_checkout`
- `purchase` / `event_registration_complete` only after verified payment
- `donation_begin`, `donation_complete`
- `sponsor_lead` or `sponsor_purchase`
- `contact_submit`

Pass campaign attribution (`utm_*`, `gclid` where permitted/needed) into the registration record and Stripe metadata in a privacy-conscious way. Import final conversions to Google Ads through GA4 or a direct Google Ads tag, deduplicate by transaction/registration ID, exclude staff/test transactions, and validate with Tag Assistant and test orders. Consent behavior should be designed for the actual jurisdictions and tools in use.

### SEO migration requirements

- Per-page titles, descriptions, canonical URLs, OG/Twitter cards, and structured data.
- `Organization`/`NonprofitOrganization`, `Event`, `Person` or appropriate profile, `BreadcrumbList`, and donation-page schema where valid; never publish placeholder event facts.
- Generated sitemap indexes containing only canonical 200-status pages.
- Complete 301 redirect map and post-launch 404 monitoring.
- Search Console ownership, sitemap submission, change monitoring, and preservation of top landing-page content.
- Do not index Checkout/session URLs, internal confirmations containing identifiers, or duplicate campaign variants.

## Deployment assessment

### Azure assumptions in the repository

The README says Azure Static Web Apps hosts the frontend and three separate Azure Function repositories handle Stripe Checkout, Excel/Graph logging, and webhooks. The frontend directly calls `jrhof-stripe-api.azurewebsites.net` and `api.jrhof.org`.

Missing from this repository:

- Azure Static Web Apps configuration;
- GitHub Actions or other CI/CD workflow;
- Functions source or API contract;
- redirect/rewrite configuration;
- security headers/CSP;
- environment variable example (although README instructs copying one);
- staging/preview strategy;
- monitoring and rollback documentation.

The static export itself can be hosted cheaply almost anywhere, but the current cross-repository Azure architecture is not self-documenting or low-maintenance.

### Recommended hosting shape

- Astro static site on Cloudflare Pages (or Workers static assets).
- Cloudflare Worker routes for contact, Checkout creation, registration lookup, Stripe webhooks, and protected exports.
- D1 for registrations and webhook state.
- Stripe Checkout/Customer Portal where appropriate.
- Optional Google Sheets export/sync and email provider integration.
- Cloudflare Turnstile and rate limiting for public forms.
- Preview deployments plus a small CI pipeline running content validation, type checks, lint, unit tests, build, link checks, and dependency audit policy.

This consolidates frontend and small backend operations without turning the content site into a continuously running application server.

## Recommendation: selective hybrid rebuild with Astro

### Why not keep the current Next.js app unchanged

It can statically build, but substantial work is still required to modernize dependencies, remove dead packages, rebuild metadata, replace client layout behavior, normalize routes, create transactional APIs, add CI/deployment configuration, reconcile WordPress, and repair content. Keeping it unchanged does not reduce the difficult work.

### Why Astro is the preferred frontend

- The dominant workload is static content: 150+ biographies, event archives, organizational pages, and campaign landing pages.
- Astro defaults to low client JavaScript while still supporting interactive islands for search, registration forms, galleries, and countdowns.
- Content collections and schemas are a natural fit for validated inductee/event data.
- Static output is easy to host and cache with low operational overhead.
- Server endpoints can remain narrowly scoped instead of forcing the whole site into a server-rendered runtime.

### Why this is a hybrid rebuild rather than a pure port

Reuse:

- verified biography text and portrait assets;
- archive/search/slideshow concepts;
- event history and gallery references;
- general visual identity, mission copy, and navigation concepts;
- known Stripe products/Price IDs only after dashboard reconciliation;
- legacy URL knowledge.

Replace:

- page shell and metadata architecture;
- generated/duplicated content pipeline;
- event page copy-forward modules;
- registration, payment-state, and persistence implementation;
- Azure cross-repository assumptions unless there is a compelling operational reason to retain them;
- analytics/consent and deployment configuration.

Keeping Next.js is still viable if the team strongly prefers React/Next and already operates the Azure Functions well, but it offers little advantage for this mostly static site. A full “from nothing” rewrite is unnecessary because the content corpus and several interaction patterns are worth preserving.

## Phased implementation plan

### Phase 0 — Ownership and system discovery

- Identify owners/admin access for WordPress, domain/DNS, Cloudflare, Azure, Stripe, Eventbrite, GTM, GA4, Google Ads/Ad Grants, Search Console, Clarity, email, and Google Workspace.
- Inspect the three Azure Function repositories and live API configuration.
- Inventory Stripe products/prices, webhooks, Payment Links, tax behavior, refunds, and live/test accounts.
- Agree on event questions, sponsor packages, capacities, refund policy, tax wording, data retention, and staff workflow.

**Exit:** documented systems, owners, credentials plan, requirements, and source-of-truth decisions.

### Phase 1 — Content export and canonical model

- Export WordPress pages/posts/media/SEO/URLs.
- Reconcile all 150 inductees and the spreadsheet/Markdown/images.
- Resolve 29 portrait gaps, 28 empty bios, aliases, spelling questions, and five orphan Markdown files.
- Create validated Astro content collections and a legacy redirect manifest.

**Exit:** zero unexplained record mismatches, deterministic build, approved content report.

### Phase 2 — Static site foundation

- Build Astro layouts, navigation, footer, archive, biography pages, event archive, legal pages, contact, and accessible responsive components.
- Add per-route metadata, schema, sitemap, robots, image optimization, and 404 handling.
- Add CI, previews, link/content validation, and dependency policy.

**Exit:** content-complete preview matching production routes and passing accessibility/performance/SEO checks.

### Phase 3 — Transactional backend

- Create D1 schema/migrations and Worker API contracts.
- Build separate versioned banquet and golf forms.
- Implement server-side package/price allowlists, Checkout, signed idempotent webhooks, status transitions, confirmation, email, refunds/cancellations, and capacity behavior.
- Build sponsor packages and one-time/recurring donation flows.
- Add protected CSV export and optional Sheets sync.

**Exit:** successful test-mode end-to-end matrix including abandonment, retries, duplicate webhooks, refunds, and export reconciliation.

### Phase 4 — Analytics and Ad Grants

- Define GTM/GA4/Google Ads ownership and consent implementation.
- Implement data-layer events and verified conversion deduplication.
- Build campaign landing pages and attribution capture.
- Test all tags and exclude staff/test traffic.

**Exit:** recorded test conversions from landing page through paid webhook confirmation.

### Phase 5 — Cutover

- Freeze WordPress editing and perform delta export.
- Re-run URL/content/media reconciliation and full regression tests.
- Configure redirects, DNS, CSP/security headers, monitoring, backups, alerts, and rollback.
- Submit sitemap and monitor Search Console, analytics, Stripe/webhooks, forms, and 404s daily during launch.

**Exit:** stable production, reconciled transactions, no critical route loss, rollback window complete.

### Phase 6 — Operations

- Document annual event rollover, package/price setup, content editing, exports, refunds, and incident response.
- Schedule dependency updates, restore tests, Stripe reconciliation, data-retention cleanup, conversion audits, and broken-link checks.

## Open questions

### Content and governance

1. Who has final authority when WordPress, spreadsheet, Markdown, and historical programs disagree?
2. Are all 150 biographies and portraits cleared for republication, and are credits required?
3. Should incomplete biographies be published with a label, hidden, or completed before launch?
4. Should the slideshow remain public, and is it intended for unattended banquet display?
5. Which historical event galleries/program PDFs must migrate?

### Events and sponsorships

6. What exact questions, package types, prices, deadlines, capacities, and refund rules apply to each event?
7. Can banquet registrations include tables/guests and golf registrations include individuals/foursomes?
8. Which sponsor benefits require logos, URLs, ad artwork, signage, attendee names, or fulfillment tracking?
9. Are raffle/mulligan sales legally and operationally approved for online purchase in the intended context?
10. Who edits annual event configuration and handles attendee changes/refunds?

### Payments and records

11. Which Stripe account is authoritative, and who controls live/test access and webhook secrets?
12. Are the external Azure Functions currently live, monitored, and documented? Where are their repositories?
13. Is D1 acceptable as the official registration record, with Sheets as an export, or is direct Sheets sync mandatory?
14. What data must be retained, for how long, and who may access/export it?
15. Which email service should send confirmations and staff notifications?

### Analytics and operations

16. Which GTM, GA4, Google Ads, Search Console, and Clarity properties are authoritative? The repo and WordPress use different Clarity IDs.
17. Is the organization already approved for Google Ad Grants, and which conversions/campaigns are active?
18. Is Cloudflare Pages/Workers/D1 preferred, or must existing Azure investment be retained?
19. Who owns DNS/CDN media at `cdn.jrhof.org`, and should those assets be consolidated?
20. What launch date and event deadline constrain the migration?

## Files most important for the next phase

### Content and archive

- `src/data/inductees.json` — route/data index; 150 records.
- `src/data/All_Inductees.xlsx` — possible upstream source; must be reconciled with WordPress.
- `src/content/inductees/*.md` — biography corpus, including incomplete and orphan files.
- `public/images/inductees/*` — portrait corpus with 29 missing references.
- `src/app/[bio]/page.tsx` — static biography generation and rendering.
- `src/app/inductees/page.tsx` — archive/search behavior.
- `src/app/inductee-slideshow/page.tsx` and `src/data/parsedInductees.json` — slideshow and duplicated content.
- `scripts/generateInducteesJson.js`, `scripts/generateInducteesMarkdown.js`, and `scripts/generateParsedInductees.js` — competing generation paths.

### Events, payments, and APIs

- `src/app/register/page.tsx` — partial golf/Stripe flow and external API calls.
- `src/app/events/2025/golf-tournament/signup/page.tsx` — hard-coded test Buy Button.
- `src/app/events/2026/golf-tournament/page.tsx` — stale event content and schema.
- `src/app/events/2026/hof-banquet/page.tsx` — Eventbrite banquet flow.
- `src/app/donate/page.tsx` — donation placeholder.
- `src/app/success/page.tsx` — unverified/stale confirmation behavior.
- `src/app/contact/page.tsx` — external contact API dependency.
- `src/data/golf_tournament_2024.json` and `src/data/golf_tournament_2025.json` — early structured event data.

### Platform, SEO, and deployment

- `package.json` and `package-lock.json` — framework/tooling choices and vulnerability surface.
- `next.config.ts` — static export assumptions.
- `src/app/layout.tsx` — global client layout, metadata, and Clarity placement.
- `src/components/Clarity.tsx` — only implemented analytics integration.
- `next-sitemap.config.js`, `public/sitemap.xml`, `public/sitemap-0.xml`, and `public/robots.txt` — SEO generation/artifacts.
- `README.md` — claims about Azure, GTM, checkout, webhooks, and donation flows that need verification.
- `public/service-worker.js` — stale PWA remnant.

## Final decision

Proceed with an **Astro-based selective hybrid rebuild**, using WordPress as the current content authority and the legacy repository as a valuable migration source—not as production-ready application code. Preserve the archive and historical routes; replace transactional, analytics, deployment, and content-generation foundations. Keep WordPress live until the new registration/payment lifecycle, redirects, content parity, and conversion tracking are independently verified.
