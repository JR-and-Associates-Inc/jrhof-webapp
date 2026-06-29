# Architecture Decisions

> See [JRHOF_MASTER_STATUS.md](JRHOF_MASTER_STATUS.md) for current project status.
>
> This file is intentionally limited to durable ADR-style decisions.

## ADR-001: Astro static output

Use Astro static generation so public routes do not require application sessions or a database. The Cloudflare adapter is currently installed and produces a `dist/client` public payload plus Cloudflare build artifacts. Whether a purely static Pages build should remove that adapter is deferred until the live Pages project and output-directory setting are inspected.

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

Do not introduce native payment storage, D1, webhooks, or server-verified registration inside the static foundation without separate approval. Dashboard-managed Cloudflare Web Analytics and GA4 through Zaraz are operational platform configuration, not authorization for new transaction or conversion flows.

## ADR-007: Project-wide quality standards

Adopt `docs/SITE_QUALITY_STANDARDS.md` as the standing baseline for single-theme behavior, security, SEO, mobile usability, visual parity, and validation. Treat it as a cross-cutting requirement for all future page and platform work.

## ADR-008: Single light-theme foundation

Keep Phase 1 on a single light theme that matches the historical JRHOF presentation. Do not ship localStorage preference handling, `prefers-color-scheme` switching, or a visible theme toggle in the static foundation.

## ADR-009: Archival visual tone

Soften the eyebrow-label style and keep the light palette aligned with the classic JRHOF/CHSBUA nonprofit archive feel. Preserve the classic header/footer structure and avoid making the site feel like a SaaS or tech landing page.

## ADR-010: Separate originals from public media

Archive original event photography in an organization-controlled Google Drive or SharePoint library. Publish only approved optimized derivatives to R2. Git may temporarily retain derivatives required by existing behavior, but it is not the originals archive or the long-term gallery delivery store.

## ADR-011: Dashboard-managed analytics

Use Cloudflare Web Analytics for baseline traffic/performance measurement and GA4 through Zaraz with measurement ID `G-VYQQ5E7ZHM`. Do not add duplicate hardcoded tags. Treat Microsoft Clarity as deferred until privacy and operational review.

## ADR-012: Pages is the canonical target

Cloudflare Pages under the JR and Associates account is the canonical deployment target. The Worker-oriented Wrangler configuration is non-canonical until it is reconciled with the actual Pages project.
