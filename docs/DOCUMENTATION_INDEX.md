# JRHOF Documentation Index

This index defines how project documents may be used. A lower category cannot override a higher one. When two authoritative documents appear to conflict, pause implementation and reconcile the documents first.

## Authoritative

| Document | Authority |
|---|---|
| [JRHOF_MASTER_STATUS.md](JRHOF_MASTER_STATUS.md) | Current status, open issues, blockers, and completed baseline. |
| [PROJECT_CONTROL.md](PROJECT_CONTROL.md) | Approval boundaries and implementation sequence. |
| [LAUNCH_VISION.md](LAUNCH_VISION.md) | End-state intent and product direction. |
| [IMPLEMENTATION_GUARDRAILS.md](IMPLEMENTATION_GUARDRAILS.md) | Non-negotiable implementation constraints. |
| [SITE_QUALITY_STANDARDS.md](SITE_QUALITY_STANDARDS.md) | Cross-cutting quality, security, SEO, mobile, and validation baseline. |
| [CONTENT_MODEL.md](CONTENT_MODEL.md) | Inductee candidate-data structure, publication behavior, and special-case invariants. |
| [DECISIONS.md](DECISIONS.md) | Durable ADR-style architecture decisions; not a current-status summary. |
| [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) | Documentation precedence and classification. |

## Active planning

| Document | Use |
|---|---|
| [DOC_CLEANUP_PLAN.md](DOC_CLEANUP_PLAN.md) | Proposed documentation cleanup only; no moves or deletions are authorized. |

New implementation plans must cite the relevant authoritative documents, name their approval gate, and define acceptance criteria. A plan is not approval merely because it exists.

## Evidence/audit

These documents preserve findings and traceability. They may support a decision but do not independently authorize implementation:

- [SITE_PARITY_AUDIT.md](SITE_PARITY_AUDIT.md)
- [PAGE_PARITY_MATRIX.md](PAGE_PARITY_MATRIX.md)
- [INDUCTEE_ARCHIVE_PARITY_AUDIT.md](INDUCTEE_ARCHIVE_PARITY_AUDIT.md)
- [INDUCTEE_BIO_FORMATTING_AUDIT.md](INDUCTEE_BIO_FORMATTING_AUDIT.md)
- [CONTENT_PARITY_AUDIT.md](CONTENT_PARITY_AUDIT.md)
- [ORIGINAL_SOURCE_RECONCILIATION.md](ORIGINAL_SOURCE_RECONCILIATION.md)
- [LIVE_SITE_VALIDATION_AUDIT.md](LIVE_SITE_VALIDATION_AUDIT.md)
- [INDUCTEE_RECONCILIATION_REVIEW.md](INDUCTEE_RECONCILIATION_REVIEW.md)
- [WORDPRESS_CONTENT_AUDIT.md](WORDPRESS_CONTENT_AUDIT.md)
- [JRHOF_REPO_AUDIT.md](JRHOF_REPO_AUDIT.md)

## Historical/superseded

These documents remain useful context, but they do not describe the active roadmap or current authority:

- [ASTRO_STATIC_FOUNDATION.md](ASTRO_STATIC_FOUNDATION.md) — foundation implementation history.
- [CURRENT_STATE.md](CURRENT_STATE.md) — superseded status summary.
- [NEXT_PHASES.md](NEXT_PHASES.md) — superseded roadmap stub.
- [PARITY_IMPLEMENTATION_PLAN.md](PARITY_IMPLEMENTATION_PLAN.md) — plan associated with the parity pass now present on `main`; retain as implementation history.
- [CHANGELOG.md](CHANGELOG.md) — historical change record, not a control document.

## Do not use as implementation authority

Do not treat any audit, CSV/reconciliation artifact, migration note, changelog entry, superseded status file, historical roadmap, old branch description, or production behavior by itself as permission to change the site. In particular:

- Production is a visual and operational reference, not an unquestioned source of truth.
- Candidate reconciliation data is not equivalent to board-approved canonical content.
- Historical plans do not override current project control or guardrails.
- A documented future target does not authorize transactions, forms, analytics, Workers, D1, redirects, or deployment.

