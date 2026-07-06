# Changelog

This file is historical release context. It is not a control document.

## 2026-07-06 — Ad Grants bid-strategy fix (account-side)

### Changed

- Found all three live Grants campaigns (`Grants | Donations`, `Grants | Brand & Archive`, `Grants | Banquet & Community`) on **Maximize Conversions (Target CPA ~$4.19)** and **delivering 0 impressions / $0.00 since the Jul-4 launch** — the conversion-starved stall the runbooks warned about (new campaigns have no conversion history, so conversion Smart Bidding never bids). The grant was spending nothing.
- **Switched all three to Maximize Clicks with a $2.00 max-CPC cap** to unblock delivery and actually use the grant (and start building the conversion data needed to later graduate to conversion bidding). For this niche, low-search-volume account the binding constraint is delivery, not the $2 CPC ceiling, so Max Clicks is the correct "max it out" move; budgets left as-is. Demotion-ladder plan unchanged: move Donations to Maximize Conversions after ~30 days of real conversions. Detail in `docs/audits/JRHOF_EXECUTION_LOG_2026-07-05_ADS_KEYWORD_REVIEW.md` §F-bis.

## 2026-07-06 — Ad Grants cleanup: negatives, geo, obsolete-campaign removal (account-side)

### Changed

- Loosened the over-aggressive shared negative list: **removed 8 education/rules terms** (`training`, `certification`, `clinic`, `exam`, `referee training`, `umpire school`, `rules`, `rulebook`) from `Shared | Negatives | Core` (now 42 terms) so JRHOF's future CHSBUA/CHSAA umpire-education/clinic intent isn't blocked account-wide. Re-added the same 8 as **campaign-level** negatives on `Grants | Donations` and `Grants | Banquet & Community` only (kept `Grants | Brand & Archive` open).
- **Made `Grants | Donations` nationwide** (Colorado → United States) — donation intent is national. Confirmed `Grants | Brand & Archive` = United States and left `Grants | Banquet & Community` = Colorado (local event).
- **Removed 2 obsolete paused pre-rebuild campaigns** after checking lifetime stats: `JRHOF – Awareness – Search – Website Traffic` (0 lifetime conversions) and `Donations – JRHOF` (never served). **Kept `Evergreen - Awareness` paused** because it holds the account's entire conversion history (70 lifetime conversions / $258 spend) — removing it would destroy compliance/conversion evidence. **Deleted the 6 paused junk keywords** in Banquet (NASCAR / Indiana basketball / Springfield / generic "hall of fame banquet" broad+phrase / "sports hall of fame event").
- **Created the `Inductees - Umpire History` ad group** in `Grants | Brand & Archive`, now **complete**: **10 phrase/exact inductee/umpire-history keywords + 1 responsive search ad** (12 headlines / 4 descriptions, ad strength "Good", lands on `/inductees/`, RSA Pending review). The ad save required TJ to manually clear Google's "Confirm it's you" identity gate (the automated browser is hard-blocked from confirming identity — "Blocked during authentication"); once TJ cleared it, the ad saved. Brand & Archive now has 2 ad groups; campaign total 22 keywords.
- No conversion tracking, GA4 key events, GTM, bidding, or ad copy on existing ads were changed. Cancelled account 567-662-7574 untouched. Full session log appended to `docs/audits/JRHOF_EXECUTION_LOG_2026-07-05_ADS_KEYWORD_REVIEW.md`.

## 2026-07-05 — Ad Grants keyword & negative review (account-side)

### Changed

- Reviewed the live Ad Grants keyword architecture and made the safe corrections directly in Google Ads account `850-823-3621`. Found the `Grants | Banquet & Community` ad group polluted with generic-broad and other-hall-of-fame junk (the launch log had recorded these as phrase terms, but they were live as broad match). **Paused 6 poor-fit Banquet keywords** (`hall of fame banquet` broad + phrase, `nascar hall of fame banquet`, `indiana basketball hall of fame banquet`, `springfield sports hall of fame banquet`, `"sports hall of fame event"`) — paused, not removed, so history is intact and reversible.
- **Renamed all three generic "Ad group 1" ad groups** to descriptive, tightly-themed names: `Brand - Joe Rossi Umpire HOF`, `Donate - Umpire History Nonprofit`, `Banquet - Umpire Recognition`.
- **Added 26 mission-relevant phrase/exact keywords** (no single-word, no generic broad): +7 to Brand (umpire-HOF research terms), +11 to Donations (baseball/sports-history nonprofit intent), +8 to Banquet (umpire/baseball awards & recognition intent). Declined Google's "change keywords to broad match" prompt on every add. Enabled keyword count went 19 → 39 (verified in-product).
- **Expanded the shared negative list `Shared | Negatives | Core` from 25 to 50 terms** (added gear/merchandise, rules/training/certification, other-sport and other-HOF, tourism/museum/ticketmaster, geographic `indiana`/`springfield`), still applied at Campaign level to all 3 active Grants campaigns. Deliberately excluded bare `game` (blocks "baseball game umpire") and bare `tickets` (blocks the JRHOF banquet's own valid intent); documented the reversal of the prior deliberate exclusion of `rules`/`training`/`certification` (no "become an umpire" keywords are live to protect).
- No conversion tracking, GA4 key events, GTM, bidding, budgets, geo, ad copy, or final URLs were changed. Landing pages verified live 200. No duplicate campaigns created; cancelled account 567-662-7574 untouched. Full session log: `docs/audits/JRHOF_EXECUTION_LOG_2026-07-05_ADS_KEYWORD_REVIEW.md`.

## 2026-07-04 — Ad Grants campaigns go live (account-side)

### Changed

- Took the Grants campaigns live via the campaign wizard (the 2026-07-03 bulk-Sheet upload had failed with "File not found" — never shared with the Ads service account, so nothing from the sheet ever reached the account). Now Enabled and learning: `Grants | Brand & Archive` ($145.90/day, US), `Grants | Donations` ($90/day, Colorado), and `Grants | Banquet & Community` ($30/day, Colorado, landing on the 2027 induction-banquet page). All Search-only, Maximize Clicks with a $2.00 CPC cap, AI Max off, account-default conversion goals (`donation_complete`/`form_submit`). Donations and Banquet each carry two responsive search ads.
- Paused the three legacy campaigns (`Evergreen - Awareness`, `Donations – JRHOF`, and a stray `JRHOF – Awareness – Search – Website Traffic`) now that replacements serve — paused, never deleted, so history is intact and reversible.
- Created the shared negative keyword list `Shared | Negatives | Core` (25 broad-match terms: job-seeker, gear/equipment, other-sport, and junk queries) and applied it to all three active Grants campaigns; deliberately left `training`/`certification`/`rules` out to avoid conflicting with the community "become an umpire" angle.
- Added account-level assets that serve on every campaign: six sitelinks (Donate, Meet the Inductees, Induction Banquet, Golf Tournament, About JRHOF, Contact Us) and five callouts (`501(c)(3) Nonprofit`, `Preserving Umpire History`, `Honoring Baseball Umpires`, `Community Supported`, `Colorado Umpire Legacy`).
- Remaining: build the seasonal `Grants | Golf | Seasonal 2026` campaign, add a second ad group per campaign (Grants ≥2 ad-groups best practice), correct Brand & Archive's budget to the planned $120/day, and ramp the Banquet budget toward January 2027. Full session log: `docs/audits/JRHOF_EXECUTION_LOG_2026-07-04_ADS_LAUNCH.md`.

## 2026-07-03 — Ad Grants campaign rebuild (account-side)

### Changed

- Verified the 2026-07-02 measurement reset held: GA4 key events are real outcomes only (`donation_complete` now receiving data), Google Ads Primary conversions are `purchase`/`donation_complete`/`form_submit`, page-view-class actions are Secondary and no longer accruing, GTM v8 taxonomy is live and emitting (single loader, one page_view per navigation, `ccm/collect` unblocked per the CSP fix), Zaraz is inert on live traffic, and Ad Grants enrollment is confirmed in-product.
- Authored the four-campaign Ad Grants rebuild (`Grants | Brand & Archive`, `Grants | Donations`, `Grants | Golf | Seasonal 2026`, `Grants | Banquet & Community` — 13 ad groups, 64 phrase/exact keywords, 26 responsive search ads, Maximize Clicks with a $2.00 CPC cap, verified jrhof.org landing pages) as the Google Sheet "JRHOF Grants Rebuild 2026-07-03", linked in the Ads bulk-upload panel, plus a saved campaign-wizard draft for Brand & Archive.
- Publication is blocked on two owner-only steps: Google's "Confirm it's you" identity re-verification, and sharing the build Sheet with the Ads bulk-upload service account. Legacy campaigns (0 impressions in 7 days) remain running until replacements serve; no campaigns, conversion actions, or history were deleted.
- Full session log and the owner completion checklist: `docs/audits/JRHOF_EXECUTION_LOG_2026-07-03_ADS_REBUILD.md`.

## 2026-07-02 — Repository handoff cleanup

### Added

- Added a concise maintainer handoff, license-authority review, evidence-backed cleanup report, and validation-only GitHub Actions workflow.
- Added expiration and policy metadata to `public/.well-known/security.txt` and expanded the private-reporting guidance in `SECURITY.md`.

### Changed

- Reconciled current documentation with the live Astro production deployment at `https://jrhof.org`, Cloudflare Workers Static Assets delivery, the GTM-only Google measurement rule, temporary Eventbrite status, and the future Stripe Checkout + Worker + D1 registration architecture.
- Updated active generator comments from Cloudflare Pages to Workers Static Assets and corrected the public privacy-policy description of GA4's loader from Zaraz to GTM.
- Pointed the brand-asset generator at the active social-card path and removed a duplicate TypeScript exclusion.
- Applied npm's nonbreaking transitive dependency remediation for the moderate nested-YAML advisory; the remaining low-severity Windows development-server finding is documented for the Astro 7 upgrade.
- Deferred all repository licensing decisions, replaced open-license claims with a neutral reservation to JR and Associates, Inc., and preserved the existing copyright notice.
- Recorded that JRHOF does not use AdSense and kept Google Ad Grants and Google Ads documentation separate.

### Removed

- Removed an unused Next.js ESLint config, an unregistered legacy service worker, and a byte-identical unused social image after documenting proof in the cleanup audit.
- Removed the obsolete public AdSense publisher artifact and the superseded open-license files.

## Unreleased — Astro Static Foundation Phase 1

### Added

- Added versioned, deterministic 2025 and 2026 golf-gallery pipelines and manifests; generated binaries remain ignored locally while 840 WebP derivatives are checksum-verified in R2 through `media.jrhof.org`.
- Added a deterministic tracked-inductee-media audit and separate R2 migration plan without uploading, rewriting, or deleting inductee portraits.
- Staged and checksum-verified the 2024 Umpires Cup II gallery in R2, added a deterministic media manifest/verification utility, and added a preview-only public-media URL resolver with a local fallback; production deployment and domain cutover remain intentionally deferred.
- Added the Cloudflare Workers Static Assets deployment decision, Workers Builds/rollback/domain-cutover runbook, and R2 media migration plan without attaching domains or changing gallery URLs.
- Added Layer 1 of the event archive system with `/events/archive/`, `/events/induction-banquet/`, and `/events/golf/`, plus shared archive navigation and event-record presentation.
- Expanded `src/data/events.ts` into a typed, lightweight archive model covering verified banquet and golf records for 2024–2027, conservative date confidence, archive-asset states, approved current-event links, and intentionally partial historical notes.
- Added a lightweight shared event data file for the 2026 Umpire’s Cup, 2026 banquet recap, scheduled 2027 banquet, approved external event links, and gallery migration states.
- Astro static application and Cloudflare Workers Static Assets-compatible build configuration.
- Reconciled 150-record inductee data model and generation script.
- Searchable archive and 150 biography routes.
- Static organizational, event, donation, sponsor, contact, and policy routes.
- Shared missing-portrait treatment, sitemap, redirect manifest, and validation script.
- Architecture, content-model, current-state, and next-phase documentation.
- Shared JSON-LD graphs for the organization, website, route-level web pages, breadcrumbs, and conservative inductee `Person` entities.

### Changed

- Refreshed the Donate page with clearer mission and preservation context, confirmed one-time and $20/month Stripe Payment Links, conditional banquet support, donation-question contact paths, and preserved analytics, accessibility, performance, and external-link security guardrails. Giving remains static Payment Links only; native Checkout, Workers, D1, webhooks, secrets, receipts, refunds, donor records, and tax-deductibility claims remain deferred and approval-gated.
- Hardened donation completion measurement: donation return pages are excluded from the sitemap, and Stripe returns carrying a Checkout Session ID emit one `donation_complete` dataLayer event per browser session.
- Attached the permanent `media.jrhof.org` origin to `jrhof-media-public`, retained `r2.dev` temporarily for preview review, and kept the website Worker and apex/`www` production routing unchanged.
- Reworked the 2024–2026 golf archive presentation with event context, responsive editorial gallery layouts, full-viewport uncropped lightboxes, accessible captions and controls, keyboard navigation, mobile tap/swipe support, focus restoration, scroll locking, and a supported Fullscreen API control.
- Restored true viewport-sized gallery lightboxes by moving the fixed viewer outside translucent page surfaces that otherwise constrained it to the gallery container.
- Simplified the fully prerendered Astro build to direct `dist/` output, removed the unnecessary Cloudflare server adapter, and made Worker name, compatibility date, preview URLs, `workers.dev`, trailing-slash, and custom-404 behavior explicit.
- Added event archive entry points to the Events hub and cross-links among the hub, archive pages, current 2026 golf page, and 2026 banquet recap.
- Recorded historical banquet programs and flyers as pending scan/upload without publishing document links, and recorded the 2024/2025 golf pages only as source galleries with migration planned.
- Aligned the Events hub and current event pages to JRHOF’s annual lifecycle: active golf registration, banquet save-the-date, completed banquet recap with photos pending, and past golf gallery-source links.
- Activated the approved Eventbrite registration and Stripe raffle, mulligan, and donation links for the imminent 2026 Umpire’s Cup while keeping registration and payments external.
- Converted the 2026 banquet route into a completed-event recap with Class of 2026 biography links, gallery-coming-soon language, sponsor/donor thanks, and no active registration messaging.
- Expanded shared SEO metadata with canonical, Open Graph, Twitter title/description/image, social-image alt text, and optional `noindex` support; the 404 route is now explicitly `noindex, follow`.
- Added route-appropriate `AboutPage`, `ContactPage`, and `CollectionPage` schema while retaining `WebPage` as the safe default.
- Added verified inductee portraits to social previews and `Person` schema only when portrait data is approved for candidate publication; board-review-required and incomplete records keep minimal person markup.
- Switched the default social preview to the existing 1920×1280 baseball-field image without modifying image assets.
- Configured generated sitemap output to exclude the 404 route and removed stale checked-in `public/sitemap.xml` and `public/sitemap-0.xml` artifacts that could conflict with the current Astro route set.
- Documented `https://jrhof.org` as the canonical host assumption, updated `robots.txt` to discover Astro's generated `sitemap-index.xml`, and deferred time-sensitive `Event` schema until event-state updates can be kept reliable.
- Added a Cloudflare Static Assets-compatible `public/_headers` baseline with `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, and a conservative enforceable CSP that preserves the current Astro site's inline nav/search/contact/event behavior; HSTS is intentionally deferred until production cutover verification.
- Standardized the Astro site around a shared translucent page surface system (`page-shell`, `page-hero`, `page-surface`/`surface`, shared cards, form fields, trust notes, and disabled CTA states) so the homepage, About, Inductees, Events, Contact, Donate, Privacy Policy, and Terms use one JRHOF visual rhythm over the baseball-field background.
- Updated the footer, Donate, Contact, Privacy Policy, and Terms to use the known public trust signal for JR and Associates, Inc. / Joe Rossi Hall of Fame: EIN 33-1883765.
- Rebuilt Contact as a public trust page with a review-ready form, required name/email/category/subject/message/acknowledgment fields, optional phone, honeypot protection, client-side validation, and an honest not-configured state because no email provider or server endpoint has been approved.
- Rebuilt Donate as a nonprofit support page using Stripe as the intended payment platform, with `PUBLIC_STRIPE_DONATE_ONETIME_URL` and `PUBLIC_STRIPE_DONATE_MONTHLY_URL` as safe future link inputs and disabled CTAs when those values are absent.
- Replaced placeholder Privacy Policy and Terms pages with nonprofit-specific, board-review-ready draft language covering organization identity, EIN, forms, Stripe payment handling, service providers, archive accuracy, corrections, events, external links, and conservative limitations.
- Fixed inductee archive filtering reliability by adding sort-name search coverage and explicit hidden-card CSS while preserving the 150-record data set, sort order, links, aliases, portraits, slugs, routes, and validation rules.
- Restored `npm run validate` compatibility with Cloudflare adapter builds under `dist/client` while retaining support for direct `dist` static output.
- Package scripts now use Astro for development, build, and preview.
- Public design retains the traditional JRHOF blue/gold/white presentation with responsive layouts.
- The Inductees archive keeps the better searchable, data-driven card UX while adopting a production-style translucent wrapper that blends more naturally with the baseball-field background.
- Reworked the shared header, navigation, homepage section flow, event summaries, page rhythm, and footer to match the current production site's classic JRHOF layout.
- Replaced the marketing-style homepage hero with the production mission, Class of 2026, latest events, past events, and support sequence.
- Added a local copy of the production baseball-diamond background so visual parity does not depend on WordPress at runtime.
- Kept Sponsor as a direct page while removing it from the parity-pass main navigation.
- Restored fuller production About copy, exact homepage event excerpts, 2024/2025 event archive context, and sponsor/donor acknowledgments.
- Restored non-transactional 2026 golf and banquet details, class links, flyer references, donation-purpose content, and contact/newsletter explanations.
- Restored the 2026 golf page to the production title, golf-tournament description, photo placeholder note, registration section, raffle/mulligan copy, donation alternative, and sponsor/donor thanks while keeping the interim external registration only as a temporary bridge.
- Added a compact client-side event-state switch on the golf page so the countdown and registration appear before the June 27, 2026 tee time and the photo notice appears after the event.
- Reworked the golf page into a classic production-like layout with the title and intro first, a compact countdown card, side-by-side event details and registration cards, and a modest post-event photo panel.
- Refreshed the Events landing page into a seasonal JRHOF event hub with a featured next event, clearer banquet and golf annual rhythm, cleaner archive/gallery preparation, and a nonprofit-focused sponsor thank-you panel instead of a plain event list.
- Removed the large eyebrow treatment from standard page heroes and tightened the shared hero spacing so the inner pages feel closer to the original JRHOF WordPress rhythm.
- Removed the site-wide theme toggle and dark-mode preference handling so Phase 1 uses one consistent light JRHOF presentation.
- Tightened the shared light palette and card rhythm so the homepage, archive, banquet, events, and biography pages read as one nonprofit archive system.
- Strengthened inductee name readability and aligned card/image spacing across the homepage class cards, archive cards, and banquet person cards.
- Added `docs/CONTENT_PARITY_AUDIT.md` with page-level `restore_now`, `restore_later`, `intentionally_exclude`, and `needs_board_review` decisions.
- Continued to exclude WordPress account/search modal UI, comments, countdowns, malformed banquet time, expired registration instructions, payment links, and backend forms.
- Converted the shared shell to a full-height flex layout so the footer sits at the bottom of short pages, and reduced page-hero/surface spacing so inner pages feel closer to the homepage rhythm.

### Intentionally deferred

- Event-gallery image imports, document scanning, PDF imports, gallery/lightbox UI, media manifests, Cloudflare R2 or another media pipeline, and migration of the 2024/2025 source galleries.
- Native event registration and payment processing, checkout sessions, webhooks, D1 records, event analytics, contact delivery, and the full Cloudflare R2 gallery/media workflow.
- Bulk gallery imports and in-repository full-size event photography; the 2024 and 2025 golf galleries remain linked as migration sources.
- Stripe Checkout session creation, webhooks, D1 donor or registration records, event registration, sponsor checkout, transactional email delivery, analytics scripts, deployment changes, Google Search Console setup, and Google Ads conversion tracking.
- Active `Event` schema until event dates, state changes, venue details, and post-event rebuild ownership can remain reliable; no ticket, registration, donation availability, or offer schema is implied.
- Stripe donation-completion conversion tracking until the donation flow is configured and exposes an approved completion signal.

## 2026-07-02 — Measurement reset

- Published GTM v8 taxonomy restore.
- Demoted polluted GA4/Ads conversion actions.
- Set GA4 retention to 14 months.
- Added Stripe/Eventbrite unwanted referrals.
- Registered GA4 custom dimensions.
- Removed AdSense ads.txt because JRHOF does not use AdSense.
