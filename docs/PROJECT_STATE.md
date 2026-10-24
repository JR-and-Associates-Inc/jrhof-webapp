# Project state

Reviewed October 24, 2026 (2027 banquet registration opened). The current state of the site and what is pending. It does not authorize deployment or account changes. Update it in the same pull request as any change it describes.

## Decision

On October 11, 2026 the board chose **Zeffy** for 2027 banquet registration and as the long-term ticketing platform. Board members can configure it themselves, and it needs far less custom code, server code, dashboards and secrets than the custom Stripe flow. Zeffy charges JRHOF no platform or processing fees. The custom Stripe registration branch was not selected; its PR #76 was closed and the branch is kept for reference only. Donations moved from Stripe Payment Links to an embedded Zeffy donation form in October 2026, and Stripe and Eventbrite were removed from the site (ADR-019).

## Branches

| | Production | Former board go-live preview | Not selected |
|---|---|---|---|
| Branch | `main` | `preview/go-live` | `feature/banquet-stripe-registration` |
| Address | https://jrhof.org/ | https://preview-go-live-jrhof-webapp.jr-and-associates-inc.workers.dev/ | https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev/ |
| Banquet registration | **Open** since October 24, 2026: Register buttons and the embedded Zeffy form | Same open state; no longer needed | Site form + Worker + Stripe Checkout (test mode) |
| Merge | — | **Never.** Retired after the launch | PR #76 closed October 11 |

The Zeffy launch work was built on `feature/zeffy-registration-preview` (PR #81) and released to `main` on October 12, 2026; that branch and the docs branch (PR #82) are retired. Make every site change on `main` through a pull request.

Only the JR&A Cloudflare account (`0cd62d96…`) builds and serves JRHOF. TJ disconnected the leftover TMCO Consulting copy of `jrhof-webapp` from the repository on October 11.

## Production: main

- Static Astro site on Cloudflare Workers Static Assets (Worker `jrhof-webapp`). `wrangler.jsonc` carries the `previews` block that Workers Builds needs for branch previews.
- **Homepage, events hub and event pages** (approved by TJ October 12): photo event cards (`src/components/EventPhotoCard.astro`, covers chosen in `src/data/galleries/covers.ts`), the next-event card (`FeaturedEvent.astro`), the archive and support panels (`EventsClosing.astro`), program pages, a timeline archive and past-event pages with a banner photo. Golf covers: 2024 photo 156 (Joe Rossi and his wife), 2025 photo 89, 2026 photo 37; 2026 banquet photo 36.
- **2027 banquet page**: compact hero, the Class of 2027 (Kirby Clock, Sean Grogan, Brent Mulliniks) directly after it, one "Plan your visit" section and a closing questions block. Registration is open (opened October 24, 2026, after board approval; PR #87). Prices are approved and shown ($43 through December 13, then $50).
- **Register page** (`/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/`, noindex, not in the sitemap): embeds the Zeffy ticketing form; the Register buttons on the event page, events hub and homepage lead to it.
- **Donate page** (`/donate/`, indexable): its own copy plus the embedded Zeffy donation form `help-preserve-colorados-umpiring-legacy`, with no link out to zeffy.com. `/donate/thank-you/` and `/donate/return/` redirect to it. Every page may load Zeffy's script and iframe (for the newsletter); only the register page and `/donate/` grant Zeffy the payment permission.
- **Become an Umpire page** (`/become-an-umpire/`, indexable, linked from the footer): how to start umpiring Colorado high school baseball through CHSBUA, with inductee first-step stories. Its one call to action opens CHSBUA's sign-up form and sends `umpire_signup_click`, the conversion for the Ad Grants `Become an umpire` ad group. Publish only facts verified on chsbua.com or in inductee biographies; CHSBUA's site states no requirements, fees or pay.
- **Email news**: a lazy "Stay in the loop" Zeffy sign-up with a consent line and privacy link on the homepage, the events pages and `/donate/`; it sends `newsletter_signup`.
- **Emblem**: header, footer and site icons use the vector diamond emblem from the brand kit (`public/images/jrhof-emblem.svg`).
- **Privacy and terms**: updated for Zeffy registration, donations and the email news sign-up (data collected, venue meal sharing, measurement, Zeffy's optional contribution and terms; Stripe named only for monthly gifts that began there), and for Clarity loading through GTM with Zeffy forms masked.
- **Measurement**: GTM `GTM-WGDF4SBN` is the only Google loader. `src/lib/zeffyTracking.ts` turns Zeffy's embed messages into `begin_checkout`, `registration_complete`, `donation_complete` and `newsletter_signup` (no amount; `_test` names off jrhof.org). See [ANALYTICS.md](ANALYTICS.md).
- Golf: no registration until the 2027 tournament is set up in Zeffy; past golf pages say the tournament has ended. Golf dates: Umpire's Cup II was Saturday, June 29, 2024; Umpire's Cup III was Saturday, June 28, 2025. The 2024 and 2025 banquet dates are still unrecorded.

## Banquet registration launch

The board approved opening registration on October 24, 2026, and the two-line change in `src/data/events.ts` (event `status: 'registration-open'`, registration `status: 'open'`) was merged to `main` through PR #87. `preview/go-live`, which showed the same state for board review, is retired; never merge it.

### Zeffy campaign (updated October 11)

- Tickets: $43 early bird through December 13, 2026 (Mountain); $50 from December 14. Up to 24 per order (three tables of eight). Capacity 300. Sales close January 29, 2027, 11:55 p.m.
- Per guest: first and last name and a meal (Pasta Carbonara or Chicken Piccata) are required; email, phone and dietary needs are optional.
- Venue text: "Holiday Inn Denver–Lakewood (becoming DoubleTree by Hilton)". The hotel changes its name in early February, so both names stay on the site, the Zeffy form and the e-ticket through the 2027 banquet.
- Two discount codes exist (inductee guests, and the $33 early-bird new-umpire recognition seat). Their names and limits are kept in Zeffy only, never in this repository or on the site.

How Zeffy and the site fit together, and how to change either, is in [operations/ZEFFY.md](operations/ZEFFY.md).

## Launch checklist

1. Done October 24, 2026: board approval and the two-line pull request (#87).
2. Zeffy: the bank account is linked (October 12). Confirm when ticket sales should open: the campaign accepts early-bird orders on zeffy.com today, and the regular-price ticket starts "Dec 13 at 11:55 PM" while the site says December 14.
3. Test a full order: Zeffy has no test mode, so place a small real order and refund it.
4. Dashboards, each with TJ's approval (Cowork prompt `jrhof-golive-cowork-prompt-2026-10-12.md` in the project's `Claude outputs`): the GTM Clarity tag (Clarity is off production until it is published), GA4 and Ads conversions for `donation_complete`, `registration_complete` and `newsletter_signup`, deactivating the Stripe Payment Links, the Ads assets that still mention Stripe, and one real gift and one sign-up traced end to end.
5. After each production deploy: check Search Console (sitemap, coverage) and the Google Ads landing pages. `npm run verify` already covers metadata, sitemap, robots/noindex, security headers and the GTM single-loader rule.
6. Both hotel names stay on everything this year (the name changes in early February). Refresh the Zeffy banner image, which shows only Holiday Inn.
7. Decide whether new umpires keep $33 after December 13 (a $17-off code on the $50 ticket), and whether the meal question stays required.
8. Meal descriptions (Vicki's request): the venue's wording is on the site (event and register pages); add the same wording to the Zeffy campaign and ticket descriptions ([operations/ZEFFY.md](operations/ZEFFY.md#changing-the-campaign)). Decide with Vicki how guests ask for the vegetarian carbonara: the dietary-needs field, or a third meal answer (a code change too, since the meal names must match).
9. The 2027 portraits have a warm, yellow cast from the original photos (measured; no CSS causes it). Re-process the originals with white balance and publish them under new portrait keys; R2 portrait keys are immutable.
10. Launch: done October 24, 2026 ("Opening registration" in [operations/ZEFFY.md](operations/ZEFFY.md)); the GTM Preview `begin_checkout` check remains.

Done: privacy and terms for Zeffy (October 11); TMCO Cloudflare copy disconnected (October 11); site pages released to `main` (October 12); Zeffy donations, newsletter sign-up, Clarity through GTM, conversion alignment and inductee structured data released (October 12, PRs #88–#92); Zeffy bank account linked (October 12); Become an Umpire page (October 24, PR #101); 2027 banquet registration opened (October 24, PR #87).

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

Keep this page only on `main`. Superseded plans and dated audits are not kept in the repository; Git history has them.
