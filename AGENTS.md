# AGENTS.md

Guide for AI coding agents (Claude Code, Codex) working on the Joe Rossi Umpires Hall of Fame website, [jrhof.org](https://jrhof.org). The site is a public archive of Colorado high school baseball umpiring history and the events and fundraising pages of JR and Associates, Inc., a Colorado 501(c)(3). One maintainer updates it a few times a year with an agent's help, so keep changes small, verified, and easy to review.

## Commands

Node.js >= 22.12. Install with `npm ci`.

```bash
npm run dev      # local site at http://localhost:4321
npm run verify   # check + build + validate + test — run before every commit
```

`verify` runs `astro check`, `astro build` (static output in `dist/`), `npm run validate` (`scripts/validate-foundation.mjs` and `scripts/audit-launch-readiness.mjs`, which inspect `dist/`), and `npm test` (`scripts/test-banquet-public-page.mjs`, which also reads `dist/`). Validate and test depend on a fresh build. There is no unit-test framework. Checks are plain Node assertion scripts, and each one can be run directly with `node scripts/<name>.mjs`. CI (`.github/workflows/validate.yml`) runs the same steps on every pull request and on `main`.

Ask the maintainer before running anything that changes production:
- `npm run deploy` and any `wrangler deploy`: real production deploys.
- `npm run event:media -- upload --apply` and `npm run portraits -- upload --apply`: write to the public R2 bucket.
- Any change in the Cloudflare, Google, or Stripe dashboards.

## How the site works

- **Static Astro site.** It uses `output: 'static'` and `trailingSlash: 'always'`, so internal links must end in `/`. Cloudflare Workers Static Assets serves `dist/` through the Worker `jrhof-webapp`. There is no server code, database, or runtime secret. Merging to `main` triggers the Cloudflare Workers Builds production deploy, which is configured in the Cloudflare account rather than in this repo. `wrangler.jsonc` intentionally has no routes.
- **Data-driven pages.**
  - `src/data/events.ts` holds one immutable record per event, rendered by `src/pages/events/[eventType]/[slug].astro`. See `docs/events-architecture.md`.
  - `src/data/inductees.json` holds the inductee roster (hand-maintained), rendered by `src/pages/inductees/[slug].astro`. See `docs/CONTENT_MODEL.md`.
  - An event's `inductees` array lists names that must exactly match a `display_name` in `inductees.json`.
- **Media lives in R2, never in Git.** `https://media.jrhof.org` is the only media origin.
  - Portraits resolve through `inducteePortrait()` in `src/lib/media.ts`, backed by `manifests/r2/inductee-portraits-v1.json`. Every inductee without a verified portrait uses the one shared placeholder, `https://media.jrhof.org/inductees/placeholders/v1/missing-inductee.webp`. `portrait_url` in `inductees.json` mirrors the resolved URL (validation enforces this), but always render through `inducteePortrait()`.
  - Galleries resolve through `galleryImagesFromR2Manifest()` in `src/data/galleries/r2.ts`, backed by `manifests/r2/<event-id>.json`. Each manifest is imported explicitly in the event route file.
  - See `docs/MEDIA.md`.
- **Site config.** `src/config/site.ts` holds organization identity, the Stripe donation links, and `eventLinks`, which includes the Eventbrite golf registration URL. Build-time env vars are all `PUBLIC_*` (see `.env.example`).
- **Edge config.** `public/_headers` holds the security headers and CSP. `public/_redirects` holds hand-maintained legacy redirects; point each one straight at its final URL.

## Common updates

Each update goes on its own branch and pull request. Run `npm run verify` and look at the changed pages at desktop width and 390px mobile width before committing.

- **Announce or update an event.** Edit its record in `src/data/events.ts`. Status moves `scheduled` → `registration-open` → `completed` → `gallery-published`. Never overwrite a past year's record: add a new record with a descriptive slug.
  - Registration links go in the event record or in `eventLinks`.
  - Validation rejects any `eventbrite.com` link other than `eventLinks.golfRegistration`. Adding another Eventbrite link means updating that check deliberately.
- **2027 banquet page.** It has bespoke components (`Banquet2027Hero.astro`, the `isBanquet2027` branch in the event route), and `scripts/test-banquet-public-page.mjs` asserts its exact copy. When that page's facts change (inductees announced, registration opens, the event passes), update the test's expected strings in the same change.
- **After an event.** Set the event's status, add the recap, then publish the gallery with the event-media pipeline in `docs/MEDIA.md`. Set `gallery.status: 'published'` only after remote verification passes.
- **New inductee class.**
  - Add each person to `src/data/inductees.json` (field guide in `docs/CONTENT_MODEL.md`).
  - Raise `EXPECTED_INDUCTEES` in `scripts/validate-foundation.mjs`.
  - Add portraits with `npm run portraits -- generate --slug <slug>` and the upload steps in `docs/MEDIA.md`.
  - Pending portraits count toward `EXPECTED_UNRESOLVED_PORTRAITS`.
- **Copy or page changes.**
  - Pages live in `src/pages/`. Shared layout is `src/components/BaseLayout.astro`, which takes `title`, `description`, `canonicalPath`, and `breadcrumbs`. Styles are in `src/styles/global.css`.
  - A standard page is `BaseLayout` → `PageHero` → `section.section > .container > article.page-surface.prose`, with `.button` / `.button-row` for calls to action.

## Design rules

- The site should read as a historical archive and a community nonprofit, not a startup, SaaS product, or marketing landing page. Keep the recognizable JRHOF/CHSBUA header and footer, the blue/gold/white identity, and the existing page-surface system. Don't redesign the homepage unless asked.
- Use a single light theme with no theme toggle. Every page must work at 390px with no horizontal overflow and touch-friendly controls.
- Give every page a unique title and meta description. Donation, sponsor, and event pages get one clear primary call to action.
- Images need meaningful `alt` text. External `target="_blank"` links need `rel="noopener noreferrer"`. Keep client-side JavaScript minimal.
- **Tracked links.** Use `trackingAttrs(eventName, params)` from `src/config/site.ts`. Event names and param keys must be on the allowlist in `scripts/audit-launch-readiness.mjs`, or the audit fails.
- **Google tags.** Google Tag Manager `GTM-WGDF4SBN` is the only Google loader. Never add gtag/GA/Ads snippets or Zaraz tools.

## Content and safety rules

- Public pages must not show internal workflow language such as review status, provenance, migration notes, "pending review", or board-review notices. Validation fails on known phrases.
- Publish only verified facts: names, dates, biographies, portraits, prices, and tax or legal claims. Event records stay honest and partial; never link to a program, flyer, or gallery that doesn't exist.
- Never use the WordPress-era biography for Robert Schnabel. Validation enforces this.
- Don't add payments, registration forms, Workers, D1, webhooks, new third-party scripts, or analytics changes as side work. Eventbrite and Stripe Payment Links are the current transaction path. Moving event registration to Stripe is a separate project tracked in `docs/ROADMAP.md`.
- Never commit photo originals, `.local-media/`, `media-sources/`, `content/`, `.env` files, or secrets. All of these are gitignored.
- The MIT License covers code only. Photos, biographies, and branding are not openly licensed (`CONTENT_RIGHTS.md`).

## More documentation

`docs/README.md` is the index. Direction: `docs/ROADMAP.md`. Operations: `docs/HANDOFF.md`, `docs/CLOUDFLARE.md`. Rules and decisions: `docs/IMPLEMENTATION_GUARDRAILS.md`, `docs/DECISIONS.md`. Analytics: `docs/ANALYTICS.md`.
