# Project state

Reviewed October 12, 2026. The current state of the site and what is pending. It does not authorize deployment or account changes. Update it in the same pull request as any change it describes.

## Decision

On October 11, 2026 the board chose **Zeffy** for 2027 banquet registration and as the long-term ticketing platform. Board members can configure it themselves, and it needs far less custom code, server code, dashboards and secrets than the custom Stripe flow. Zeffy charges JRHOF no platform or processing fees. The custom Stripe registration branch was not selected; its PR #76 was closed and the branch is kept for reference only. Donations moved from Stripe Payment Links to an embedded Zeffy donation form in October 2026, and Stripe and Eventbrite were removed from the site (ADR-019).

## Branches

| | Production | Board go-live preview | Not selected |
|---|---|---|---|
| Branch | `main` | `preview/go-live` | `feature/banquet-stripe-registration` |
| Address | https://jrhof.org/ | https://preview-go-live-jrhof-webapp.jr-and-associates-inc.workers.dev/ | https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev/ |
| Banquet registration | "Registration opens soon"; the register page shows a notice, not the form | Open: Register buttons and the embedded Zeffy form | Site form + Worker + Stripe Checkout (test mode) |
| Merge | — | **Never.** It is `main` plus the two-line status change, for board approval | PR #76 closed October 11 |

The Zeffy launch work was built on `feature/zeffy-registration-preview` (PR #81) and released to `main` on October 12, 2026; that branch and the docs branch (PR #82) are retired. Make every site change on `main` (through a pull request), then recreate or update `preview/go-live` from `main` so the two differ only in `src/data/events.ts`.

Only the JR&A Cloudflare account (`0cd62d96…`) builds and serves JRHOF. TJ disconnected the leftover TMCO Consulting copy of `jrhof-webapp` from the repository on October 11.

## Production: main

- Static Astro site on Cloudflare Workers Static Assets (Worker `jrhof-webapp`). `wrangler.jsonc` carries the `previews` block that Workers Builds needs for branch previews.
- **Homepage, events hub and event pages** (approved by TJ October 12): photo event cards (`src/components/EventPhotoCard.astro`, covers chosen in `src/data/galleries/covers.ts`), the next-event card (`FeaturedEvent.astro`), the archive and support panels (`EventsClosing.astro`), program pages, a timeline archive and past-event pages with a banner photo. Golf covers: 2024 photo 156 (Joe Rossi and his wife), 2025 photo 89, 2026 photo 37; 2026 banquet photo 36.
- **2027 banquet page**: compact hero, the Class of 2027 (Kirby Clock, Sean Grogan, Brent Mulliniks) directly after it, one "Plan your visit" section and a closing questions block. Wording: "Registration opens soon". Prices are approved and shown ($43 through December 13, then $50).
- **Register page** (`/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/`, noindex, not in the sitemap): until registration opens it shows an "opens soon" notice and nothing links to it.
- **Donate page** (`/donate/`, indexable): its own copy plus the embedded Zeffy donation form `help-preserve-colorados-umpiring-legacy`, with no link out to zeffy.com. `/donate/thank-you/` and `/donate/return/` redirect to it. Every page may load Zeffy's script and iframe (for the newsletter); only the register page and `/donate/` grant Zeffy the payment permission.
- **Email news**: a lazy "Stay in the loop" Zeffy sign-up with a consent line and privacy link on the homepage, the events pages and `/donate/`; it sends `newsletter_signup`.
- **Emblem**: header, footer and site icons use the vector diamond emblem from the brand kit (`public/images/jrhof-emblem.svg`).
- **Privacy and terms**: updated for Zeffy registration, donations and the email news sign-up (data collected, venue meal sharing, measurement, Zeffy's optional contribution and terms; Stripe named only for monthly gifts that began there), and for Clarity loading through GTM with Zeffy forms masked.
- **Measurement**: GTM `GTM-WGDF4SBN` is the only Google loader. `src/lib/zeffyTracking.ts` turns Zeffy's embed messages into `begin_checkout`, `registration_complete`, `donation_complete` and `newsletter_signup` (no amount; `_test` names off jrhof.org). See [ANALYTICS.md](ANALYTICS.md).
- Golf: no registration until the 2027 tournament is set up in Zeffy; past golf pages say the tournament has ended. Golf dates: Umpire's Cup II was Saturday, June 29, 2024; Umpire's Cup III was Saturday, June 28, 2025. The 2024 and 2025 banquet dates are still unrecorded.

## Board go-live preview

`preview/go-live` is `main` with the 2027 banquet's event `status: 'registration-open'` and registration `status: 'open'` in `src/data/events.ts`. It shows the open banquet page (Register buttons, schema offers) and the register page with the embedded Zeffy form and a preview ribbon. Payments in that form are real. TJ approved its look on October 12; it awaits board approval. On launch day, make the same two-line change on `main` through a pull request; do not merge `preview/go-live`.

### Zeffy campaign (updated October 11)

- Tickets: $43 early bird through December 13, 2026 (Mountain); $50 from December 14. Up to 24 per order (three tables of eight). Capacity 300. Sales close January 29, 2027, 11:55 p.m.
- Per guest: first and last name and a meal (Pasta Carbonara or Chicken Piccata) are required; email, phone and dietary needs are optional.
- Venue text: "Holiday Inn Denver–Lakewood (becoming DoubleTree by Hilton)". The hotel changes its name in early February, so both names stay on the site, the Zeffy form and the e-ticket through the 2027 banquet.
- Two discount codes exist (inductee guests, and the $33 early-bird new-umpire recognition seat). Their names and limits are kept in Zeffy only, never in this repository or on the site.

How Zeffy and the site fit together, and how to change either, is in [operations/ZEFFY.md](operations/ZEFFY.md).

## Launch checklist

1. Board approval of the open banquet page and register page on `preview/go-live`.
2. Link JRHOF's bank account in Zeffy, then set ticket sales to open November 16 (sales are open on the published campaign today).
3. Test a full order: Zeffy has no test mode, so use a 100%-off code or a $1 order and refund once a bank is linked.
4. Google measurement, each with TJ's approval: a GTM tag and GA4 key event for `registration_complete`; import `registration_complete` and `donation_complete` into Google Ads as Primary with a default value.
   - Donations: the Zeffy donation page goes to `main` only after the bank account is linked. Then deactivate every Stripe Payment Link (keep existing monthly gifts unless TJ decides otherwise), point every Google Ads asset at `https://jrhof.org/donate/`, and prove one real small gift end to end, then refund it.
5. After each production deploy: check Search Console (sitemap, coverage) and the Google Ads landing pages. `npm run verify` already covers metadata, sitemap, robots/noindex, security headers and the GTM single-loader rule.
6. Both hotel names stay on everything this year (the name changes in early February). Refresh the Zeffy banner image, which shows only Holiday Inn.
7. Decide whether new umpires keep $33 after December 13 (a $17-off code on the $50 ticket), and whether the meal question stays required.
8. The 2027 portraits have a warm, yellow cast from the original photos (measured; no CSS causes it). Re-process the originals with white balance and publish them under new portrait keys; R2 portrait keys are immutable.
9. Launch: follow "Opening registration" in [operations/ZEFFY.md](operations/ZEFFY.md).

Done: privacy and terms for Zeffy (October 11); TMCO Cloudflare copy disconnected (October 11); site pages released to `main` (October 12).

## Not selected: Stripe registration branch

A complete custom flow: the site's form, a Worker that creates Stripe Checkout Sessions, Google-protected board dashboard, guest CSVs, kitchen sheet, guest edits, refunds and a server-verified `registration_complete` with value. Rehearsed in Stripe test mode on October 11 (eight guests, refund; 34 Worker tests pass). It stays at eight guests per order because guest details are stored in Stripe metadata (50-key limit), and it lacked offline entries, comps, seat locking and check-in. Keep it for reference only; its preview Workers and database can be retired.

## Design source of truth

- Public layout: `src/components/BaseLayout.astro` and `src/styles/global.css`. JRHOF/CHSBUA header, archive tone, Georgia headings, baseball-field background.
- Tokens: navy `#082b4c`, blue `#064b86`, gold `#e8b646`. Navy is the Zeffy form color.
- Portrait and gallery media resolve through the R2 manifests and helpers; published immutable keys are never overwritten.

## Not verified in this review

Cloudflare's build settings, the Google Ads/GTM/GA4 configuration and the Zeffy payout settings were not read back. Record dated readbacks privately before changing them.

## Documentation map

| Documents | Role |
|---|---|
| `AGENTS.md` (shared by every tool; `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` point to it), `CONTRIBUTING.md`, `README.md` | How to work in the repository |
| `docs/README.md`, this page, `HANDOFF.md`, `CLOUDFLARE.md`, `operations/ZEFFY.md` | Operating references |
| `ROADMAP.md`, `DECISIONS.md`, `IMPLEMENTATION_GUARDRAILS.md` | Priorities, decisions and rules |
| `CONTENT_MODEL.md`, `events-architecture.md`, `MEDIA.md` | Content, events and media |
| `ANALYTICS.md` | Measurement: loaders, event names, conversions, checks |
| Ignored `docs/private/` | Private dated evidence; never published |

## Keeping this page aligned

Keep this page only on `main`. When `preview/go-live` is recreated from `main`, it inherits this page unchanged. Superseded plans and dated audits are not kept in the repository; Git history has them.
