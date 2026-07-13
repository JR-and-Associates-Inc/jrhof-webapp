# JRHOF Master Status

**Updated:** July 2, 2026
**Scope:** Current repository and platform status

## Current state

- The production site at `https://jrhof.org` is the Astro static build served by Cloudflare Workers Static Assets through `jrhof-webapp` in the JR and Associates account.
- `main` is the production source branch. Astro writes `dist/`; the Cloudflare account owns the custom-domain attachment, build settings, deployment history, and rollback controls.
- `wrangler.jsonc` intentionally declares no custom domains or routes. Routine repository deployments therefore cannot change DNS or domain attachment; the dashboard-managed production domain is a separate account-side control.
- Cloudflare Web Analytics is dashboard-managed; the auto-injected `static.cloudflareinsights.com/beacon.min.js` was observed on production in a browser session on 2026-07-12 (it is edge-injected, so it may not appear in every curl/cached response).
- Google Tag Manager container `GTM-WGDF4SBN` is the single loader for Google Analytics 4 (`G-VYQQ5E7ZHM`) and Google Ads (`AW-17438185594`). Cloudflare Zaraz is not used for Google Analytics and must not load GA4, Google Ads, GTM, or another Google measurement tag.
- `robots.txt` and `security.txt` are repository-managed (Cloudflare-managed versions disabled). AI Crawl Control blocks AI-training crawlers, allows mixed-purpose/search crawlers, and leaves AI Labyrinth off. See the [Cloudflare operations playbook](infrastructure/CLOUDFLARE_OPERATIONS.md).
- Microsoft Clarity (`v8l2xfpqpy`) is live in production, loaded once by `src/components/Clarity.astro` via `PUBLIC_CLARITY_PROJECT_ID` at build time (verified in production HTML 2026-07-12). It is intentionally not loaded through GTM; the GTM container holds no Clarity tag.
- `media.jrhof.org` (bucket `jrhof-media-public`) is the sole public media origin; ownership and SSL are active and the temporary `r2.dev` development URL is disabled. `jrhof-media-intake` is private, empty, and optional. The tracked 2024 gallery remains the local fallback; the redesigned gallery still requires non-production Worker UX validation before any production media cutover.
- No full-resolution event gallery originals are intentionally tracked. Event originals belong permanently in Google Drive; R2 receives only approved optimized derivatives.
- Eventbrite remains a temporary external registration bridge. The approved future architecture is hosted Stripe Checkout plus a narrow Worker API and D1 system of record, under separate implementation approval.

## Repository cleanup status

- Retired Next.js source, React-only components, old data generators, duplicate derived data, and legacy public assets are preserved under `_archive/legacy-nextjs/`.
- IDE metadata and `.DS_Store` files are generated local artifacts and are not part of the repository.
- WordPress extraction and reconciliation outputs remain available as historical evidence under `_migration/` and the audit documents.
- `content/Bios/` and `content/Photos/` remain because the active inductee generator uses them; they are migration inputs, not the long-term organizational archive.
- The July 2 handoff cleanup removed only a dead Next.js ESLint config, an unregistered legacy service worker, and one byte-identical unused social image. See [REPOSITORY_CLEANUP_AUDIT_2026-07-02.md](REPOSITORY_CLEANUP_AUDIT_2026-07-02.md).
- A validation-only GitHub Actions workflow now runs check, build, and generated-output validation on pull requests and `main`; it does not deploy.

## Marketing repository delivery status

- PR-1, donation thank-you conversion hardening, is complete (merged as PR #24). Donation return and thank-you routes are noindexed and excluded from the sitemap; a `cs`-gated, session-deduplicated `donation_complete` event is emitted through `jrhofTrack`.
- PR-2, the Stripe `client_reference_id` attribution bridge, is complete (merged as PR #25).
- The Google Ads CSP endpoint patch is complete (merged as PR #26). The required Google and DoubleClick endpoints are allowed in `connect-src` and `img-src`.
- The gallery `window.gtag` fallback cleanup is complete (merged as PR #26). Gallery events now use only the `jrhofTrack`/`dataLayer` path.

## Current safeguards

- Preserve the 150-record inductee model and its content-safety validations.
- Do not change routes, redirects, navigation, event state, or gallery behavior during documentation/hygiene work.
- Do not add a second Google loader: keep `GTM-WGDF4SBN` as the only loader for GA4 and Google Ads, and keep Zaraz free of all Google measurement tools.
- Do not commit full-resolution event photography, camera originals, RAW files, or unreviewed bulk media drops.
- Keep the local 2025/2026 source folders and all `.local-media/` generated derivatives ignored; commit only scripts, manifests, checksums, metadata, and documentation.

## Open risks

- Confirm and privately record the authorized JR and Associates owners for the DNS zone, `jrhof-webapp` Worker, GitHub build connection, R2 buckets/domain, Web Analytics site, Zaraz configuration, registrar recovery, and rollback process.
- Read back Workers Builds settings, preview protection, active version, and rollback ownership after account or maintainer changes. Do not encode private recovery information in this repository.
- Complete the R2 gallery cutover before removing the committed 2024 gallery derivatives.
- The temporary `r2.dev` endpoint is disabled; media serves only through `media.jrhof.org`. (Verified 2026-07-08.)
- Follow the separate inductee portrait audit and migration plan; no inductee media has been migrated or deleted.
- Review event dates/statuses after each event; repository validation does not prove that time-sensitive copy is current.
- Content-review issues documented in the reconciliation audits remain separate from this hygiene pass.
- JRHOF does not use AdSense. Google Ad Grants and Google Ads documentation is separate and remains in scope; the obsolete `public/ads.txt` artifact has been removed.
- No open-source license has been designated for this repository. Licensing decisions are reserved for JR and Associates, Inc. See [LICENSE_REVIEW.md](LICENSE_REVIEW.md).

See the [Cloudflare operations playbook](infrastructure/CLOUDFLARE_OPERATIONS.md) and the [2026-07-08 security & performance audit](audits/JRHOF_CLOUDFLARE_SECURITY_PERFORMANCE_AUDIT_2026-07-08.md) for the verified platform state, plus [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md), [R2_MEDIA_MIGRATION.md](R2_MEDIA_MIGRATION.md), and [DEFERRED_WORK.md](DEFERRED_WORK.md) for the managed follow-up work.
