# JRHOF Cloudflare Security & Performance Audit — 2026-07-08

**Target:** `https://jrhof.org` · Worker `jrhof-webapp` · Account: JR and Associates, Inc
**Media origin:** `https://media.jrhof.org` (R2 bucket `jrhof-media-public`)
**Baseline branch:** `main` · **Mode:** Audit + reconciliation against a completed manual dashboard review

> **This report is reconciled against the VERIFIED production configuration.** The first pass
> combined live HTTP evidence with items that could not be read through the available
> Workers/R2 APIs and were marked "verify in dashboard." An authorized operator has since
> completed that dashboard review. Findings below reflect the verified state, not the
> initial assumptions. No production Cloudflare settings were changed to produce this
> report, and the repository branch that accompanies it (`chore/cloudflare-audit-safe-fixes-2026-07-08`)
> changes only repository files.

## Executive summary

The JRHOF production edge is in strong shape and now matches its documentation. HTTPS is
enforced, `www` redirects to the apex, HSTS is present with `includeSubDomains` and
`preload`, the Content-Security-Policy is **enforced** (not report-only) and complete, and
the full security-header set is applied to HTML and static assets alike. DNS is proxied for
the apex, `www`, and `media` hostnames; TLS certificates are valid; WordPress probe paths
return `404` (there is no WordPress surface); Google Tag Manager `GTM-WGDF4SBN` is the sole
Google loader; and Cloudflare Zaraz injects nothing.

The manual dashboard review closed every "verify" item from the first pass:

- Cloudflare **Managed robots.txt is disabled** — the repository `public/robots.txt` is now
  authoritative.
- **AI Crawl Control** is configured to block AI *training* crawlers, continue allowing
  mixed-purpose/search crawlers, and leave **AI Labyrinth disabled**.
- `security.txt` is intentionally **repository-managed** (served at
  `/.well-known/security.txt`); Cloudflare-managed `security.txt` is deliberately not used.
- R2 media architecture is confirmed: `jrhof-media-public` serves only via the active custom
  domain `media.jrhof.org` with the temporary `r2.dev` **public development URL disabled**;
  `jrhof-media-intake` is **private, has no custom domain, has its development URL disabled,
  and is empty**.
- The `jrhof-banquet-registration-remote-preview` Worker and its preview D1 database are
  confirmed **isolated development infrastructure**, separate from production.

Two repository-safe improvements are applied on the accompanying branch: content-hashed
`/_astro/*` assets now receive an immutable one-year `Cache-Control`, and the example
Microsoft Clarity project ID in `.env.example` is replaced with a placeholder. The remaining
items are genuinely future work (registration runtime, contact form, WAF/rate-limiting when
APIs are public, observability, and governance docs).

## Git-managed vs. Cloudflare-managed responsibilities

| Managed in Git (this repository) | Managed in Cloudflare (dashboard/account) |
|---|---|
| `public/robots.txt` (authoritative) | DNS records and proxy status |
| `public/.well-known/security.txt` | SSL/TLS mode and certificates |
| `public/_headers` (security headers, CSP, cache rules) | WAF, bot management, rate limiting |
| Content-Security-Policy (in `_headers`) | R2 bucket configuration (custom domain, `r2.dev` toggle, privacy) |
| `public/_redirects` (legacy URL redirects) | Workers, deployment history, rollback, preview policy |
| `wrangler.jsonc` (Worker name, assets, compatibility date) | AI Crawl Control |
| Deployment/validation scripts and CI | Web Analytics, Zaraz configuration, secrets |

The repository defines the build and everything shipped inside `dist/`. Cloudflare owns the
account-side controls that a routine repository deploy cannot and must not change. This split
is the reason `wrangler.jsonc` intentionally declares no routes or custom domains.

## Verified-good controls (live evidence)

| Control | Observed | Status |
|---|---|---|
| Always Use HTTPS | `http://jrhof.org/` → `301` → `https://jrhof.org/` | ✅ |
| www → apex | `https://www.jrhof.org/` → `301` → apex (proxied, valid TLS) | ✅ |
| HSTS | `max-age=31536000; includeSubDomains; preload` | ✅ |
| CSP | Enforced; `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `upgrade-insecure-requests` | ✅ |
| Security headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` on HTML **and** `/_astro/*` | ✅ |
| DNS proxy | apex / `www` / `media` all resolve to Cloudflare edge (proxied) | ✅ |
| TLS certificates | jrhof.org and media.jrhof.org present valid, current edge certificates | ✅ |
| WordPress probes | `/wp-login.php`, `/xmlrpc.php`, `/wp-admin/`, `/.env` → `404` | ✅ (no WP surface) |
| Custom 404 | Unknown path → generated Astro `404` | ✅ |
| Single Google loader | Only `GTM-WGDF4SBN`; no hardcoded GA4 / `AW-` / `gtag` | ✅ |
| Zaraz | `/cdn-cgi/zaraz/i.js` → `404`; no Google tags via Zaraz | ✅ |
| R2 media origin | `media.jrhof.org/...webp` → `200`, correct `Content-Type`, `Cache-Control: public, max-age=31536000, immutable` | ✅ |
| Microsoft Clarity | Loader code ships but is inert unless `PUBLIC_CLARITY_PROJECT_ID` is set (unset in production) | ✅ |

## Findings — reconciled and closed

The following were open "verify" items in the first pass and are now **CLOSED** by the
completed dashboard review.

| # | Finding | Verified state | Status |
|---|---|---|---|
| C1 | robots.txt authority | Cloudflare Managed robots.txt **disabled**; repository `public/robots.txt` is authoritative. AI Crawl Control blocks AI-training crawlers, allows mixed-purpose/search crawlers, AI Labyrinth off. | ✅ Closed |
| C2 | `security.txt` management | Intentionally repository-managed and served at `/.well-known/security.txt`. Cloudflare-managed `security.txt` deliberately not enabled. | ✅ Closed (no action) |
| C3 | Verify `r2.dev` disablement | `jrhof-media-public` public development URL (`r2.dev`) is **disabled**. | ✅ Closed |
| C4 | Verify intake bucket privacy | `jrhof-media-intake` is **private**, no custom domain, development URL disabled, and **empty**. | ✅ Closed |
| C5 | Verify public bucket custom domain | `jrhof-media-public` custom domain `media.jrhof.org` is **active** and is the only public media bucket. | ✅ Closed |
| C6 | Verify media architecture | Media is served only through `media.jrhof.org`; originals stay out of public R2 and Git. Intake is optional temporary staging. | ✅ Closed |
| C7 | Banquet registration preview exposure | `jrhof-banquet-registration-remote-preview` Worker and its preview D1 database are confirmed **isolated development infrastructure**, not wired to production. | ✅ Closed (tracked as future production work) |

## Findings — fixed in the accompanying repository branch

| # | Finding | Severity | Fix | Managed by |
|---|---|---|---|---|
| R1 | Content-hashed `/_astro/*` assets were served `Cache-Control: public, max-age=0, must-revalidate` (Workers Static Assets default), forcing a revalidation round-trip on every asset. | Medium (performance) | Added a `/_astro/*` rule to `public/_headers` setting `Cache-Control: public, max-age=31536000, immutable`. Safe because Astro filenames are content-hashed — new bytes get new names. | Git (`public/_headers`) |
| R2 | `.env.example` shipped a live-looking Clarity project ID, inviting accidental enablement without the required privacy review. | Low | Replaced with `your-clarity-project-id` and an explanatory comment. Clarity remains inert in production. | Git (`.env.example`) |

## Findings — accepted / informational

| # | Finding | Severity | Disposition |
|---|---|---|---|
| I1 | CSP uses `script-src 'unsafe-inline'`. | Informational | Accepted trade-off: required by GTM plus inline Astro output. Revisit nonce/hash-based CSP only if the inline surface is eliminated. |
| I2 | `wrangler.jsonc` enables `workers_dev` and `preview_urls`; preview/`workers.dev` URLs serve a copy of the static site. | Informational | Accepted as isolated development/review infrastructure. Keep previews public-data-only and non-indexable; gate with Cloudflare Access before any PII, secrets, or write-capable bindings (e.g., the future registration runtime). |
| I3 | Cloudflare Web Analytics beacon was not observed in production HTML. | Informational | Folded into "operational monitoring and observability" future work: confirm and document whether Web Analytics injection is intended, and reconcile the documentation to the decision. |
| I4 | WordPress probe paths return `404` rather than being challenged/blocked. | Informational | Acceptable for a static site with no WordPress surface. A managed WAF rule could reduce log noise once WAF tuning is in scope. |

## Do not change (guardrails)

- Do not add a second Google loader. `GTM-WGDF4SBN` remains the only Google loader; Zaraz
  must not load GA4, Google Ads, GTM, or any Google measurement tag.
- Do not enable Cloudflare-managed `robots.txt` or `security.txt`; both are repository-managed.
- Do not enable Microsoft Clarity in production until its privacy/masking/consent/retention
  review is approved.
- Do not hardcode the Cloudflare Web Analytics beacon; injection (if any) is dashboard-managed.
- Do not re-enable the `r2.dev` public development URL on `jrhof-media-public`.
- Do not store originals or the only copy of any asset in public R2 or Git.
- Do not change DNS, SSL/TLS, custom-domain attachment, or Workers as part of routine
  repository work, and do not touch the protected `feature/banquet-registration-checkout`
  branch.

## Remaining future work

1. **Complete banquet registration production implementation** — promote the isolated preview
   Worker + preview D1 design into an approved production runtime (Stripe Checkout, narrow
   Worker API, production D1, verified webhooks, Turnstile, retention, rollback).
2. **Contact form rebuild** — implement an approved backend and email provider; the current
   Contact page is review-ready and does not send messages.
3. **Cloudflare WAF / rate-limiting enhancements** — add managed rules and rate limiting for
   the future `/api/*`, contact, and Stripe webhook endpoints once the configuration APIs are
   publicly available.
4. **Operational monitoring and observability** — confirm/adjust Web Analytics, define uptime
   and error monitoring, and document alerting.
5. **Identity and collaboration governance documentation** — record owners, access roles, and
   recovery details for the account, zone, Worker, R2, and registrar in a private operations
   runbook (not this public repository).

## Reference

The canonical operational reference for the platform is
[CLOUDFLARE_OPERATIONS.md](../infrastructure/CLOUDFLARE_OPERATIONS.md). It consolidates the
Git-vs-Cloudflare split, R2 and media workflow, Workers and preview environment, security
decisions, and onboarding/troubleshooting/audit checklists.
