# Maintainer Handoff

This is the short operating guide for a new JRHOF website maintainer. Read [JRHOF_MASTER_STATUS.md](JRHOF_MASTER_STATUS.md) before making a production-sensitive change.

## Run locally

Use Node.js 22.12 or newer from the repository root:

```bash
npm ci
npm run dev
```

Astro prints the local URL. Environment variables in `.env.example` are public build-time values; never place secrets in `PUBLIC_*` variables or commit a real `.env` file.

## Validate a change

```bash
npm run check
npm run build
npm run validate
git diff --check
```

Review `git status --short` before staging. Build output, local media, source-photo drops, Wrangler state, IDE files, and secrets must remain untracked. Test the changed route plus `/`, `/inductees/`, one biography, `/events/`, policy pages, a legacy redirect, and an unknown route when the change can affect shared layout or deployment output.

## Deployment and rollback

`main` is the production source branch. Astro writes `dist/`; Cloudflare Workers Static Assets serves those files through `jrhof-webapp` at `https://jrhof.org`. Production custom-domain and build settings live in the Cloudflare account, not `wrangler.jsonc`.

Use a reviewed pull request and verify the resulting Cloudflare deployment after merge. `npm run deploy` performs a real deployment and requires explicit approval. For rollback, select the last verified Worker version, verify the public host, and revert or fix the responsible commit so the next build does not reintroduce the failure. See [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md).

## Content and media

- Inductee output is generated in `src/data/inductees.json`; do not hand-edit it.
- Inductee source inputs remain under `content/` and the migration evidence paths documented in [REPO_GOVERNANCE.md](REPO_GOVERNANCE.md).
- Approved web derivatives live in R2 under `media.jrhof.org` or, where explicitly documented, temporarily in `public/`.
- Original event photography belongs in the organization-approved Google Drive or SharePoint archive. Do not commit camera originals, bulk photo drops, or private release records.
- Follow [EVENT_GALLERY_WORKFLOW.md](EVENT_GALLERY_WORKFLOW.md) and [MEDIA_STRATEGY.md](MEDIA_STRATEGY.md) for gallery work.

## Analytics and marketing

Repository guidance lives in:

- [ANALYTICS.md](ANALYTICS.md)
- [JRHOF_MARKETING_ARCHITECTURE.md](architecture/JRHOF_MARKETING_ARCHITECTURE.md)
- [JRHOF_DIGITAL_MARKETING_ROADMAP.md](roadmaps/JRHOF_DIGITAL_MARKETING_ROADMAP.md)
- [JRHOF_GA4_GTM_ADS_OPERATIONS.md](playbooks/JRHOF_GA4_GTM_ADS_OPERATIONS.md)

`GTM-WGDF4SBN` is the only Google loader. Zaraz must remain free of Google measurement tools. Preserve historical audit language when it is clearly dated; update current operating documents when platform truth changes.

## Safe change workflow

1. Confirm the current status and approval boundary.
2. Create one focused branch and avoid unrelated formatting or content churn.
3. Preserve redirects, historical audits, archive evidence, and generated-data invariants.
4. Make the smallest reviewable change and document any account-side prerequisite without changing dashboards implicitly.
5. Run the full validation set and inspect the diff.
6. Open a draft pull request with validation, owner decisions, rollback, and files intentionally left alone.
7. After approval and merge, verify the Worker deployment and affected production routes.

## Approval required

Do not change these without the relevant organization owner and a specific rollback plan:

- Cloudflare DNS, custom domains, Workers Builds, R2, Zaraz, Web Analytics, Access, or account ownership.
- GTM, GA4, Google Ads, Search Console, or conversion definitions.
- Stripe products, links, redirects, webhooks, refunds, pricing, or live/test credentials.
- Public legal/privacy/tax claims, license grants, or content rights.
- Event registration/payment architecture, D1 data, email delivery, secrets, or PII retention.
- Inductee identities, biographies, portraits, aliases, or the 150-record invariant.
- `public/_redirects` or `public/_headers` without route/header validation.

Eventbrite remains a temporary registration bridge. The approved target is hosted Stripe Checkout backed by a narrow Worker API and D1; it is a separate future project, not a cleanup task.

## Private handoff record

Keep named account owners, MFA and recovery details, API tokens, registrar information, private contacts, incident notes, and vendor billing outside this public repository in the organization-approved access-controlled runbook.
