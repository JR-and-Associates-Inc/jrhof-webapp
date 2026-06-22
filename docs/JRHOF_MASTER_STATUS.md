# JRHOF Master Status

**Date:** June 20, 2026  
**Scope:** Documentation and project-governance reconciliation only  
**Non-goals:** No code, content, or route changes

This document is the single authoritative status summary for the JRHOF rebuild. It reconciles the current production site, the accepted Astro baseline on `main`, the completed migration audits, and the source-reconciliation outputs.

## Project control layer

This document remains the status authority. Use [PROJECT_CONTROL.md](PROJECT_CONTROL.md) for approval boundaries and work sequence, [LAUNCH_VISION.md](LAUNCH_VISION.md) for the end-state vision, [IMPLEMENTATION_GUARDRAILS.md](IMPLEMENTATION_GUARDRAILS.md) for implementation constraints, and [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for documentation precedence.

## Development deployment note

- The GitHub repository is connected to Cloudflare Workers.
- The current development URL is [jrhof-webapp.tmco-consulting.workers.dev](https://jrhof-webapp.tmco-consulting.workers.dev).
- Do not treat this URL as production. Production remains [jrhof.org](https://jrhof.org/) until formal cutover.

## Source Set

- Production site: [jrhof.org](https://jrhof.org/)
- Accepted Astro baseline: `main` at `4d44143d8f47d688699440d0a3cf1dc17a14d444` (`Restore JRHOF production parity across inner pages`)
- Primary documentation reviewed:
  - [docs/CURRENT_STATE.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/CURRENT_STATE.md)
  - [docs/DECISIONS.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/DECISIONS.md)
  - [docs/NEXT_PHASES.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/NEXT_PHASES.md)
  - [docs/SITE_QUALITY_STANDARDS.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/SITE_QUALITY_STANDARDS.md)
  - [docs/ASTRO_STATIC_FOUNDATION.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/ASTRO_STATIC_FOUNDATION.md)
  - [docs/CONTENT_MODEL.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/CONTENT_MODEL.md)
- Audit and reconciliation outputs:
  - [docs/CONTENT_PARITY_AUDIT.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/CONTENT_PARITY_AUDIT.md)
  - [docs/ORIGINAL_SOURCE_RECONCILIATION.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/ORIGINAL_SOURCE_RECONCILIATION.md)
  - [docs/WORDPRESS_CONTENT_AUDIT.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/WORDPRESS_CONTENT_AUDIT.md)
  - [docs/LIVE_SITE_VALIDATION_AUDIT.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/LIVE_SITE_VALIDATION_AUDIT.md)
  - [docs/INDUCTEE_RECONCILIATION_REVIEW.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/INDUCTEE_RECONCILIATION_REVIEW.md)
  - [docs/JRHOF_REPO_AUDIT.md](/Users/tjolnhausen/Documents/JRHOF Website Rebuild/docs/JRHOF_REPO_AUDIT.md)
- Source reconciliation artifacts:
  - `_migration/source-reconciliation/source-reconciliation-summary.json`
  - `_migration/reconciliation/inductee-reconciliation.csv`
  - `_migration/reconciliation/inductee-reconciliation.json`
  - `_migration/reconciliation/event-conversion-issues.csv`
  - `_migration/reconciliation/redirects-review.csv`
  - `_migration/reconciliation/live-link-issues.csv`
  - `_migration/reconciliation/media-issues.csv`
  - `_migration/reconciliation/inductee-reconciliation.json`

## Production Site Summary

- The current production site is still the live WordPress site at [jrhof.org](https://jrhof.org/).
- The homepage preserves the classic JRHOF/CHSBUA presentation:
  - black header with logos and title
  - light archive-style content blocks
  - production sequence of Mission, Class of 2026, Latest Events, Past Events, and Support
- Public navigation currently includes Home, About, Inductees, Events, Contact, CHSBUA, and Donate.
- Public login UI remains visible.
- Public comments remain present on inductee and event content.
- The production site still exposes Eventbrite-based event registration and Stripe-hosted donation/add-on links.
- The live archive contains 149 visible inductee cards for a 150-person roster, with Gene Rozelle omitted from the archive list.
- Robert Schnabel remains a critical live content defect: the page exists, but the biography is the wrong person.

## Current Astro Baseline Summary

- The accepted implementation baseline is `main` at commit `4d44143d8f47d688699440d0a3cf1dc17a14d444`.
- The Astro site is a fully static foundation with no Cloudflare adapter.
- The build target is static output for Cloudflare Pages-style hosting.
- The repo now contains both the Astro surface under `src/pages/` and legacy Next.js artifacts under `src/app/` for reference.
- The Astro baseline covers:
  - home
  - about
  - inductees archive and detail pages
  - events archive and event shells
  - donate, sponsor, contact, privacy, terms, and 404 pages
- The accepted baseline uses one consistent light JRHOF presentation and removed the theme toggle in Phase 1.
- The shared layout and homepage rhythm are intentionally aligned to the live site’s classic structure rather than a marketing template.
- Sponsor remains a direct page but is intentionally removed from the main navigation.
- Current branch changes are documentation-supported but should still be treated as Phase 1 static foundation work, not launch-ready transactional infrastructure.

## Content Reconciliation Status

- Roster coverage is complete: 150 known inductees are represented in the reconciliation dataset.
- The original-source package materially improved the archive:
  - 63 records improved by original-source reconciliation
  - 113 records now in safe or near-safe migration lanes
  - 27 biographies still incomplete
  - 32 portrait cases still unresolved after source reconciliation
  - 43 rows still require human or board review
- The reconciled content model treats production URLs, source provenance, aliases, and review status as first-class metadata.
- The canonical content approach is still candidate-based, not board-approved final data.
- The most important content defect remains Robert Schnabel, which must never use the corrupted WordPress/live biography.

## Inductee Archive Status

- The Astro archive is built around 150 inductee records.
- All 150 known inductees are represented exactly once in the reconciliation output.
- The archive is structurally stronger than the current WordPress live archive because it keeps every record visible in the data model, even when content is pending.
- Current unresolved archive issues:
  - 27 biographies are still incomplete.
  - 32 portraits remain unresolved or identity-sensitive.
  - Gene Rozelle remains an archive visibility edge case in the live site.
  - Robert Schnabel is a no-go for direct reuse of the live biography.
- The archive should continue to be treated as a reconciled candidate archive until board-approved canonical selections are finalized.

## Event Registration Status

- Event registration is not implemented natively in the Astro foundation.
- Current production still uses external Eventbrite registration and related Stripe links.
- The Astro baseline intentionally keeps events static-only in Phase 1.
- The likely future registration model remains separate banquet and golf workflows with server-verified payment state, but that is not part of the current implementation phase.
- The documentation still correctly treats native registration as a later phase and not a current deliverable.

## Donation/Sponsorship Status

- Donations are currently informational/static in the Astro foundation.
- Sponsor remains a direct informational page and is not part of the primary navigation.
- The live site still uses external Stripe donation/payment links.
- Sponsor package, fulfillment, and checkout behavior remain unresolved and require board approval before implementation.
- Donation and sponsorship should be treated as planned operational workflows, not active static-site behavior.

## Redirect Status

- Redirect planning exists in draft form, but redirects are not fully reconciled into a board-approved canonical map.
- Current evidence shows the site still depends on a mixture of:
  - repository route aliases
  - WordPress production URLs
  - live-site exceptions such as Gene Rozelle and Wiley Chance
- The redirect strategy should continue to avoid chains and preserve current production URLs where possible.
- URL normalization, case handling, underscore/hyphen variance, and root-level outliers still need explicit governance decisions before any launch cutover.

## Mobile Readiness Status

- Mobile readiness is explicitly treated as a standing quality requirement.
- The site standards require 390px usability, responsive navigation, readable inductee cards, touch-friendly links, responsive images, and no horizontal overflow.
- The Astro foundation is designed around those standards, but mobile QA remains a validation requirement rather than a finished proof of launch readiness.
- The current status is: ready for continued mobile verification, not yet closed out as a launch guarantee.

## SEO Status

- SEO is improved in the Astro foundation but not fully complete.
- The quality baseline requires unique titles, unique meta descriptions, canonical URLs where practical, sitemap coverage, and redirect hygiene.
- Production URLs remain an important compatibility constraint.
- SEO work is still in the governance phase because canonical URL strategy and redirect finalization are not yet board-approved end state decisions.

## Security Status

- The static Astro foundation is deliberately low-complexity and avoids unnecessary client-side JavaScript.
- Public login, registration, and comment UI are not part of the Astro foundation.
- Future forms must use spam protection.
- Future payment and webhook systems must be server-verified and should not trust client-supplied price or payment state.
- A future Cloudflare security-header checklist remains part of the standing standards.
- Security is stronger than the legacy dynamic patterns, but transactional/security hardening for future workflows is still pending.

## Open Issues

1. Approve canonical biographies for the 62 materially different records.
2. Resolve the 27 incomplete biographies.
3. Resolve the 32 unresolved portrait cases.
4. Resolve the identity-sensitive records:
   - Robert Schnabel
   - Terry/Ray Garvey
   - Sam Corentino/Corsentino
   - Walt Clay
   - Steve Usecheck/Jr.
   - Gene Rozelle/Rozzelle
5. Approve the canonical URL and redirect strategy.
6. Decide whether the live archive’s Gene Rozelle omission is treated as a required launch fix or a separate content correction.
7. Decide final governance for sponsor packages, donation copy, and contact/public-channel behavior.

## Launch Blockers

- Robert Schnabel’s wrong-person biography.
- Identity conflict for Terry/Ray Garvey.
- Year conflict for Walt Clay.
- Name/spelling conflict for Sam Corentino/Corsentino.
- Name/suffix conflict for Steve Usecheck/Jr.
- Gene Rozelle archive visibility and redirect consistency.
- 27 biographies still missing substantive original content.
- 32 portrait gaps still unresolved.
- Canonical redirect map not yet board-approved.
- Native transaction and registration systems are not built, which is acceptable for Phase 1 but still blocks any full-feature launch claim.

## Post-Launch Enhancements

- Native banquet registration.
- Native golf registration.
- Raffle and mulligan add-ons.
- Sponsor package checkout and fulfillment.
- Donation checkout with verified payment state.
- Contact form with spam protection and delivery monitoring.
- Consent-aware analytics and campaign attribution.
- Expanded SEO schema and landing-page strategy.
- Media archive completion and board-approved canonical content freeze.

## Conflicting Documentation

- `docs/CURRENT_STATE.md` says the site is already in a broad Phase 1 “current state” and reads like an implementation summary, while the newer audits show several unresolved blockers still remain.
- `docs/ASTRO_STATIC_FOUNDATION.md` presents the static foundation as complete enough to describe route coverage, but it predates the reconciled board-review gaps and should be read as architecture history, not final launch status.
- `docs/CONTENT_MODEL.md` says `Sam Corentino` and `Gene Rozzelle` are special cases, while live production still shows `Sam Corentino`/`Sam Corsentino` tension and Gene Rozelle archive omission.
- `docs/DECISIONS.md` and `docs/SITE_QUALITY_STANDARDS.md` both define standards, but `SITE_QUALITY_STANDARDS.md` is the more current and more authoritative policy document.
- `docs/NEXT_PHASES.md` still describes later phases in a way that implies a linear roadmap, but the audits show some of those items are already partially present on the live site and need governance rather than new feature work.

## Outdated Decisions

- `docs/ASTRO_STATIC_FOUNDATION.md` still reads as if Phase 1 outcome alone establishes the practical content baseline; that is incomplete after the reconciliation audits.
- `docs/CURRENT_STATE.md` treats counts like 150/117/113 as settled state, but the live and WordPress audits show those numbers are only valid within the candidate dataset and must not be mistaken for final canonical approval.
- `docs/DECISIONS.md` is still broadly valid, but the decision that “static foundation” means “launch-ready” is outdated.
- Any wording that suggests the current live site is fully clean or fully migrated is outdated.

## Superseded Guidance

- Legacy Next.js-only implementation guidance is superseded by the Astro foundation work.
- Any direction to preserve public login, comments, or transaction surfaces in Phase 1 is superseded by the static foundation and quality standards.
- Any instruction that implies WordPress content should be copied wholesale without reconciliation is superseded by the source review outputs.
- Any guidance that treats the current production site as canonical without exception is superseded by the special-case and corruption findings.

## Duplicate Documentation

- `docs/CURRENT_STATE.md`, `docs/ASTRO_STATIC_FOUNDATION.md`, and `docs/CHANGELOG.md` overlap heavily and should not all remain as equal-status summaries.
- `docs/DECISIONS.md` and `docs/SITE_QUALITY_STANDARDS.md` both capture policy; the standards doc should be the primary policy reference and the decisions doc should only hold durable ADR-style decisions.
- `docs/CONTENT_PARITY_AUDIT.md`, `docs/WORDPRESS_CONTENT_AUDIT.md`, `docs/LIVE_SITE_VALIDATION_AUDIT.md`, `docs/ORIGINAL_SOURCE_RECONCILIATION.md`, and `docs/INDUCTEE_RECONCILIATION_REVIEW.md` are all useful evidence, but they overlap enough that the master status doc should be the user-facing summary layer.

## Keep / Archive / Merge

### Keep

- `docs/JRHOF_MASTER_STATUS.md`
- `docs/SITE_QUALITY_STANDARDS.md`
- `docs/CONTENT_MODEL.md`
- `docs/ORIGINAL_SOURCE_RECONCILIATION.md`
- `docs/LIVE_SITE_VALIDATION_AUDIT.md`
- `docs/INDUCTEE_RECONCILIATION_REVIEW.md`

### Keep as durable decisions

- `docs/DECISIONS.md`

### Keep as implementation history, but do not treat as authoritative status

- `docs/ASTRO_STATIC_FOUNDATION.md`
- `docs/CURRENT_STATE.md`
- `docs/NEXT_PHASES.md`
- `docs/CHANGELOG.md`

### Archive after merging or if you want a leaner docs surface

- `docs/CONTENT_PARITY_AUDIT.md`
- `docs/WORDPRESS_CONTENT_AUDIT.md`
- `docs/JRHOF_REPO_AUDIT.md`

### Merge guidance

- Merge the narrative status content from `docs/CURRENT_STATE.md`, `docs/ASTRO_STATIC_FOUNDATION.md`, and `docs/NEXT_PHASES.md` into this master status document.
- Keep `docs/SITE_QUALITY_STANDARDS.md` as the policy baseline, but reference it from this master document instead of repeating the full standard set elsewhere.
- Use the audit docs as supporting evidence, not as competing “current state” documents.

## Bottom Line

- The Astro foundation is real and static.
- The live site still has important content and governance defects.
- The source reconciliation materially improved confidence, but it did not produce final canonical approvals.
- `docs/JRHOF_MASTER_STATUS.md` should be the single place to check project status until the open issues and blockers above are resolved.
