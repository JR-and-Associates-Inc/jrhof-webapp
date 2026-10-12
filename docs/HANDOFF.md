# Maintainer Handoff

This is the operating guide for whoever maintains the JRHOF website. Coding agents should start with [AGENTS.md](../AGENTS.md).

## Platform at a glance

- **Site.** A static Astro build served by Cloudflare Workers Static Assets through the Worker `jrhof-webapp` (JR and Associates Cloudflare account) at `https://jrhof.org`. `main` is the production branch. Custom-domain, build, deployment-history, and rollback settings live in the Cloudflare account, not the repository.
- **Media.** Served from the R2 bucket `jrhof-media-public` at `https://media.jrhof.org`. Originals live in the organization's Google Drive. See [MEDIA.md](MEDIA.md).
- **Measurement.**
  - Google Tag Manager `GTM-WGDF4SBN` is the only Google loader, delivering GA4 `G-VYQQ5E7ZHM` and Google Ads `AW-17438185594`.
  - Cloudflare Web Analytics is dashboard-managed.
  - Microsoft Clarity `v8l2xfpqpy` loads only through GTM, from a tag guarded by the "Guard | Non-prod hostname" exception so it never runs on preview or local hosts (ADR-018).
  - Zaraz must stay free of Google tools. See [ANALYTICS.md](ANALYTICS.md).
- **Transactions.** Donations use the Zeffy donation form embedded on `/donate/`. Banquet registration uses an embedded Zeffy ticketing form ([operations/ZEFFY.md](operations/ZEFFY.md)), shown once the event's registration status is `open`; `preview/go-live` previews that state. The unselected Stripe alternative is kept on `feature/banquet-stripe-registration` for reference.
- **Repository-managed files.** `robots.txt`, `/.well-known/security.txt`, `public/_headers`, and `public/_redirects`. Cloudflare-managed versions of robots and security.txt are disabled.

## Run and validate

Use Node.js 22.12 or newer:

```bash
npm ci
npm run dev
npm run verify   # check, build, validate, and test
git diff --check
```

Values in `.env.example` are public build-time settings. Never put secrets in `PUBLIC_*` variables or commit a real `.env` file.

Review `git status --short` before staging; build output, local media, Wrangler state, and secrets must stay untracked. When a change can affect shared layout or deployment output, check:
- the changed route, `/`, `/inductees/`, and one biography;
- `/events/` and the policy pages;
- one legacy redirect and an unknown URL (the 404 page).

## Deploy and roll back

Open a pull request, let CI pass, and merge to `main`. Cloudflare Workers Builds then deploys production. After merge:
- Confirm the Cloudflare deployment came from the merged commit.
- Smoke-test `https://jrhof.org`: the changed page, navigation, one redirect, the 404 page, security headers, and exactly one GTM load.

`npm run deploy` performs a real deployment outside that flow and needs explicit approval.

To roll back:
1. Restore the last verified version in the `jrhof-webapp` deployment history.
2. Verify the site.
3. Revert or fix the responsible commit so the next build doesn't redeploy it.

Details are in [CLOUDFLARE.md](CLOUDFLARE.md).

## Approval required

Don't change these without the relevant organization owner and a rollback plan:

- **Cloudflare:** DNS, custom domains, Workers Builds, R2, Zaraz, Web Analytics, Access, or account ownership.
- **Google:** GTM, GA4, Google Ads, Search Console, or conversion definitions.
- **Stripe:** the retired donation Payment Links and any monthly gifts that began there (never cancel a donor's subscription without the owner's decision).
- **Zeffy:** campaigns, prices, schedules, questions, refunds, payouts, or administrator access. Fields the site also displays change in code first ([operations/ZEFFY.md](operations/ZEFFY.md)).
- **Legal:** public legal, privacy, or tax claims, license grants, or content rights.
- **Registration and data:** opening or closing registration on `main`, registration or payment architecture, email delivery, secrets, or retention of personal data.
- **Inductees:** identities, biographies, portraits, or aliases.
- **Edge config:** `public/_redirects` or `public/_headers`, without route and header validation.

## Recurring and open items

- After each event, review event dates, statuses, registration links, and archived external links.
- After ownership or platform changes, sign in as an authorized JR and Associates operator and read back the `jrhof-webapp` Workers Builds settings, preview policy, domain attachment, active version, and rollback ownership.
- Keep account owners, MFA and recovery details, API tokens, registrar information, private contacts, and billing in the organization's access-controlled runbook, never in this public repository.
- Set the permissions, backup, and naming conventions for the Google Drive originals archive.
- Resolve the identity-blocked inductee records noted in [CONTENT_MODEL.md](CONTENT_MODEL.md).
- Banquet registration runs on Zeffy. Board members manage the campaign, attendees, check-in, refunds and exports in Zeffy with their own logins. Launch steps are in [PROJECT_STATE.md](PROJECT_STATE.md#launch-checklist).
- After site changes on `main`, recreate `preview/go-live` from `main` so the two differ only in the registration status.
- Remove the Stripe registration preview Workers and their preview database (listed in [CLOUDFLARE.md](CLOUDFLARE.md)) once the Stripe reference branch is no longer wanted.
