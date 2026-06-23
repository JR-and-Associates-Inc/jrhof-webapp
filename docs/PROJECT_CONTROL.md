# JRHOF Project Control

**Control date:** June 23, 2026

**Baseline branch:** `main`

**Baseline commit:** `4d44143d8f47d688699440d0a3cf1dc17a14d444` (`Restore JRHOF production parity across inner pages`)

This document is the implementation control point for the JRHOF rebuild. It does not replace [JRHOF_MASTER_STATUS.md](JRHOF_MASTER_STATUS.md), which remains the authoritative status summary. Use this document to decide whether proposed work is aligned, approved, and sequenced correctly.

The commit above records the accepted `main` baseline when this control layer was created. Verify and deliberately update it whenever a later baseline is approved.

## Current authoritative status

- Status authority: [JRHOF_MASTER_STATUS.md](JRHOF_MASTER_STATUS.md).
- End-state authority: [LAUNCH_VISION.md](LAUNCH_VISION.md).
- Implementation constraints: [IMPLEMENTATION_GUARDRAILS.md](IMPLEMENTATION_GUARDRAILS.md) and [SITE_QUALITY_STANDARDS.md](SITE_QUALITY_STANDARDS.md).
- Durable architecture decisions: [DECISIONS.md](DECISIONS.md).
- Inductee data invariants: [CONTENT_MODEL.md](CONTENT_MODEL.md).
- Documentation precedence and classification: [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md).

If documents conflict, stop and resolve the conflict in the higher-authority document before implementation. Audit findings and historical plans are evidence, not permission to change the site.

## Development deployment note

- The GitHub repository is connected to Cloudflare Workers.
- The current development URL is [jrhof-webapp.tmco-consulting.workers.dev](https://jrhof-webapp.tmco-consulting.workers.dev).
- Do not treat this URL as production. Production remains [jrhof.org](https://jrhof.org/) until formal cutover.

## Considered done

At the baseline commit, the following are completed foundations:

- Astro static site foundation and route coverage.
- Production-familiar homepage direction and the inner-page parity implementation pass.
- Static About, Inductees, Events, Donate, Sponsor, Contact, policy, and 404 surfaces.
- A 150-record inductee candidate archive with generated biography routes and validation guardrails.
- Removal of public WordPress login, registration, comments, sharing, and plugin clutter from the Astro experience.
- Exclusion of native transactions, Workers, D1, forms, analytics, and deployment work from the static/parity phases.
- A shared Astro page surface standard for core public routes, plus board-review-ready Contact, Donate, Privacy Policy, and Terms content that uses EIN 33-1883765 as a public trust signal without adding unapproved tax, receipt, refund, or payment-processing claims.

“Done” here means implemented as the current baseline. It does not mean every record is board-approved, every launch requirement is satisfied, or every future operational workflow exists.

## Not launch-ready

- Canonical content approval remains open, including incomplete biographies, unresolved portraits, and identity-sensitive records identified in the master status.
- Robert Schnabel’s live WordPress biography must never be reused; the reconciled original source remains the safe source.
- Gene Rozelle/Rozzelle spelling, visibility, and redirect handling need an approved final decision.
- Canonical URL and redirect governance is not approved for cutover.
- Mobile, accessibility, SEO, metadata, legal/privacy, and launch QA require final acceptance against the actual release candidate.
- Native donations, sponsorships, banquet registration, golf registration, contact delivery, receipts, refunds/cancellations, spam controls, analytics, and operational ownership are not approved production systems. The Contact form is review-ready only and does not send messages until an approved backend and email provider are implemented. Donate uses Stripe as the intended payment platform only when approved Stripe URLs are supplied through public environment variables.
- Cloudflare runtime, security headers, monitoring, deployment, rollback, and support procedures are not established as a launch package.

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

## Next approved work sequence

Work should proceed in separate, reviewable branches and must not skip approval gates:

1. **Content and archive decisions:** resolve the board-review queue, incomplete biographies, portrait decisions, identity-sensitive records, and Gene naming. Preserve all 150 records and existing validation protections.
2. **Release-candidate quality closure:** verify production-familiar visual rhythm, mobile behavior, accessibility, public-copy cleanliness, and all 150 archive/detail routes.
3. **URL, SEO, and legal governance:** approve canonical URLs, redirects, metadata/schema priorities, legal/privacy language, and Google Ad Grants prerequisites before implementation.
4. **Operational requirements:** define owners, policies, fulfillment, support, data retention, receipts, refunds/cancellations, fraud/spam controls, and reporting for each future workflow.
5. **Native workflows, one at a time:** implement donations, sponsorships, banquet registration, golf registration, and contact/newsletter only after the relevant requirements are approved. Keep each workflow independently reviewable and server-verified.
6. **Launch engineering:** approve Cloudflare architecture, deployment, security headers, monitoring, rollback, analytics/consent, and cutover only after the release candidate and operational workflows are accepted.

The recommended next implementation branch is `codex/inductee-content-resolution`, limited to approved content and media decisions. If approvals are not yet available, the next branch should remain documentation/review-only rather than guessing at public content.
