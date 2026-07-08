# Cloudflare Operations Playbook

**Canonical operational reference for the JRHOF platform.**
Last verified against production: **2026-07-08** (see
[audit](../audits/JRHOF_CLOUDFLARE_SECURITY_PERFORMANCE_AUDIT_2026-07-08.md)).

This is the single source of truth for how JRHOF runs on Cloudflare. It replaces
Cloudflare knowledge that was previously scattered across migration-era documents. When a
platform question comes up — onboarding, troubleshooting, or a future audit — start here.

`https://jrhof.org` is a fully prerendered Astro site. `npm run build` writes the complete
public payload to `dist/`, and Cloudflare Workers Static Assets serves that directory through
the Worker `jrhof-webapp`. There is no Astro server adapter, no Worker `main` entrypoint, and
no request-time database or session in the current application.

## 1. What is managed where

The platform has two control planes. Keep them distinct — most drift and most incidents come
from confusing one for the other.

### Managed in Git (this repository)

| Item | Where | Notes |
|---|---|---|
| Astro source and build | `src/`, `astro.config.mjs` | Prerenders to `dist/`. |
| Worker/assets config | `wrangler.jsonc` | Worker name, `assets` dir, compatibility date. **No routes/custom domains by design.** |
| Security headers | `public/_headers` (`/*` block) | HSTS, CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. |
| Content-Security-Policy | `public/_headers` | Enforced (not report-only). |
| Static-asset caching | `public/_headers` (`/_astro/*`) | Immutable one-year cache for content-hashed assets. |
| Redirects | `public/_redirects` | Legacy WordPress-era URL redirects. |
| `robots.txt` | `public/robots.txt` | **Authoritative** — Cloudflare Managed robots.txt is disabled. |
| `security.txt` | `public/.well-known/security.txt` | **Repository-managed** — Cloudflare-managed `security.txt` is not used. |
| Deployment/validation | `package.json`, `.github/` | `npm run build` / `check` / `validate`; validation-only CI. |

### Managed in Cloudflare (dashboard / account)

| Item | Notes |
|---|---|
| DNS records and proxy status | Apex, `www`, and `media` are proxied (orange-cloud). Export before any change. |
| SSL/TLS mode and certificates | Edge certificates; keep a secure mode (Full (Strict)). |
| WAF, bot management, rate limiting | Managed rules and future rate limits for `/api/*`, contact, webhooks. |
| Workers, deployments, rollback | Deployment history and version rollback for `jrhof-webapp`. |
| Preview policy | `workers.dev` / preview URLs for review; keep public-data-only. |
| R2 buckets | Custom domain, `r2.dev` toggle, privacy, lifecycle. |
| AI Crawl Control | Blocks AI-training crawlers; allows mixed-purpose/search crawlers; AI Labyrinth off. |
| Web Analytics, Zaraz, secrets | Dashboard-managed observers and account secrets. |

`wrangler.jsonc` intentionally declares no `routes` or custom domains, so a routine repository
deploy cannot attach, detach, or reroute `jrhof.org` / `www.jrhof.org`. Domain routing is an
account-side control changed only through a separately approved dashboard operation with a DNS
snapshot and a named rollback owner.

## 2. R2 architecture and media workflow

**Production media origin:** `https://media.jrhof.org`.

| Bucket | Role | Public access | Custom domain | State |
|---|---|---|---|---|
| `jrhof-media-public` | Approved optimized public derivatives (event galleries, inductee portraits, placeholder). | Custom domain **only**; `r2.dev` development URL **disabled**. | `media.jrhof.org` (active) | The only public media bucket. |
| `jrhof-media-intake` | Optional temporary staging. | Private; development URL disabled. | none | Empty; may be retired. |

- **`r2.dev` is intentionally disabled** on the public bucket. Do not re-enable it; the custom
  domain is the permanent, cache-and-policy-aware origin.
- **Preferred human upload workflow is Google Drive or Microsoft SharePoint**, not R2 intake.
  Originals and working sets belong in an access-controlled Drive/SharePoint archive. The
  `jrhof-media-intake` bucket is optional scratch space and is not a required, permanent piece
  of the architecture — it may be retired in favor of Drive/SharePoint uploads.
- **Originals never live in public R2 or Git.** R2 holds reproducible, reviewed derivatives
  only; losing an R2 object must be recoverable by regenerating it from the controlled
  originals archive.
- Objects use stable lowercase keys and immutable filenames, correct `Content-Type`, and
  long-lived cache metadata. Inductee portraits are served under
  `inductees/portraits/v1/<slug>/{profile,card}.webp` with the placeholder at
  `inductees/placeholders/v1/missing-inductee.webp`.
- Application code references media through `src/lib/media.ts` (`mediaUrl(key)`,
  `inducteePortrait(record, variant)`), never hardcoded URLs.

See [MEDIA_STRATEGY.md](../MEDIA_STRATEGY.md), [R2_MEDIA_MIGRATION.md](../R2_MEDIA_MIGRATION.md),
and [INDUCTEE_MEDIA_R2_MIGRATION.md](../INDUCTEE_MEDIA_R2_MIGRATION.md) for storage roles,
object keys, and cutover/rollback contracts.

## 3. Workers and preview environment

- **`jrhof-webapp`** — the production Worker serving `dist/` via Workers Static Assets. This
  is the only production Worker for the public site. Do not create a second production Worker
  or a Cloudflare Pages project for this site.
- **`jrhof-banquet-registration-remote-preview`** — **isolated development infrastructure** for
  the in-progress banquet registration work, together with a **preview D1 database**. It is
  intentionally separate from production: it is not attached to a production route, must use
  preview-only data, and must use Stripe test mode. Promoting it to a production runtime is
  future work under its own approved scope. Do not modify the protected
  `feature/banquet-registration-checkout` branch during routine work.
- Preview and `workers.dev` URLs exist for review. Keep them **public-data-only and
  non-indexable**. Gate them with Cloudflare Access before introducing any PII, secrets, admin
  routes, or write-capable bindings.

## 4. Security decisions

| Decision | State | Rationale |
|---|---|---|
| HSTS | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS for the apex and all subdomains; commits every subdomain (incl. `media`) to HTTPS. |
| Always Use HTTPS | On (`http` → `301` → `https`) | No plaintext delivery. |
| CSP | **Enforced** in `public/_headers` | `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `upgrade-insecure-requests`. `script-src 'unsafe-inline'` is an accepted trade-off for GTM + inline Astro. |
| Other headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy` | Applied to HTML and `/_astro/*`. |
| `robots.txt` | Repository-managed; Cloudflare Managed robots.txt disabled | Single authoritative source in Git. |
| AI Crawl Control | Block AI-training crawlers; allow mixed-purpose/search crawlers; AI Labyrinth off | Preserve search visibility while restricting AI training use. |
| `security.txt` | Repository-managed at `/.well-known/security.txt` | Controlled disclosure contact in Git; Cloudflare-managed version not used. |
| SSL/TLS | Dashboard-managed edge certificates; secure mode | Certificates auto-renew at the edge. |
| Static-asset caching | `/_astro/*` immutable one year; HTML `max-age=0, must-revalidate` | Content-hashed assets are safe to cache forever; HTML always revalidates so new deploys are seen immediately. |
| Analytics loaders | `GTM-WGDF4SBN` is the only Google loader; Zaraz loads no Google tags | Exactly one loader per tool prevents duplicate pageviews/conversions. |

## 5. Operational checklists

### Onboarding a new operator

1. Read this document, then [CLOUDFLARE_DEPLOYMENT.md](../CLOUDFLARE_DEPLOYMENT.md) and
   [PLATFORM_ARCHITECTURE.md](../PLATFORM_ARCHITECTURE.md).
2. Confirm access to the JR and Associates Cloudflare account, the `jrhof.org` zone, the
   `jrhof-webapp` Worker, and the R2 buckets.
3. Read back (do not change) Workers Builds settings, the production custom-domain attachment,
   preview policy, active version, and rollback ownership.
4. Confirm account/zone/registrar recovery details live in the private operations runbook, not
   in this repository.

### Pre-deploy / release validation (repository changes)

```bash
npm ci
npm run check
npm run build
npm run validate
npx wrangler deploy --dry-run --config wrangler.jsonc
git diff --check
```

Then confirm `dist/` contains `index.html`, `404.html`, `_headers`, `_redirects`, sitemap
output, `robots.txt`, `/.well-known/security.txt`, and representative assets. After deploy,
smoke-test `https://jrhof.org`: a changed route, shared navigation, one redirect, the 404,
security headers, `/_astro/*` immutable caching, and exactly one GTM container load.

### Troubleshooting quick reference

| Symptom | First checks |
|---|---|
| Header/CSP change not live | Verify `dist/_headers` regenerated from `public/_headers`; confirm the deploy came from the reviewed commit. |
| Asset not caching | Confirm the URL is under `/_astro/`; other paths intentionally revalidate. |
| Media 404 / wrong image | Check the key in `src/lib/media.ts`; confirm the object exists under `media.jrhof.org`; `r2.dev` is disabled by design. |
| Duplicate analytics | Ensure only `GTM-WGDF4SBN` loads; confirm Zaraz has no Google tools and no hardcoded GA4/Ads tags were added. |
| Unexpected crawler behavior | `robots.txt` is repository-managed; AI Crawl Control governs AI crawlers at the edge. |
| Wrong page after URL change | Check `public/_redirects`; domain routing is account-side. |

### Rollback (static release failure)

1. Record the failing commit, the Cloudflare version/deployment ID, symptoms, and first
   observed time.
2. Restore the last verified version from `jrhof-webapp` deployment history (or Wrangler
   rollback after confirming the exact version ID).
3. Verify `https://jrhof.org`, `www` redirect, representative routes, redirects, and security
   headers.
4. Revert or fix the responsible Git commit so the next `main` build does not redeploy the
   failure.

A Worker rollback restores versioned code/assets/config only. It does not roll back DNS, R2
objects, Stripe state, analytics settings, or future D1 data — stateful features need their
own forward/restore procedures.

### Future-audit checklist

- Re-run the live checks in the [2026-07-08 audit](../audits/JRHOF_CLOUDFLARE_SECURITY_PERFORMANCE_AUDIT_2026-07-08.md)
  (HTTPS upgrade, `www` redirect, HSTS, CSP enforced, security headers, WP probes → 404,
  single GTM loader, Zaraz empty, media origin caching).
- Confirm `r2.dev` remains disabled and `jrhof-media-intake` remains private.
- Confirm Managed robots.txt and Cloudflare `security.txt` remain disabled.
- Confirm no second production Worker or Pages project has appeared.
- Confirm preview/registration infrastructure is still isolated from production.
