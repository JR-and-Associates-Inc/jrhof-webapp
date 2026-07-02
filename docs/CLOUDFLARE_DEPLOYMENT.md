# Cloudflare Workers Deployment Runbook

## Decision

Continue with Cloudflare Workers Static Assets rather than migrate to Cloudflare Pages.

The site is entirely prerendered, already has a successful Worker deployment, and does not need Pages Functions or Astro server rendering. Cloudflare's current Astro guidance recommends an asset-only Worker for this shape: no Cloudflare adapter, no `main`, and the Astro `dist/` directory as the static asset directory. Workers Builds provides GitHub builds, production-branch deploys, non-production preview versions, and rollback history.

This decision preserves current routes, redirects, headers, page content, and gallery behavior. It does not authorize a custom domain, DNS change, or production cutover.

## Repository configuration

| Setting | Value | Operational meaning |
|---|---|---|
| Worker name | `jrhof-webapp` | Must exactly match the existing Worker when GitHub is connected. |
| Compatibility date | `2026-06-24` | Newest date supported by the locked Wrangler 4.103.0 runtime; review deliberately with Wrangler upgrades. |
| `workers_dev` | `true` | Keeps the current `workers.dev` release-candidate URL available before cutover. |
| `preview_urls` | `true` | Creates version/branch preview URLs; these are public unless Cloudflare Access protects them. |
| Asset directory | `./dist` | Matches the direct output of the adapter-free Astro static build. |
| HTML handling | `auto-trailing-slash` | Matches generated `index.html` routes while retaining the current trailing-slash behavior. |
| Not-found handling | `404-page` | Serves the generated `dist/404.html` for unmatched paths. |
| Worker entrypoint | none | Current delivery is asset-only; there is no request-time code or asset binding. |
| Custom domains/routes | none | Prevents repository deploys from attaching or changing `jrhof.org`. |

`public/_headers` and `public/_redirects` are copied to `dist/` and are supported by Workers Static Assets. The Cloudflare adapter is intentionally absent because every current route is prerendered.

## GitHub-to-Cloudflare flow

Connect the existing `jrhof-webapp` Worker to the repository from Cloudflare Dashboard > Workers & Pages > `jrhof-webapp` > Settings > Builds. Do not create a second Worker or a Pages project.

Use these settings:

| Cloudflare setting | Required value |
|---|---|
| Root directory | repository root |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy --config wrangler.jsonc` |
| Non-production branch builds | enabled |
| Non-production deploy command | `npx wrangler versions upload --config wrangler.jsonc` |
| Node version | a version satisfying `package.json`, currently Node 22.12 or newer |

Expected flow:

1. A pull-request branch installs from `package-lock.json`, runs the Astro build, and uploads a preview Worker version without promoting it.
2. Reviewers validate the generated preview URL. Protect preview URLs with Cloudflare Access before previews contain private data or operational bindings.
3. A merge to `main` builds and deploys a new version of `jrhof-webapp` to its `workers.dev` URL.
4. Before domain cutover, that deployment remains a release candidate; WordPress remains live at `jrhof.org`.

Cloudflare should use the Wrangler version declared in `package.json`. Keep repository configuration authoritative; do not make an unrecorded dashboard change that a later Wrangler deployment will overwrite.

## Validation before a Worker release

Run:

```bash
npm ci
npm run check
npm run build
npm run validate
npx wrangler deploy --dry-run --config wrangler.jsonc
git diff --check
```

Confirm that `dist/` contains `index.html`, `404.html`, `_headers`, `_redirects`, sitemap output, and representative gallery files. In a preview version, check `/`, `/inductees/`, one biography, event archives, the 2024 gallery, policy pages, a legacy redirect, and an unknown path. Verify both `/about` and `/about/` behavior.

`npm run deploy` performs a real deployment and is approval-gated. A dry run, local preview, or non-production version upload is not a custom-domain cutover.

## Rollback

For a static release failure:

1. Record the failing deployment/version ID, symptoms, and first observed time.
2. In Cloudflare Dashboard > Workers & Pages > `jrhof-webapp` > Deployments, select the last verified version and roll back. The Wrangler alternative is `npx wrangler rollback <VERSION_ID>` after listing deployments/versions.
3. Verify the `workers.dev` URL and, after cutover, both public hostnames and representative routes.
4. Revert or fix the responsible Git commit so the next `main` build does not redeploy the bad state.
5. Preserve logs and the failed version for review.

A Worker rollback restores code, static assets, and versioned configuration; it does not roll back D1 data, R2 objects, external Stripe state, email delivery, DNS, or other connected resources. Future stateful releases require their own forward/restore procedures.

## Production cutover checklist

Do not begin until content, redirects, security headers, analytics, legal review, and release-candidate QA are approved.

- Confirm named owners for Cloudflare, registrar, WordPress, deployment, DNS, validation, and rollback.
- Export the complete Cloudflare DNS zone and record current WordPress apex/`www` targets, proxy state, TTLs, certificates, redirects, and mail records.
- Confirm `jrhof.org` is in the same organization-controlled Cloudflare account as `jrhof-webapp`, Web Analytics, Zaraz, and the R2 public bucket/domain.
- Confirm the `main` Workers Build is green and the selected Worker version is recorded.
- Validate the `workers.dev` release candidate on desktop/mobile, including redirects, 404s, forms' honest disabled states, gallery thumbnails/lightbox, analytics injection, and security headers.
- Confirm the canonical host remains `https://jrhof.org` and decide that `www.jrhof.org` redirects to it.
- Define the WordPress freeze window, DNS change window, success criteria, monitoring window, and rollback deadline.
- Attach no domains until the change owner explicitly approves the cutover.
- During the approved window, attach `jrhof.org` as a Worker Custom Domain in the dashboard. Configure `www` as a proxied hostname with a Cloudflare redirect rule to the same path and query on `https://jrhof.org`.
- Verify TLS, apex and `www`, redirects, representative routes/assets, sitemap/robots, Cloudflare Web Analytics, GTM-managed GA4/Google Ads, an empty-of-Google-tools Zaraz configuration, and external links from multiple networks.
- Keep the WordPress environment and prior DNS values intact through the rollback window.
- If acceptance fails, remove/disable the Worker custom-domain attachment as appropriate, restore the recorded DNS/redirect state, purge only when justified, and verify WordPress before closing the incident.

Custom domains are intentionally absent from `wrangler.jsonc` so a routine deploy cannot perform this cutover.

## Environment and bindings roadmap

The asset-only Worker has no runtime bindings today. Add runtime code only when one approved feature requires it, and isolate non-production data first.

| Capability | Current plan | Future configuration gate |
|---|---|---|
| R2 public media | Use `PUBLIC_MEDIA_BASE_URL` at build time and a custom R2 media domain; no site Worker binding is needed for public image reads. | Verify `jrhof-media-public`, its custom domain, object checksums, CSP, and rollback before changing manifests. Never expose `jrhof-media-intake`. |
| D1 | None. | Create separate preview and production databases, migrations, backup/export, retention, and rollback plans before adding a `DB` binding. |
| Stripe | External approved links only; no secret keys in this site. | Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as Worker secrets only with server-verified prices, signatures, fulfillment, reconciliation, and test/live isolation. |
| Turnstile | Not active. | Add a public site key and secret Worker binding with hostname policy, server-side verification, accessibility, analytics, and failure handling. |
| Email | Contact delivery is not configured. | Select a provider or Email binding, verify the sending domain, store credentials as secrets, and define retention, abuse controls, retries, and support ownership. |

When runtime work is approved, add an explicit Worker `main`, an `ASSETS` binding, and narrow `assets.run_worker_first` routes such as `/api/*`; enable only the compatibility flags and observability required by that code; run `wrangler types`; and use isolated preview resources. Do not let branch previews write to production D1, R2 intake, Stripe live mode, or production email.

## Known account-side verification still required

This repository records the intended Worker name and flow, but it cannot prove dashboard ownership, GitHub connection settings, Access policy, DNS ownership, or current deployment history without an authenticated Cloudflare session. An authorized operator must read back those settings before enabling automatic `main` deployments or approving cutover.

Official references: [Astro on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/), [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [Build branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/), [Preview URLs](https://developers.cloudflare.com/workers/configuration/previews/), [rollbacks](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/), and [Worker custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
