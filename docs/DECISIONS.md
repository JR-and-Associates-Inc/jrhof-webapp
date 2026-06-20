# Architecture Decisions

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
