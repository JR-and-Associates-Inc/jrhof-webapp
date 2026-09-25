# Cloudflare Operations

How jrhof.org runs on Cloudflare: what lives in Git and what lives in the account, how a change reaches production, how to roll it back, and what to check in an audit. Media storage details are in [MEDIA.md](MEDIA.md).

## Production model

`https://jrhof.org` is a fully prerendered Astro site. `npm run build` writes the whole public site to `dist/`, and Cloudflare Workers Static Assets serves that directory through the Worker `jrhof-webapp` in the JR and Associates account. There is no Astro server adapter, no Worker `main` entrypoint, and no request-time database or session. `public/_headers` and `public/_redirects` are copied into the build and enforced at the edge.

`main` is the production branch. Merging to `main` triggers the Workers Builds production deploy, which is configured in the account, not in this repository. The GitHub Actions workflow only validates; a green check is not proof that Cloudflare deployed.

## What is managed where

| In Git (this repository) | In the Cloudflare account |
|---|---|
| Astro source and build (`src/`, `astro.config.mjs`) | Workers Builds connection, build commands, and branch rules |
| `wrangler.jsonc`: Worker name, `dist/` assets, compatibility date | Deployed versions, deployment history, and rollback |
| Security headers, CSP, and `/_astro/*` caching (`public/_headers`) | Custom domains, DNS and proxy state, SSL/TLS |
| Legacy redirects (`public/_redirects`) | WAF, bot management, AI Crawl Control |
| `public/robots.txt` and `public/.well-known/security.txt` (Cloudflare-managed versions are off) | R2 buckets, their custom domain, and the `r2.dev` toggle |
| Validation scripts and the CI workflow | Web Analytics, Zaraz, secrets, preview access |

`wrangler.jsonc` deliberately declares no routes or custom domains, so a repository deploy cannot attach, detach, or reroute `jrhof.org`. Domain changes are dashboard operations that need a DNS export and a named rollback owner.

### Checked-in configuration

| Setting | Value | Meaning |
|---|---|---|
| Worker | `jrhof-webapp` | The only production Worker for the site. Never create a second Worker or a Pages project for it. |
| Compatibility date | `2026-06-24` | Review deliberately when upgrading Wrangler. |
| Static directory | `./dist` | Direct Astro output. |
| HTML handling | `auto-trailing-slash` | Matches the site's trailing-slash URLs. |
| Not-found handling | `404-page` | Serves the generated 404 page. |
| `workers_dev` / preview URLs | enabled | For review only. `_headers` sends `X-Robots-Tag: noindex` on both `workers.dev` hosts. |

## Account inventory

Read back from the Cloudflare API on 2026-09-25:

| Resource | Name | Notes |
|---|---|---|
| Worker | `jrhof-webapp` | Production. Last deployed 2026-09-24, after the last `main` merge. |
| Worker | `jrhof-banquet-registration-remote-preview` | Registration-branch preview (public guest form and Stripe test webhooks). Last deployed 2026-08-05. |
| Worker | `jrhof-banquet-registration-board-preview` | Registration-branch preview (board review behind Cloudflare Access). Last deployed 2026-08-05. |
| D1 database | `jrhof-banquet-registration-preview` | Preview data for the two registration Workers. |
| R2 bucket | `jrhof-media-public` | The only public media bucket, served at `media.jrhof.org`. |
| R2 bucket | `jrhof-media-intake` | Private, optional staging. |
| KV namespaces | none | |

A second copy, `jrhof-webapp` in the **TMCO Consulting** Cloudflare account (created 2026-06-21, before the site moved to the JR and Associates account), is still connected to this repository through Workers Builds. It builds every push, so pull requests show two Cloudflare deployment comments. It is not the production Worker for `jrhof.org`, and `_headers` marks its `workers.dev` hostname `noindex`. Disconnect it when TMCO no longer needs a mirror.

The two registration preview Workers and the preview database belong to `feature/banquet-registration-checkout`. They have no production route and use Stripe test mode. Remove them when that branch is retired or replaced.

Settings last confirmed by a manual dashboard review on 2026-07-08 (re-check them in each audit):
- DNS is proxied for the apex, `www`, and `media`, and `www` redirects to the apex.
- Always Use HTTPS is on.
- The `r2.dev` URL is disabled on `jrhof-media-public`.
- AI Crawl Control blocks AI-training crawlers, allows search and mixed-purpose crawlers, and leaves AI Labyrinth off.
- Zaraz has no Google tools.

## Security decisions

| Decision | State |
|---|---|
| HSTS | `max-age=31536000; includeSubDomains; preload`, which commits every subdomain (including `media`) to HTTPS. |
| CSP | Enforced in `public/_headers`: `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `upgrade-insecure-requests`. `script-src 'unsafe-inline'` is an accepted trade-off for GTM and inline Astro scripts. Extend it only for an approved integration. |
| Other headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive `Permissions-Policy`. |
| Caching | `/_astro/*` is immutable for one year because the filenames are content-hashed. Other paths revalidate, so new deploys show up immediately. |
| Analytics loaders | `GTM-WGDF4SBN` is the only Google loader; Zaraz loads no Google tags. See [ANALYTICS.md](ANALYTICS.md). |
| Previews | Public data only and non-indexable. Put Cloudflare Access in front of a preview before it holds personal data, secrets, admin routes, or write-capable bindings. |

## Release and deploy

Before merging:

```bash
npm ci
npm run verify
npx wrangler deploy --dry-run --config wrangler.jsonc
git diff --check
```

`dist/` should contain `index.html`, `404.html`, `_headers`, `_redirects`, the sitemap, `robots.txt`, and `/.well-known/security.txt`.

After merging, confirm in the `jrhof-webapp` deployment history that the deploy came from the merged commit. Then smoke-test `https://jrhof.org` from a clean browser:
- the changed page
- the navigation
- one legacy redirect
- an unknown URL (the 404 page)
- the security headers
- exactly one GTM container load

`npm run deploy` is a real production deploy outside that flow. It needs explicit approval, current credentials, and a rollback owner.

## Rollback

1. Record the failing commit, the Cloudflare version or deployment ID, the symptoms, and when they started.
2. Restore the last verified version from the `jrhof-webapp` deployment history. Alternatively, run `wrangler rollback` after confirming the exact version ID.
3. Verify the site, the `www` redirect, representative routes, redirects, and headers.
4. Revert or fix the responsible commit so the next `main` build doesn't redeploy it.

A Worker rollback restores code, assets, and configuration only. It does not roll back DNS, R2 objects, Stripe, analytics settings, or database contents. Anything stateful needs its own restore procedure before it ships.

## Guardrails

- Keep `https://jrhof.org` canonical and preserve the `www` redirect.
- Don't change domains, DNS, certificates, proxy state, mail records, or the registrar during routine repository work. Before any domain change, export DNS, note the current Worker version, and name a rollback owner.
- Before adding any request-time code, such as event registration:
  - Add an explicit Worker entrypoint with narrow `assets.run_worker_first` paths (for example `/api/*`).
  - Use Stripe test mode and separate preview resources until launch.
  - Keep live credentials in Worker secrets.
  - Verify webhook signatures and trust only server-side prices.
  - Send `Cache-Control: no-store` on responses that carry personal data.
  - Protect any admin route.

## Troubleshooting

| Symptom | First checks |
|---|---|
| Header or CSP change not live | Confirm `dist/_headers` was rebuilt from `public/_headers` and the deploy came from the reviewed commit. |
| Asset not caching | Only `/_astro/` paths are immutable; the rest revalidate by design. |
| Media 404 or wrong image | Check the key via `src/lib/media.ts` and that the object exists at `media.jrhof.org`. `r2.dev` is disabled by design. |
| Duplicate analytics | Only `GTM-WGDF4SBN` should load. Check that Zaraz has no Google tools and no hard-coded tags were added. |
| Wrong page after a URL change | Check `public/_redirects`. Domain routing is account-side. |

## Audit checklist

Run this after ownership or platform changes, and at least once a year:
- Read back, without changing, the Workers Builds settings, production domain attachment, preview policy, active version, and rollback owner.
- Check HTTPS upgrade, the `www` redirect, HSTS, the enforced CSP, security headers, 404s for old WordPress paths, a single GTM loader, an empty Zaraz, and media caching.
- Confirm `r2.dev` is still disabled and `jrhof-media-intake` is still private.
- Confirm the Cloudflare-managed `robots.txt` and `security.txt` are still off.
- Compare the account inventory above with the live account, including the TMCO mirror. Investigate any extra Worker, Pages project, database, or bucket.
- Keep account owners, MFA and recovery details, API tokens, registrar details, and billing in the private operations runbook, never in this repository.

Official references: [Astro on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/), [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [preview URLs](https://developers.cloudflare.com/workers/configuration/previews/), [rollbacks](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/).
