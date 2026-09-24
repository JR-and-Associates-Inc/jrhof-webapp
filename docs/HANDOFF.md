# Maintainer Handoff

This is the operating guide for whoever maintains the JRHOF website. Coding agents should start with [AGENTS.md](../AGENTS.md).

## Platform at a glance

- **Site.** A static Astro build served by Cloudflare Workers Static Assets through the Worker `jrhof-webapp` (JR and Associates Cloudflare account) at `https://jrhof.org`. `main` is the production branch. Custom-domain, build, deployment-history, and rollback settings live in the Cloudflare account, not the repository.
- **Media.** Served from the R2 bucket `jrhof-media-public` at `https://media.jrhof.org`. Originals live in the organization's Google Drive. See [MEDIA.md](MEDIA.md).
- **Measurement.**
  - Google Tag Manager `GTM-WGDF4SBN` is the only Google loader, delivering GA4 `G-VYQQ5E7ZHM` and Google Ads `AW-17438185594`.
  - Cloudflare Web Analytics is dashboard-managed.
  - Microsoft Clarity `v8l2xfpqpy` loads only through `src/components/Clarity.astro` when `PUBLIC_CLARITY_PROJECT_ID` is set at build time.
  - Zaraz must stay free of Google tools. See [ANALYTICS.md](ANALYTICS.md).
- **Transactions.** Donations use Stripe Payment Links. Event registration uses Eventbrite, a temporary bridge; a hosted Stripe Checkout + Worker + D1 flow is a separate future project ([STRIPE_PHASE_2_ARCHITECTURE.md](launch/STRIPE_PHASE_2_ARCHITECTURE.md)).
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

Details are in [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md).

## Approval required

Don't change these without the relevant organization owner and a rollback plan:

- **Cloudflare:** DNS, custom domains, Workers Builds, R2, Zaraz, Web Analytics, Access, or account ownership.
- **Google:** GTM, GA4, Google Ads, Search Console, or conversion definitions.
- **Stripe:** products, links, redirects, webhooks, refunds, pricing, or credentials.
- **Legal:** public legal, privacy, or tax claims, license grants, or content rights.
- **Registration and data:** registration or payment architecture, D1 data, email delivery, secrets, or retention of personal data.
- **Inductees:** identities, biographies, portraits, or aliases.
- **Edge config:** `public/_redirects` or `public/_headers`, without route and header validation.

## Recurring and open items

- After each event, review event dates, statuses, registration links, and archived external links.
- After ownership or platform changes, sign in as an authorized JR and Associates operator and read back the `jrhof-webapp` Workers Builds settings, preview policy, domain attachment, active version, and rollback ownership.
- Keep account owners, MFA and recovery details, API tokens, registrar information, private contacts, and billing in the organization's access-controlled runbook, never in this public repository.
- Set the permissions, backup, and naming conventions for the Google Drive originals archive.
- Resolve the identity-blocked inductee records noted in [CONTENT_MODEL.md](CONTENT_MODEL.md).
