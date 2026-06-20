# Architecture Decisions

> Superseded by [docs/JRHOF_MASTER_STATUS.md](/Users/tjolnhausen/Documents/JRHOF%20Website%20Rebuild/docs/JRHOF_MASTER_STATUS.md) for current project status.
>
> This file is intentionally limited to durable ADR-style decisions.

## ADR-001: Astro static output

Use Astro's default static generation with no Cloudflare runtime adapter. This keeps hosting low-maintenance, produces one file per route, and avoids introducing Workers during the static foundation phase.

## ADR-002: Generated JSON candidate model

Use `src/data/inductees.json` as the Astro data layer. A standard-library Python generator reads the reconciliation CSV and original DOCX files. The generated JSON is committed, so normal Node/Cloudflare builds do not depend on Python or DOCX libraries.

This is a candidate layer, not final board-approved canonical data.

## ADR-003: Preserve WordPress detail paths

Use the reconciled WordPress slug under `/inductees/` as the proposed canonical detail URL. Redirect root-level legacy Next.js routes and known variants directly to those paths. This avoids redirect chains and prioritizes current production URLs.

## ADR-004: Conservative source publication

Prefer clearly mapped original DOCX biographies. Do not use WordPress/live text for Robert Schnabel. Render a pending state when no readable original biography is available. Carry board-review flags into the data and page UI.

## ADR-005: One placeholder policy

Only person-specific, non-placeholder original photos become candidate portraits. Named `Missing` files, the common placeholder, four byte-identical generic silhouettes, and Terry/Ray identity-uncertain media do not qualify. All unresolved records use `portrait-pending.svg`.

## ADR-006: No transactional behavior in Phase 1

Donation, sponsor, contact, banquet, and golf pages are static shells. No Eventbrite, Stripe, D1, Workers, forms, webhooks, or analytics conversion events are implemented.

## ADR-007: Project-wide quality standards

Adopt `docs/SITE_QUALITY_STANDARDS.md` as the standing baseline for single-theme behavior, security, SEO, mobile usability, visual parity, and validation. Treat it as a cross-cutting requirement for all future page and platform work.

## ADR-008: Single light-theme foundation

Keep Phase 1 on a single light theme that matches the historical JRHOF presentation. Do not ship localStorage preference handling, `prefers-color-scheme` switching, or a visible theme toggle in the static foundation.

## ADR-009: Archival visual tone

Soften the eyebrow-label style and keep the light palette aligned with the classic JRHOF/CHSBUA nonprofit archive feel. Preserve the classic header/footer structure and avoid making the site feel like a SaaS or tech landing page.
