# Project state

Reviewed October 11, 2026. This page is kept identical on `main`, the Stripe registration branch and the Zeffy preview branch, so whichever branch you are reading, it describes all three. It separates production source, unmerged previews, dated evidence and proposals. It does not authorize deployment or account changes.

## Three lines of work

| | Production | Stripe registration preview | Zeffy registration preview |
|---|---|---|---|
| Branch | `main` | `feature/banquet-stripe-registration` | `feature/zeffy-registration-preview` |
| Based on | — | main (merged up to `7aa294f`) | main `7aa294f` |
| Pull request | — | [#76](https://github.com/JR-and-Associates-Inc/jrhof-webapp/pull/76) (draft) | Draft PR for demonstration only; not for merge until the board picks a platform |
| Address | https://jrhof.org/ | https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev/ | https://feature-zeffy-registration-preview-jrhof-webapp.jr-and-associates-inc.workers.dev/ |
| Registration page | None (save-the-date page, "Registration coming soon") | `/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/` | Same path |
| How it takes registrations | — | The site's own form posts to a Worker that creates a Stripe Checkout Session (test mode) | Zeffy's embedded ticketing form inside a jrhof.org page |
| Where registrations live | — | JRHOF's existing Stripe account (Checkout Sessions and PaymentIntents); no D1 | Zeffy (its own Stripe Connect account, not JRHOF's existing Stripe) |
| Board tools | None | Google-only `/board/` home, banquet dashboard, guest/all-registration CSVs, kitchen sheet, guest edits, refunds, share/QR tool, meeting checklist | None on jrhof.org; the Zeffy dashboard handles attendees, exports, manual entries and refunds |
| Server code | None (static assets only) | `worker/` for `/api/*`, `/board`, `/board/*` | None (static assets only) |

Both previews share main's public layout (`BaseLayout.astro`, `global.css`). Neither preview has changed production. A passing preview build is not a release.

## Production: main

- Static Astro 7.3 site on Cloudflare Workers Static Assets through the Worker `jrhof-webapp`. `wrangler.jsonc` has no entrypoint and no routes.
- 150 inductees; 27 unavailable biographies; 33 unresolved portraits.
- Donations: Stripe Payment Links. Golf: the approved Eventbrite link. Banquet: save-the-date page for Saturday, February 6, 2027 at Holiday Inn Denver–Lakewood, registration not open.
- Measurement: GTM `GTM-WGDF4SBN` is the only Google loader. Donation completion is a browser event on the Stripe return page.

## Stripe registration preview

Head `b69a048` on October 11 (PR #80 merged documentation into it). Its site, CodeQL and Cloudflare checks passed on the reviewed revision.

- Adds the Class of 2027 (Kirby Clock, Sean Grogan, Brent Mulliniks) with verified R2 portraits; biographies to come. Roster 153.
- Banquet details: noon–4 p.m., business casual.
- Price: $43 through December 15 inclusive (Mountain), then $50. The server picks the price and each order keeps its original rate. Live checkout is blocked while `priceApproved` is false.
- Up to eight guests per order; purchaser contact required; every guest needs a name, meal and dietary response; guest email/phone optional. Optional donation line.
- Server-verified `registration_complete` (with value) after paid confirmation, plus a separate test event. Board pages carry no analytics.
- Evidence: October 11 sandbox rehearsal of an eight-guest checkout ($43 × 8 + $25 donation = $369), confirmation, eight CSV rows, signed webhook and full refund. No real money moved. 34 fake-Stripe Worker tests pass.
- Runbook: [EVENT_REGISTRATION.md](https://github.com/JR-and-Associates-Inc/jrhof-webapp/blob/feature/banquet-stripe-registration/docs/operations/EVENT_REGISTRATION.md). Board decisions: [BOARD_MEETING_2026-10-11.md](https://github.com/JR-and-Associates-Inc/jrhof-webapp/blob/feature/banquet-stripe-registration/docs/operations/BOARD_MEETING_2026-10-11.md).

Not built: manual mail/cash/check entries, comps/recognition pricing, strict seat locking (concurrent checkouts can oversell), Google Chat alerts, mailing-list signup, golf on the Worker.

## Zeffy registration preview

Branched from main `7aa294f` on October 11 so the two approaches can be shown side by side. It deliberately does not include the Stripe branch's Worker, board tools or 2027 content.

- Adds only a noindex registration page at the same path as the Stripe preview. The page keeps the JRHOF header, footer, hero and event summary and embeds Zeffy's ticketing form `2027-hall-of-fame-induction-banquet`. A plain link to the hosted Zeffy form is shown if the embed script cannot load.
- Path-scoped edge headers: only that page allows `https://www.zeffy.com` in `script-src`/`frame-src` and `payment` in `Permissions-Policy`. The rest of the site keeps main's policy.
- The page is excluded from the sitemap and adds no analytics events.
- The Zeffy campaign was updated October 11 to match the Stripe preview: $43 early bird through December 15, then $50; each guest's name, meal and dietary needs; up to 8 per order; 300 seats; noon–4 p.m.; JRHOF description, banner, e-ticket and confirmation email. Sales are open now so the board can try the form, and Zeffy shows no linked bank account yet; set the November 16 opening before launch. See [REGISTRATION_OPTIONS.md](operations/REGISTRATION_OPTIONS.md#making-the-zeffy-form-match).

## Design source of truth

All three branches share `src/components/BaseLayout.astro` and `src/styles/global.css` unchanged from main.

- Public layout: JRHOF/CHSBUA header, archive tone, single light theme, Georgia headings, system/Inter body stack, baseball-field background and constrained surfaces.
- CSS tokens: navy `#082b4c`, blue `#064b86`, gold `#e8b646`. These are page tokens, distinct from the emblem's colors in the external brand kit. Use navy as the Zeffy form color.
- Header/footer logos are `public/images/jrhof-emblem.webp` and `chsbua-logo.webp`. The Stripe branch's QR vector `public/images/jrhof-qr-emblem.svg` is for board QR codes only.
- Stripe board pages use their own navy/gold dashboard styles in `worker/board.ts` and carry no marketing tags.
- Portrait and gallery media resolve through the R2 manifest/helpers; published immutable keys are never overwritten.

## Open decisions (board)

Platform (Stripe custom or Zeffy), menu, final opening/closing dates, capacity, early-bird price approval, refund policy text, recognition/comps, offline entries, privacy/retention, and who operates registration day to day. The comparison is in [REGISTRATION_OPTIONS.md](operations/REGISTRATION_OPTIONS.md); the Zeffy acceptance tests are in [ZEFFY_EVALUATION.md](operations/ZEFFY_EVALUATION.md).

## Not verified in this review

Cloudflare's active production version and build settings, Google Ads/GTM/GA4 configuration, Stripe and Zeffy account settings, and group email delivery were not read back. Record dated, signed-in readbacks privately before changing them.

## Documentation map

| Documents | Role |
|---|---|
| `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md` | How to work in the repository |
| `docs/README.md`, this page, `HANDOFF.md`, `CLOUDFLARE.md` | Operating references |
| `ROADMAP.md`, `DECISIONS.md`, `IMPLEMENTATION_GUARDRAILS.md` | Priorities, decisions and rules |
| `CONTENT_MODEL.md`, `events-architecture.md`, `MEDIA.md`, `implementation/*` | Content, media and page notes |
| `operations/REGISTRATION_OPTIONS.md`, `operations/ZEFFY_EVALUATION.md` | Platform comparison and Zeffy acceptance gates (on all three branches) |
| `operations/EVENT_REGISTRATION.md`, `operations/BOARD_MEETING_2026-10-11.md` | Stripe preview runbook and board checklist (Stripe branch only) |
| `ANALYTICS.md`, `architecture/JRHOF_MARKETING_ARCHITECTURE.md`, `playbooks/*`, `launch/*` | Measurement design and checklists; live Google setup needs its own readback |
| `architecture/JRHOF_GOOGLE_WORKSPACE_*` | Dated migration plan and incomplete inventory |
| `GITHUB_SECURITY_CHECKLIST.md`, `LICENSE_REVIEW.md`, `CONTENT_RIGHTS.md`, `COPYRIGHT.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`, `SECURITY.md` | Policies |
| Ignored `docs/private/` | Private dated evidence; never published |

## Keeping this page aligned

Change this file on all three branches in the same way. When a branch merges, record the merged commit here, then verify the Cloudflare version, public pages, payment isolation and Google delivery separately. When the board chooses a platform, retire the other preview branch and its documentation.
