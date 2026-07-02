# Architecture Decisions

> See [JRHOF_MASTER_STATUS.md](JRHOF_MASTER_STATUS.md) for current project status.
>
> This file is intentionally limited to durable ADR-style decisions.

## ADR-001: Astro static output

Use Astro static generation so public routes do not require application sessions or a database. The project has no Cloudflare adapter because every current route is prerendered; the direct `dist/` output is published by Workers Static Assets. Add a server adapter or Worker entrypoint only when an approved request-time feature requires one.

## ADR-002: Generated JSON candidate model

Use `src/data/inductees.json` as the Astro data layer. A standard-library Python generator reads the reconciliation CSV and original DOCX files. The generated JSON is committed, so normal Node/Cloudflare builds do not depend on Python or DOCX libraries.

This is a candidate layer, not final board-approved canonical data.

## ADR-003: Preserve WordPress detail paths

Use the reconciled WordPress slug under `/inductees/` as the proposed canonical detail URL. Redirect root-level legacy Next.js routes and known variants directly to those paths. This avoids redirect chains and prioritizes current production URLs.

## ADR-004: Conservative source publication

Prefer clearly mapped original DOCX biographies. Do not use WordPress/live text for Robert Schnabel. Render a pending state when no readable original biography is available. Carry board-review flags into the data and page UI.

## ADR-005: One placeholder policy

Only person-specific, non-placeholder original photos become candidate portraits. Named `Missing` files, the common placeholder, four byte-identical generic silhouettes, and Terry/Ray identity-uncertain media do not qualify. All unresolved records use `portrait-pending.svg`.

## ADR-006: No native transactional behavior in Phase 1

Do not introduce native payment storage, D1, webhooks, or server-verified registration inside the static foundation without separate approval. Dashboard-managed Cloudflare Web Analytics and Google measurement configured through GTM are operational platform configuration, not authorization for new transaction or conversion flows.

## ADR-007: Project-wide quality standards

Adopt `docs/SITE_QUALITY_STANDARDS.md` as the standing baseline for single-theme behavior, security, SEO, mobile usability, visual parity, and validation. Treat it as a cross-cutting requirement for all future page and platform work.

## ADR-008: Single light-theme foundation

Keep Phase 1 on a single light theme that matches the historical JRHOF presentation. Do not ship localStorage preference handling, `prefers-color-scheme` switching, or a visible theme toggle in the static foundation.

## ADR-009: Archival visual tone

Soften the eyebrow-label style and keep the light palette aligned with the classic JRHOF/CHSBUA nonprofit archive feel. Preserve the classic header/footer structure and avoid making the site feel like a SaaS or tech landing page.

## ADR-010: Separate originals from public media

Archive original event photography in an organization-controlled Google Drive or SharePoint library. Publish only approved optimized derivatives to R2. Git may temporarily retain derivatives required by existing behavior, but it is not the originals archive or the long-term gallery delivery store.

## ADR-011: One Google measurement loader

Use Google Tag Manager container `GTM-WGDF4SBN` as the single loader for Google Analytics 4 (`G-VYQQ5E7ZHM`) and Google Ads (`AW-17438185594`). Cloudflare Zaraz must not load GA4, Google Ads, GTM, or another Google measurement tag. Do not add duplicate hardcoded Google tags. Cloudflare Web Analytics remains a separate dashboard-managed tool for baseline traffic/performance measurement. Treat Microsoft Clarity as deferred until privacy and operational review.

## ADR-012: Workers Static Assets is the canonical target

The Cloudflare Worker `jrhof-webapp` under the JR and Associates account is the production target for `https://jrhof.org`. Use `main` as the production source branch, asset-only `dist/` delivery, and preview versions for non-production branches. Keep custom-domain and DNS state account-managed; their deliberate absence from `wrangler.jsonc` prevents routine repository deployments from changing domain routing.

## ADR-013: AdSense is not used

JRHOF does not use AdSense. Google Ad Grants and Google Ads documentation is separate and remains in scope. Remove and do not restore `public/ads.txt` or other AdSense artifacts unless JR and Associates, Inc. makes a new explicit decision.

## ADR-014: Eventbrite is a temporary bridge

Eventbrite is not the permanent registration architecture. Keep current approved external links only while they are needed for event continuity. The future registration system is hosted Stripe Checkout backed by a narrow Cloudflare Worker API and D1, with server-verified prices, webhook idempotency, isolated test resources, retention/privacy controls, reconciliation, exports, and rollback. Implement it only under separate reviewed scope.
