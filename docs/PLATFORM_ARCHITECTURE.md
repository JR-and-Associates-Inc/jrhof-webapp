# Platform Architecture

## Production model

JRHOF is a fully prerendered Astro site. The release candidate is deployed as static assets on the Cloudflare Worker `jrhof-webapp` in the JR and Associates account. The legacy WordPress site remains production at `jrhof.org`; the Worker has no custom domain and is not the production cutover.

The repository intentionally uses no Astro server adapter and no Worker `main` entrypoint. `npm run build` writes the complete public payload to `dist/`, including `_headers`, `_redirects`, the sitemap, the custom 404 page, and gallery assets. Wrangler publishes that directory through Cloudflare Workers Static Assets.

Cloudflare's current Astro guidance uses this asset-only shape for a fully prerendered site and reserves the Astro Cloudflare adapter for on-demand rendering. Workers Builds supplies the Git deployment and preview workflow that previously favored Pages. Migrating this already-working deployment to Pages would add a second platform model without improving current behavior.

Official references: [Astro on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/), [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), and [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/).

## Configuration boundaries

The repository is authoritative for the Astro build, `wrangler.jsonc`, static headers and redirects, and dependency versions. The Cloudflare account is authoritative for the GitHub connection, build-branch controls, deployment history, custom domains, DNS, Web Analytics, Zaraz, R2, access policy, and secrets.

`wrangler.jsonc` deliberately contains no `routes` or custom-domain entries. A normal Worker deployment therefore cannot attach `jrhof.org` or `www.jrhof.org`. Domain attachment remains a separately approved dashboard operation with a DNS snapshot and rollback plan.

The active settings and account-side setup are documented in [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md).

## Platform responsibilities

- Astro prerenders all current public routes; there is no application database, server session, or request-time rendering.
- Workers Static Assets serves `dist/`, applies the checked-in static headers and redirects, preserves trailing-slash handling, and serves the generated custom 404 page.
- Cloudflare Web Analytics and GA4 through Zaraz remain dashboard-managed. Do not add duplicate analytics tags to source.
- R2 serves only approved, optimized public derivatives after the separate media migration is verified. Originals remain in Google Drive or SharePoint.
- Future D1, Stripe, Turnstile, and email work requires a separately reviewed Worker runtime and isolated preview resources. It is not implied by the static deployment.

## Ownership assumptions

- JR and Associates controls the Cloudflare account, `jrhof.org` zone, Worker, R2 buckets, Web Analytics site, and Zaraz configuration.
- JR and Associates controls the registrar account, registrant contact, MFA, recovery address, and renewal payment method.
- Account IDs, zone IDs, recovery material, API tokens, and named operator details belong in an access-controlled operations runbook, not this public repository.
- DNS changes require a before/after export and named rollback owner. Do not delete WordPress-era records during this readiness pass.

## Release boundary

Workers Builds should treat `main` as the production branch for the Worker, but "production branch" does not mean "public production domain" yet. Until the custom-domain checklist is approved and executed, `jrhof.org` must continue resolving to WordPress and the `workers.dev` deployment is the release-candidate environment.
