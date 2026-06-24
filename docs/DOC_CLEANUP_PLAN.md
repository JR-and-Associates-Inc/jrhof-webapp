# JRHOF Documentation Cleanup Plan

**Status:** Recommendation only. Do not move, rename, merge, or delete documents without explicit approval.

## Keep at `docs/` root

Keep the active control layer easy to discover:

- `JRHOF_MASTER_STATUS.md`
- `PROJECT_CONTROL.md`
- `LAUNCH_VISION.md`
- `DOCUMENTATION_INDEX.md`
- `IMPLEMENTATION_GUARDRAILS.md`
- `SITE_QUALITY_STANDARDS.md`
- `CONTENT_MODEL.md`
- `DECISIONS.md`
- `DOC_CLEANUP_PLAN.md` until cleanup is completed

Keep the strongest current evidence near the control layer while content and launch decisions remain open:

- `ORIGINAL_SOURCE_RECONCILIATION.md`
- `LIVE_SITE_VALIDATION_AUDIT.md`
- `INDUCTEE_RECONCILIATION_REVIEW.md`

## Archive later

Create `docs/archive/` only after approval. Preserve Git history and add a short `docs/archive/README.md` explaining that archived files are evidence or implementation history, not current authority.

Recommended first archive group:

- `ASTRO_STATIC_FOUNDATION.md`
- `CURRENT_STATE.md`
- `NEXT_PHASES.md`
- `PARITY_IMPLEMENTATION_PLAN.md`
- `SITE_PARITY_AUDIT.md`
- `PAGE_PARITY_MATRIX.md`
- `INDUCTEE_ARCHIVE_PARITY_AUDIT.md`
- `INDUCTEE_BIO_FORMATTING_AUDIT.md`
- `CONTENT_PARITY_AUDIT.md`
- `WORDPRESS_CONTENT_AUDIT.md`
- `JRHOF_REPO_AUDIT.md`

Consider retaining `CHANGELOG.md` at the root if it will continue to be maintained. Otherwise archive it as a closed Phase 1/parity history document and start a release-oriented changelog only when release management begins.

## Superseded documents

- `CURRENT_STATE.md` is superseded by `JRHOF_MASTER_STATUS.md`.
- `NEXT_PHASES.md` is superseded by `PROJECT_CONTROL.md` and its approved sequence.
- `ASTRO_STATIC_FOUNDATION.md` is superseded as current status but remains valid foundation history.
- `PARITY_IMPLEMENTATION_PLAN.md` is no longer the active roadmap because its associated parity implementation is present on the current `main` baseline; unresolved approvals move into project control.
- Audit documents are not superseded as evidence, but they are superseded as implementation direction by the control layer and current accepted baseline.

## Cleanup method

1. Approve the archive list and decide whether `CHANGELOG.md` remains active.
2. Create `docs/archive/README.md` with the authority warning and archive date.
3. Move approved files without rewriting their historical content.
4. Repair links from retained documents and verify `DOCUMENTATION_INDEX.md` classifications.
5. Run a link check and `git diff --check` in a documentation-only cleanup branch.

No files are moved or deleted by this plan.

## Branch note

The archive folder and the first superseded-history move have now been created on `codex/repo-governance-and-launch-readiness`. Keep this plan as the rationale record for the move, but do not treat it as current authority.
