# JRHOF Project Control

**Control date:** June 29, 2026

**Baseline branch:** `main`

**Baseline commit reviewed for this control update:** `7d4f25c` (`Ignore archived golf tournament photo drops`)

This document is the implementation control point for the JRHOF rebuild. It does not replace [JRHOF_MASTER_STATUS.md](JRHOF_MASTER_STATUS.md), which remains the authoritative status summary. Use this document to decide whether proposed work is aligned, approved, and sequenced correctly.

The commit above records the accepted `main` baseline when this control layer was created. Verify and deliberately update it whenever a later baseline is approved.

## Current authoritative status

- Status authority: [JRHOF_MASTER_STATUS.md](JRHOF_MASTER_STATUS.md).
- End-state authority: [LAUNCH_VISION.md](LAUNCH_VISION.md).
- Repository source-of-truth notes: [REPO_GOVERNANCE.md](REPO_GOVERNANCE.md).
- Implementation constraints: [IMPLEMENTATION_GUARDRAILS.md](IMPLEMENTATION_GUARDRAILS.md) and [SITE_QUALITY_STANDARDS.md](SITE_QUALITY_STANDARDS.md).
- Durable architecture decisions: [DECISIONS.md](DECISIONS.md).
- Inductee data invariants: [CONTENT_MODEL.md](CONTENT_MODEL.md).
- Documentation precedence and classification: [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md).

If documents conflict, stop and resolve the conflict in the higher-authority document before implementation. Audit findings and historical plans are evidence, not permission to change the site.

## Deployment note

- The intended production host is Cloudflare Pages under the JR and Associates account.
- `jrhof.org` is the canonical public host.
- The checked-in Wrangler configuration is Worker-oriented and must not be treated as the Pages source of truth until it is reconciled with the dashboard project.

## Considered done

At the baseline commit, the following are completed foundations:

- Astro static site foundation and route coverage.
- Production-familiar homepage direction and the inner-page parity implementation pass.
- Static About, Inductees, Events, Donate, Sponsor, Contact, policy, and 404 surfaces.
- A 150-record inductee candidate archive with generated biography routes and validation guardrails.
- Removal of public WordPress login, registration, comments, sharing, and plugin clutter from the Astro experience.
- Exclusion of native transaction storage, D1, webhooks, and server-side registration from the static/parity phases. Dashboard-managed Web Analytics and GA4 through Zaraz are now active platform configuration.
- A shared Astro page surface standard for core public routes, plus board-review-ready Contact, Donate, Privacy Policy, and Terms content that uses EIN 33-1883765 as a public trust signal without adding unapproved tax, receipt, refund, or payment-processing claims.

“Done” here means implemented as the current baseline. It does not mean every record is board-approved, every launch requirement is satisfied, or every future operational workflow exists.

## Not launch-ready

- Canonical content approval remains open, including incomplete biographies, unresolved portraits, and identity-sensitive records identified in the master status.
- Robert Schnabel’s live WordPress biography must never be reused; the reconciled original source remains the safe source.
- Gene Rozelle/Rozzelle spelling, visibility, and redirect handling need an approved final decision.
- Canonical URL and redirect governance is not approved for cutover.
- Mobile, accessibility, SEO, metadata, legal/privacy, and launch QA require final acceptance against the actual release candidate.
- Native donations, sponsorships, banquet registration, golf registration, contact delivery, receipts, refunds/cancellations, and spam controls are not approved production systems. The Contact form is review-ready only and does not send messages until an approved backend and email provider are implemented. Donate uses Stripe as the intended payment platform only when approved Stripe URLs are supplied through public environment variables.
- Analytics is active, but ownership, consent, event validation, and reporting governance still require operational review. Pages configuration, rollback, and support procedures also need reconciliation.

## Approval-controlled surfaces

Do not change the following without explicit approval for the specific work:

- Homepage structure or visual direction.
- Public navigation, routes, canonical URLs, redirects, or launch-domain behavior.
- Inductee roster count, identities, names, biographies, portraits, aliases, publication states, or validation rules.
- Public legal, tax-deductibility, receipt, privacy, terms, scholarship, sponsorship, or organizational claims.
- Donation, sponsorship, banquet, golf, payment, refund, contact, newsletter, analytics, or advertising behavior.
- Stripe, Eventbrite, Workers, D1, forms, webhooks, secrets, third-party scripts, Cloudflare configuration, or deployment automation.
- The documentation hierarchy or any document marked authoritative.
- The Inductees archive should keep the improved searchable/card-based UX and class-year labeling even when its wrapper is refreshed to match the production visual rhythm more closely.

## Event lifecycle governance

- Public event content should use the states `save-the-date`, `registration open`, `active/upcoming`, `completed`, `photos pending`, `gallery live`, and `archived` as appropriate.
- The Layer 1 event archive uses a lightweight typed record in `src/data/events.ts`. Records are intentionally partial and may expand only as dates, inductees, programs, flyers, photographs, and source material are verified.
- The public archive routes are `/events/archive/`, `/events/banquet-archive/`, and `/events/golf-archive/`. They are structural archive entry points, not evidence that all historical media or documents have been digitized.
- Historical banquet programs and flyers remain pending scan/upload. The 2024 golf gallery currently uses optimized local derivatives; other source galleries still require reviewed migration.
- The approved Eventbrite registration and Stripe raffle, mulligan, and donation URLs are temporary external links for the June 27, 2026 Umpire’s Cup IV. They do not authorize native registration, payment storage, fulfillment, analytics, webhooks, or database work.
- The 2026 induction banquet is completed and its photographs are pending. Its public page is a recap, not a registration page.
- February 6, 2027 is a tentative induction-banquet date until JRHOF confirms it; no registration or detailed event claims should be published before approval.
- The 2024 gallery UI is implemented. Moving its optimized derivatives to the approved R2 media domain remains deferred. Do not bulk-import full-size WordPress or event originals into the repository.
- Native registration/payment, Stripe Checkout, D1, webhooks, event analytics, and media-storage work remain deferred and are not implied by the archive data model.
- Time-sensitive `Event` schema remains deferred until event-state ownership and a reliable publish/rebuild process are established.

## Next approved work sequence

Work should proceed in separate, reviewable branches and must not skip approval gates:

1. **Content and archive decisions:** resolve the board-review queue, incomplete biographies, portrait decisions, identity-sensitive records, and Gene naming. Preserve all 150 records and existing validation protections.
2. **Release-candidate quality closure:** verify production-familiar visual rhythm, mobile behavior, accessibility, public-copy cleanliness, and all 150 archive/detail routes.
3. **URL, SEO, and legal governance:** approve canonical URLs, redirects, metadata/schema priorities, legal/privacy language, and Google Ad Grants prerequisites before implementation.
4. **Security and operational requirements:** define owners, policies, fulfillment, support, data retention, receipts, refunds/cancellations, fraud/spam controls, secrets, and reporting for each future workflow.
5. **Native workflows, one at a time:** implement donations, sponsorships, banquet registration, golf registration, and contact/newsletter only after the relevant requirements are approved. Keep each workflow independently reviewable and server-verified.
6. **Launch engineering:** reconcile the stated Pages architecture with the live project and Worker-oriented repository config; verify security headers, monitoring, rollback, analytics/consent, and cutover ownership.

The recommended next implementation branch is `codex/inductee-content-resolution`, limited to approved content and media decisions. If approvals are not yet available, the next branch should remain documentation/review-only rather than guessing at public content.
