# Platform Architecture

## Production model

JRHOF is an Astro static site intended for Cloudflare Pages under the JR and Associates Cloudflare account. Git is the source of truth: `main` is the production branch, Pages installs dependencies, runs `npm run build`, and publishes the configured build directory. Pull requests should use Pages preview deployments where available.

The site has no required application database or server session for its current public behavior. Astro pre-renders routes; Cloudflare supplies DNS, TLS, CDN delivery, redirects/headers, analytics injection, and Zaraz.

Official references: [Cloudflare's Astro Pages guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/) and [Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/).

## Repository versus account configuration

The repository defines application code, the Astro build, static headers/redirects, and some Wrangler development settings. The Cloudflare account defines the Pages Git connection, production branch, custom domains, DNS records, deployment history, Web Analytics, Zaraz, and R2 resources.

At this audit, `astro.config.mjs` uses the Cloudflare adapter and a clean build places the public payload under `dist/client`. The checked-in `wrangler.jsonc` uses Worker-specific `main` and `assets` fields, and `npm run deploy` invokes `wrangler deploy`. Those settings describe a Worker-style path, not the stated canonical Pages Git deployment. Do not change or use them for production until the actual Pages project is inspected. Cloudflare recommends downloading/reviewing an existing Pages configuration rather than guessing at it: [Pages Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).

## Required Pages assumptions

- Account: JR and Associates owns or has durable administrator access to the Cloudflare account.
- Project: the Pages project is connected to this repository and deploys `main` to production.
- Build: Node 22.12 or newer, `npm run build`, with the output directory verified against the current adapter output.
- Domain: `jrhof.org` and its chosen `www` behavior are attached to the Pages project; redirects and canonical URLs remain deliberate.
- Rollback: operators know how to select a prior successful Pages deployment.

## DNS and ownership assumptions

- The `jrhof.org` Cloudflare zone should be in the same organization-controlled account as Pages, Zaraz, Web Analytics, and the planned R2 media domain, or cross-account ownership must be documented.
- The domain registrar account, registrant contact, MFA, recovery address, and renewal payment method should be controlled by JR and Associates rather than one vendor or volunteer.
- DNS changes require a before/after record export and rollback plan. Do not delete WordPress-era records until cutover verification and the rollback window are complete.
- The intended public R2 hostname (for example `media.jrhof.org` or the existing approved CDN hostname) must be explicitly confirmed before manifests are rewritten.
- Dashboard state is not fully represented in Git. Record the account owner, project name, zone identifier, and operational contacts in an access-controlled runbook, not in this public repository.

## Deployment validation

Before a production release, compare the clean local build layout with the Pages dashboard output-directory setting, deploy a preview, verify representative routes/assets/redirects/headers, and then promote through the normal `main` workflow. Direct Wrangler deployment is not a substitute for that check.
