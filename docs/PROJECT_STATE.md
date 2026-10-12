# Project state

Reviewed October 11, 2026, after the board meeting. This page is kept identical on `main` (through the docs branch), the Zeffy launch branch and the retired Stripe branch, so whichever branch you are reading, it describes all three. It separates production, the launch candidate and dated evidence. It does not authorize deployment or account changes.

## Decision

On October 11, 2026 the board chose **Zeffy** for 2027 banquet registration and as the long-term ticketing platform. Board members can configure it themselves, and it needs far less custom code, server code, dashboards and secrets than the custom Stripe flow. Zeffy charges JRHOF no platform or processing fees. The custom Stripe registration branch was not selected; its PR #76 was closed and the branch is kept for reference only. Stripe Payment Links remain the donation path for now.

## Branches

| | Production | Launch candidate | Not selected |
|---|---|---|---|
| Branch | `main` | `feature/zeffy-registration-preview` | `feature/banquet-stripe-registration` |
| Pull request | — | [#81](https://github.com/JR-and-Associates-Inc/jrhof-webapp/pull/81) (draft until the launch checklist passes) | [#76](https://github.com/JR-and-Associates-Inc/jrhof-webapp/pull/76) (closed October 11) |
| Address | https://jrhof.org/ | https://feature-zeffy-registration-preview-jrhof-webapp.jr-and-associates-inc.workers.dev/ | https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev/ |
| Registration | None; banquet page says "Registration coming soon" | Embedded Zeffy form at `/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/` | Site form + Worker + Stripe Checkout (test mode) |
| Server code | None (static assets) | None (static assets) | `worker/` for `/api/*` and `/board/*` |

`docs/registration-options-status` (PR #82) carries documentation to `main`. Only the JR&A Cloudflare account (`0cd62d96…`) builds and serves JRHOF. TJ disconnected the leftover TMCO Consulting copy of `jrhof-webapp` from the repository on October 11.

## Production: main

- Static Astro site on Cloudflare Workers Static Assets (Worker `jrhof-webapp`). `wrangler.jsonc` has no entrypoint, no routes and no `previews` block, so branch preview builds from `main` fail until that block is added.
- PR #83 merged as `2fb4b0a` on October 11: the Class of 2027 (Kirby Clock, Sean Grogan, Brent Mulliniks) with portraits on the homepage, the 2027 banquet page and the inductee archive; profiles say "Biography coming soon". Roster 153; 33 unresolved portraits.
- Donations: Stripe Payment Links. Golf: the approved Eventbrite link. Banquet: Saturday, February 6, 2027, noon–4 p.m.; registration not open.
- Measurement: GTM `GTM-WGDF4SBN` is the only Google loader.

## Launch candidate: Zeffy branch

Branched from main `7aa294f` with the 2027 public content. Everything below is on the preview, not on jrhof.org.

- **Register page** (noindex, not in the sitemap): banquet hero, three steps, the embedded Zeffy ticketing form `2027-hall-of-fame-induction-banquet`, honoree summary, prices, seating and refund policy, and a link to Zeffy's full-page checkout for Apple Pay and Google Pay. Path-scoped edge headers allow `https://www.zeffy.com` only on that page.
- **2027 banquet page**: compact hero, honorees directly after it, one "Plan your visit" section (details, registration note, seating, compact map) and a closing questions block. A "Preview registration" link appears on preview hosts only.
- **Events hub** (`/events/`): next-event photo card with the Class of 2027 portraits, photo cards for recent events and galleries (covers from `src/data/galleries/covers.ts`), program tiles with photos, archive and support side by side. Approved by TJ on condition that SEO, security headers, Search Console and Google Ads are verified when it reaches `main`.
- **Homepage**: subtly streamlined (next-event pointer under the mission buttons, the Class of 2027 section points to the banquet, dates on event cards).
- **Golf dates**: Umpire's Cup II was Saturday, June 29, 2024; Umpire's Cup III was Saturday, June 28, 2025. The 2024 and 2025 banquet dates are still unrecorded.
- **Wording**: "Registration opens soon". Prices are approved and shown ($43 through December 13, then $50). On launch day, switch the banquet's event status to `registration-open` and its registration status to `open`; the Register buttons, schema offers and "Registration is open" wording follow from the data.
- **Privacy and terms**: updated for Zeffy registration (data collected, venue meal sharing, registration measurement, Zeffy's optional contribution and terms).
- **Measurement**: `src/lib/zeffyTracking.ts` turns Zeffy's embed messages into `begin_checkout` and `registration_complete` (no amount; `_test` names off jrhof.org). See [ANALYTICS.md](ANALYTICS.md).
- `wrangler.jsonc` has the `previews` block that Workers Builds needs for branch previews.

### Zeffy campaign (live account, updated October 11)

- Tickets: $43 early bird through December 13, 2026 (Mountain); $50 from December 14. Up to 24 per order (three tables of eight). Capacity 300. Sales close January 29, 2027, 11:55 p.m.
- Per guest: first and last name and a meal (Pasta Carbonara or Chicken Piccata) are required; email, phone and dietary needs are optional. Buyer phone is optional.
- Venue text: "Holiday Inn Denver–Lakewood (becoming DoubleTree by Hilton)". The hotel changes its name in early February, so both names stay on the site, the Zeffy form and the e-ticket through the 2027 banquet.
- Discount codes: `INDUCTEE2027` ($10 off the order, 5 uses) and `NEWUMPIRE` for new-umpire recognition ($10 off each early-bird ticket, so $33; 30 uses). `NEWUMPIRE` does not apply after December 13. Codes are never published on the website.

## Launch checklist

1. Link JRHOF's bank account in Zeffy, then set ticket sales to open November 16 (sales are open on the published campaign today).
2. Test a full order: Zeffy has no test mode, so use a 100%-off code or a $1 order and refund once a bank is linked.
3. ~~Privacy and terms~~: done on this branch October 11 (Zeffy registration data, venue sharing for meals, registration measurement, optional Zeffy contribution, refunds).
4. Google measurement, each with TJ's approval: a GTM tag and GA4 key event for `registration_complete`; import `registration_complete` and `donation_complete` into Google Ads as Primary with a default value; make the Stripe donation Payment Links return with `?cs={CHECKOUT_SESSION_ID}`.
5. Before merging PR #81: `npm run verify` (the launch audit covers metadata, sitemap, robots/noindex, security headers and the GTM single-loader rule); after deploy, check Search Console and the Google Ads landing pages.
6. Both hotel names stay on everything this year (the name changes in early February). Refresh the Zeffy banner image, which shows only Holiday Inn.
7. Decide whether new umpires keep $33 after December 13 (a $17-off code on the $50 ticket), and whether the meal question stays required.
8. The 2027 portraits have a warm, yellow cast from the original photos (measured; no CSS causes it). Re-process the originals with white balance and publish them under new portrait keys; R2 portrait keys are immutable.
9. ~~Disconnect the TMCO Consulting Cloudflare copy~~: done by TJ on October 11.
10. Board go-live preview: branch `preview/go-live` is this branch with registration switched to open, so the board can see launch day. Do not merge it; at launch, make the same two-line change on this branch (event `status: 'registration-open'`, registration `status: 'open'`).

## Not selected: Stripe registration branch

Head `08aa9ab`. A complete custom flow: the site's form, a Worker that creates Stripe Checkout Sessions, Google-protected board dashboard, guest CSVs, kitchen sheet, guest edits, refunds and a server-verified `registration_complete` with value. Rehearsed in Stripe test mode on October 11 (eight guests, refund; 34 Worker tests pass). It stays at eight guests per order because guest details are stored in Stripe metadata (50-key limit), and it lacked offline entries, comps, seat locking and check-in. Keep it for reference only.

## Design source of truth

- Public layout: `src/components/BaseLayout.astro` and `src/styles/global.css`, shared by all branches. JRHOF/CHSBUA header, archive tone, Georgia headings, baseball-field background.
- Tokens: navy `#082b4c`, blue `#064b86`, gold `#e8b646`. Navy is the Zeffy form color.
- Portrait and gallery media resolve through the R2 manifests and helpers; published immutable keys are never overwritten.

## Not verified in this review

Cloudflare's active production version and build settings, the Google Ads/GTM/GA4 configuration and the Zeffy payout settings were not read back. Record dated readbacks privately before changing them.

## Documentation map

| Documents | Role |
|---|---|
| `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md` | How to work in the repository |
| `docs/README.md`, this page, `HANDOFF.md`, `CLOUDFLARE.md` | Operating references |
| `ROADMAP.md`, `DECISIONS.md`, `IMPLEMENTATION_GUARDRAILS.md` | Priorities, decisions and rules |
| `CONTENT_MODEL.md`, `events-architecture.md`, `MEDIA.md`, `implementation/*` | Content, media and page notes |
| `operations/REGISTRATION_OPTIONS.md`, `operations/ZEFFY_EVALUATION.md` | The decision record and the Zeffy launch gates |
| `operations/EVENT_REGISTRATION.md`, `operations/BOARD_MEETING_2026-10-11.md` | Stripe runbook and board checklist (Stripe branch only; retired) |
| `ANALYTICS.md`, `architecture/JRHOF_MARKETING_ARCHITECTURE.md`, `playbooks/*`, `launch/*` | Measurement design and checklists |
| Ignored `docs/private/` | Private dated evidence; never published |

## Keeping this page aligned

Until PR #81 merges, change this file identically on the Zeffy branch and the docs branch (and the Stripe branch while it exists). After the Zeffy launch merges into `main`, keep it only on `main` and record the merged commit here.
