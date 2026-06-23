# Changelog

## Unreleased — Astro Static Foundation Phase 1

### Added

- Astro static application and Cloudflare Pages-compatible build configuration.
- Reconciled 150-record inductee data model and generation script.
- Searchable archive and 150 biography routes.
- Static organizational, event, donation, sponsor, contact, and policy routes.
- Shared missing-portrait treatment, sitemap, redirect manifest, and validation script.
- Architecture, content-model, current-state, and next-phase documentation.

### Changed

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

- Stripe Checkout session creation, webhooks, D1 donor or registration records, event registration, sponsor checkout, transactional email delivery, analytics scripts, deployment changes, and Google Ads conversion tracking.
