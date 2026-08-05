# JRHOF Documentation

This directory separates current operating guidance from migration evidence. If documents conflict, the current platform and operations documents below win for repository and hosting facts; content governance and public-copy approval still follow the named governance documents.

## Current platform and operations

- [infrastructure/CLOUDFLARE_OPERATIONS.md](infrastructure/CLOUDFLARE_OPERATIONS.md) — canonical platform playbook: Git-vs-Cloudflare split, R2/media workflow, preview environment, security decisions, and operational checklists.
- [PLATFORM_ARCHITECTURE.md](PLATFORM_ARCHITECTURE.md) — Astro, Cloudflare Workers, DNS ownership, and deployment boundaries.
- [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md) — Workers Builds, previews, rollback, bindings roadmap, and domain cutover runbook.
- [MEDIA_STRATEGY.md](MEDIA_STRATEGY.md) — R2 derivatives and Google Drive originals policy.
- [R2_MEDIA_MIGRATION.md](R2_MEDIA_MIGRATION.md) — bucket layout, URL contract, object keys, testing, and deferred gallery cutover.
- [INDUCTEE_MEDIA_R2_MIGRATION.md](INDUCTEE_MEDIA_R2_MIGRATION.md) — tracked portrait inventory, record references, missing portraits, breakage risks, and a separate R2 migration plan.
- [ANALYTICS.md](ANALYTICS.md) — GTM-managed GA4/Google Ads, separate Cloudflare Web Analytics, and single-loader Clarity (live via `Clarity.astro`).
- [ADS_ANALYTICS_SEO_AUDIT.md](ADS_ANALYTICS_SEO_AUDIT.md) — 2026-07-12 verified audit of measurement, Google Ads / Ad Grants state, and technical SEO, with the account remediation runbook.
- [EVENT_GALLERY_WORKFLOW.md](EVENT_GALLERY_WORKFLOW.md) — repeatable event and gallery publishing workflow.
- [VALIDATION.md](VALIDATION.md) — required local checks and interpretation.
- [DEFERRED_WORK.md](DEFERRED_WORK.md) — known work intentionally left for later.
- [JRHOF_MASTER_STATUS.md](JRHOF_MASTER_STATUS.md) — concise current repository status.
- [HANDOFF.md](HANDOFF.md) — local setup, validation, deployment, media, analytics, and approval boundaries for the next maintainer.
- [implementation/BANQUET_REGISTRATION.md](implementation/BANQUET_REGISTRATION.md) — preview-only 2027 banquet registration status, architecture, data model, safeguards, and launch gates.
- [implementation/BANQUET_REGISTRATION_V2.md](implementation/BANQUET_REGISTRATION_V2.md) — isolated V2 registration/export boundary, launch gates, rollback, and data decisions.
- [implementation/CLOUDFLARE_ACCESS_EXPORT.md](implementation/CLOUDFLARE_ACCESS_EXPORT.md) — fail-closed Access JWT setup for preview board downloads.
- [operations/BOARD_REGISTRATION_EXPORT_GUIDE.md](operations/BOARD_REGISTRATION_EXPORT_GUIDE.md) — short board workflow for Excel/Sheets, filtering, planning, storage, and deletion.
- [implementation/BANQUET_REGISTRATION_E2E.md](implementation/BANQUET_REGISTRATION_E2E.md) — localhost-only Stripe test-mode end-to-end review procedure and evidence rules.
- [implementation/BANQUET_REGISTRATION_REVIEW_CHECKLIST.md](implementation/BANQUET_REGISTRATION_REVIEW_CHECKLIST.md) — board, staff, privacy, operations, and technical go/no-go checklist.
- [implementation/BANQUET_REGISTRATION_PHASE4_READINESS.md](implementation/BANQUET_REGISTRATION_PHASE4_READINESS.md) — redacted Phase 4 setup evidence, blocked Stripe scenarios, UI guard diagnosis, and board-preview configuration.
- [REPOSITORY_CLEANUP_AUDIT_2026-07-02.md](REPOSITORY_CLEANUP_AUDIT_2026-07-02.md) — evidence-backed cleanup and retained-file decisions.
- [SECURITY_AUDIT_2026-07-02.md](SECURITY_AUDIT_2026-07-02.md) — tracked-code, dependency, disclosure-file, and static-surface security review.
- [LICENSE_REVIEW.md](LICENSE_REVIEW.md) — neutral licensing deferral and maintainer boundary.

## Governance and content controls

- [PROJECT_CONTROL.md](PROJECT_CONTROL.md)
- [REPO_GOVERNANCE.md](REPO_GOVERNANCE.md)
- [IMPLEMENTATION_GUARDRAILS.md](IMPLEMENTATION_GUARDRAILS.md)
- [SITE_QUALITY_STANDARDS.md](SITE_QUALITY_STANDARDS.md)
- [CONTENT_MODEL.md](CONTENT_MODEL.md)
- [DECISIONS.md](DECISIONS.md)
- [launch/LAUNCH_READINESS_CHECKLIST.md](launch/LAUNCH_READINESS_CHECKLIST.md)

## Evidence and history

Migration audits in the `docs/` root and data under `_migration/` preserve traceability. They describe the WordPress and Next.js transition but are not current architecture instructions. Superseded plans and the legacy repository audit live in [archive/](archive/README.md). Retired application source lives in `_archive/legacy-nextjs/`.

[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) remains as a compatibility entry point for older links.
