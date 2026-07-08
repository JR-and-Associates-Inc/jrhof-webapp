# Platform Architecture

> Operational detail (Git-vs-Cloudflare responsibilities, R2/media workflow, preview
> environment, security decisions, and checklists) lives in the canonical
> [infrastructure/CLOUDFLARE_OPERATIONS.md](infrastructure/CLOUDFLARE_OPERATIONS.md).

## Production model

JRHOF is a fully prerendered Astro site. Cloudflare Workers Static Assets serves the production build at `https://jrhof.org` through the Worker `jrhof-webapp` in the JR and Associates account.

The repository intentionally uses no Astro server adapter and no Worker `main` entrypoint. `npm run build` writes the complete public payload to `dist/`, including `_headers`, `_redirects`, the sitemap, the custom 404 page, and gallery assets. Wrangler publishes that directory through Cloudflare Workers Static Assets.

Cloudflare's current Astro guidance uses this asset-only shape for a fully prerendered site and reserves the Astro Cloudflare adapter for on-demand rendering. Workers Builds supplies the Git deployment and preview workflow that previously favored Pages. Migrating this already-working deployment to Pages would add a second platform model without improving current behavior.

Official references: [Astro on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/), [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), and [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/).

## Configuration boundaries

The repository is authoritative for the Astro build, `wrangler.jsonc`, static headers and redirects, and dependency versions. The Cloudflare account is authoritative for the GitHub connection, build-branch controls, deployment history, custom domains, DNS, Web Analytics, Zaraz, R2, access policy, and secrets.

`wrangler.jsonc` deliberately contains no `routes` or custom-domain entries. A normal Worker deployment therefore cannot attach, detach, or reroute `jrhof.org` or `www.jrhof.org`. The current production attachment is account-managed; any future domain change remains a separately approved dashboard operation with a DNS snapshot and rollback plan.

The active settings and account-side setup are documented in [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md).

## Platform responsibilities

- Astro prerenders all current public routes; there is no application database, server session, or request-time rendering.
- Workers Static Assets serves `dist/`, applies the checked-in static headers and redirects, preserves trailing-slash handling, and serves the generated custom 404 page.
- Cloudflare Web Analytics remains dashboard-managed. GTM container `GTM-WGDF4SBN` is the single Google analytics/ads loader; Zaraz must not load GA4, Google Ads, GTM, or another Google measurement tag. Do not add duplicate analytics tags to source.
- R2 serves only approved, optimized public derivatives through `media.jrhof.org`, the sole public media origin (the `jrhof-media-public` custom domain; its `r2.dev` development URL is disabled). The `jrhof-media-intake` bucket is private, empty, and optional temporary staging. Originals remain in an access-controlled Google Drive or SharePoint archive, which is the preferred human upload workflow — R2 intake is not a permanent architecture requirement.
- Eventbrite is a temporary bridge. Future registration uses hosted Stripe Checkout with a narrow Worker API and D1, plus Turnstile, verified webhooks, retention controls, and isolated preview resources. The `jrhof-banquet-registration-remote-preview` Worker and its preview D1 database are that runtime's isolated development infrastructure; they are separate from production and are not implied by the static deployment.

## Ownership assumptions

- JR and Associates controls the Cloudflare account, `jrhof.org` zone, Worker, R2 buckets, Web Analytics site, and Zaraz configuration.
- JR and Associates controls the registrar account, registrant contact, MFA, recovery address, and renewal payment method.
- Account IDs, zone IDs, recovery material, API tokens, and named operator details belong in an access-controlled operations runbook, not this public repository.
- DNS changes require a before/after export and named rollback owner. Do not delete WordPress-era records during this readiness pass.

## Release boundary

`main` is the production source branch for the Worker. Non-production branches use preview versions and must not receive production secrets or write-capable bindings. A merge or direct `npm run deploy` can change the assets served by the existing production Worker, so both require validation and an identified rollback owner. Domain routing remains a separate Cloudflare account control.
