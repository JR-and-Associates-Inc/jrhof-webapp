# AGENTS.md

The single guide for anyone changing this repository with an AI coding agent or by hand: Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, Windsurf, or any other tool. `CLAUDE.md`, `GEMINI.md` and `.github/copilot-instructions.md` only point here. Put shared rules in this file, never in a tool-specific one, so every volunteer's tool follows the same guidance.

The repository is the website for the Joe Rossi Umpires Hall of Fame, [jrhof.org](https://jrhof.org): a public archive of Colorado high school baseball umpiring history and the events and fundraising pages of JR and Associates, Inc., a Colorado 501(c)(3). Volunteers maintain it a few times a year, so keep changes small, verified, and easy to review.

Read [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) for what is live and what is pending before you start.

## Branches

| Branch | Purpose |
|---|---|
| `main` | Production. Every merge deploys jrhof.org through Cloudflare Workers Builds. Changes arrive only through pull requests. |
| `preview/go-live` | `main` plus the two-line change in `src/data/events.ts` that opens 2027 banquet registration, for board review. **Never merge it.** Recreate it from `main` after site changes. |
| `feature/banquet-stripe-registration` | The unselected Stripe registration build, kept for reference only. Don't build on it. |

Work on a short-lived branch from current `main`, one topic per branch, and open a pull request. Non-production branches get a preview at `https://<branch-slug>-jrhof-webapp.jr-and-associates-inc.workers.dev/` (noindex).

## Commands

Node.js >= 22.12. Install with `npm ci` (use `npm install` only when intentionally changing dependencies).

```bash
npm run dev      # local site at http://localhost:4321
npm run verify   # check + build + validate + test; run before every commit
git diff --check
```

`verify` runs `astro check`, `astro build` (static output in `dist/`), `npm run validate` (`scripts/validate-foundation.mjs`, `scripts/audit-launch-readiness.mjs` and `scripts/check-docs.mjs`) and `npm test` (every `scripts/test-*.mjs` acceptance script, through `node --test`). Validation and tests read the fresh build in `dist/`. Checks are plain Node assertion scripts; run any one with `node scripts/<name>.mjs`. CI (`.github/workflows/validate.yml`) runs the same steps on every pull request and on `main`, and `main` requires that check.

## Ask the maintainer first

Never do these without explicit approval from the maintainer in the conversation or the pull request:

- Merge to `main`, or run `npm run deploy` / any `wrangler deploy` (real production deploys).
- `npm run event:media -- upload --apply` or `npm run portraits -- upload --apply` (writes to the public R2 bucket).
- Any change in Cloudflare, Google (GTM, GA4, Ads, Search Console), Stripe, or Zeffy dashboards.
- Opening 2027 banquet registration on `main` (needs board approval).

## How the site works

- **Static Astro site.** `output: 'static'` and `trailingSlash: 'always'`, so internal links end in `/`. Cloudflare Workers Static Assets serves `dist/` through the Worker `jrhof-webapp` (JR and Associates Cloudflare account). No server code, database, or runtime secret. `wrangler.jsonc` has no routes; its `previews` block enables branch previews.
- **Data-driven pages.**
  - `src/data/events.ts`: one record per event, rendered by `src/pages/events/[eventType]/[slug].astro`, and read by the homepage, `/events/`, the program pages and the archive. See `docs/events-architecture.md`.
  - `src/data/inductees.json`: the hand-maintained inductee roster, rendered by `src/pages/inductees/[slug].astro`. See `docs/CONTENT_MODEL.md`. An event's `inductees` names must exactly match a `display_name` there.
  - `src/data/registrations.ts`: banquet prices, meals, limits and dates shown on the event and register pages. They must match the Zeffy campaign.
- **Shared components.** `BaseLayout.astro` (header, footer, metadata, GTM), `EventPhotoCard.astro`, `FeaturedEvent.astro`, `EventsClosing.astro`, `ZeffyEmbed.astro`, `VenueLocation.astro`. Gallery cover photos are chosen in `src/data/galleries/covers.ts`.
- **Media lives in R2, never in Git.** `https://media.jrhof.org` is the only media origin. Portraits resolve through `inducteePortrait()` in `src/lib/media.ts`; galleries through `galleryImagesFromR2Manifest()` with manifests in `manifests/r2/`. See `docs/MEDIA.md`. Logos are vector files in `public/images/` (`jrhof-emblem.svg`, `chsbua-logo.svg`).
- **Transactions.** Donations: Stripe Payment Links (`src/config/site.ts`). Banquet registration: an embedded Zeffy form on the register page, shown only when the event's registration status is `open` (see `docs/operations/ZEFFY.md`). Golf registration: the approved Eventbrite link in `eventLinks` until golf moves to Zeffy.
- **Edge config.** `public/_headers` holds the security headers and CSP (the register page alone may load `https://www.zeffy.com`). `public/_redirects` holds legacy redirects; point each one straight at its final URL.

## Common updates

Run `npm run verify` and look at changed pages at desktop width and 390px before committing.

- **Announce or update an event.** Edit its record in `src/data/events.ts`. Status moves `scheduled` → `registration-open` → `completed` → `gallery-published`. Never overwrite a past year's record; add a new record with a descriptive slug.
- **Open banquet registration (launch day, after board approval).** In the 2027 banquet record set `status: 'registration-open'` and `registration.status: 'open'`. The Register buttons, schema offers, register-page form and "Registration is open" wording follow from the data, and `scripts/test-banquet-public-page.mjs` checks both states.
- **Change a price, meal, date or guest limit.** Change Zeffy and `src/data/registrations.ts` together, code first (see the integration table below).
- **2027 banquet page copy.** It has bespoke components (`Banquet2027Hero.astro`, the `isBanquet2027` branch of the event route) and `scripts/test-banquet-public-page.mjs` asserts its exact copy. Update the test's expected strings in the same change.
- **After an event.** Set the status, add the recap, then publish the gallery with the pipeline in `docs/MEDIA.md`. Set `gallery.status: 'published'` only after remote verification passes. Pick a cover photo in `src/data/galleries/covers.ts`.
- **New inductee class.** Add each person to `src/data/inductees.json` (`docs/CONTENT_MODEL.md`), raise `EXPECTED_INDUCTEES` in `scripts/validate-foundation.mjs`, and add portraits with `npm run portraits` (`docs/MEDIA.md`). Pending portraits count toward `EXPECTED_UNRESOLVED_PORTRAITS`.
- **Copy or page changes.** Pages live in `src/pages/`. A standard page is `BaseLayout` → `PageHero` → `section.section > .container > article.page-surface.prose`, with `.button` / `.button-row` for calls to action. Styles are in `src/styles/global.css`.

## Where outside systems meet the code

Changing one of these in a dashboard also needs a code change. Make the code change first (or both in one release), so nothing breaks or stops counting in between.

| Outside setting | Code that depends on it |
|---|---|
| Zeffy prices, early-bird date, meals, guest limit, close date | `src/data/registrations.ts`, `src/data/events.ts` |
| The Zeffy campaign itself (renamed, copied, replaced) | `src/config/zeffy.ts` (form slug) |
| Zeffy's embed messages | `src/lib/zeffyTracking.ts` (registration conversions) |
| GTM container, GA4 key events, Google Ads conversion names | Event names sent by the site (`docs/ANALYTICS.md`); `BaseLayout.astro`; the CSP in `public/_headers` |
| Stripe donation Payment Link return URL | `/donate/thank-you/` counts a donation only when it returns with `?cs={CHECKOUT_SESSION_ID}` |
| Eventbrite golf link | `eventLinks.golfRegistration` in `src/config/site.ts` and the Eventbrite exception in validation |

Everything else in those dashboards (ticket descriptions, emails, banners, discount codes, campaigns, keywords, budgets, reports) needs no code change.

## Design rules

- The site reads as a historical archive and a community nonprofit, not a startup, SaaS product, or marketing landing page. Keep the JRHOF/CHSBUA header and footer, the blue/gold/white identity, the baseball-field background and the page-surface system. Don't redesign pages unless asked.
- One light theme, no theme toggle. Every page works at 390px with no horizontal overflow and touch-friendly controls.
- Every page has a unique title and meta description. Donation, sponsor and event pages have one clear primary call to action.
- Images need meaningful `alt` text. External `target="_blank"` links need `rel="noopener noreferrer"`. Keep client-side JavaScript minimal.
- **Tracked links.** Use `trackingAttrs(eventName, params)` from `src/config/site.ts`. Event names and parameters must be on the allowlist in `scripts/audit-launch-readiness.mjs` and in `docs/ANALYTICS.md`, or the audit fails.
- **Google tags.** Google Tag Manager `GTM-WGDF4SBN` is the only Google loader. Never add gtag/GA/Ads snippets or Zaraz tools.
- **Microsoft Clarity** loads only through GTM, from a tag guarded by the "Guard | Non-prod hostname" exception so it never runs on preview or local hosts. Never add the Clarity snippet to the code. Wrap third-party forms (Zeffy embeds) in `data-clarity-mask="true"`.

## Content and safety rules

- Public pages never show internal workflow language (review status, provenance, migration notes, "pending review", board-review notices). Validation fails on known phrases.
- Publish only verified facts: names, dates, biographies, portraits, prices, and tax or legal claims. Event records stay honest and partial; never link to a program, flyer, or gallery that doesn't exist.
- Never use the WordPress-era biography for Robert Schnabel. Validation enforces this.
- Don't add payments, forms that collect personal data, Workers, D1, webhooks, new third-party scripts, or analytics changes as side work. Each needs its own approved pull request.
- Never commit photo originals, `.local-media/`, `media-sources/`, `content/`, `.env` files, secrets, account IDs or recovery details. Most of these are gitignored.
- The MIT License covers code only. Photos, biographies and branding are not openly licensed (`CONTENT_RIGHTS.md`).

## Keeping documentation aligned

- When a change alters behavior, a workflow, a rule or a branch, update the affected docs in the same pull request: this file, `README.md`, `docs/PROJECT_STATE.md`, and the topic doc in `docs/`.
- Don't keep superseded plans, dated audits, or "phase" documents in the repository. Git history keeps them. Record lasting decisions in `docs/DECISIONS.md`.
- `scripts/check-docs.mjs` (part of `npm run verify`) fails on broken links between Markdown files and on tool-specific files that stop pointing here.

## More documentation

`docs/README.md` is the index. Current state: `docs/PROJECT_STATE.md`. Direction: `docs/ROADMAP.md`. Operations: `docs/HANDOFF.md`, `docs/CLOUDFLARE.md`, `docs/operations/ZEFFY.md`. Rules and decisions: `docs/IMPLEMENTATION_GUARDRAILS.md`, `docs/DECISIONS.md`. Measurement: `docs/ANALYTICS.md`.
