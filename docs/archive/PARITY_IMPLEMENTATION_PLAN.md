# JRHOF Parity Implementation Plan

This plan intentionally excludes payment, registration, form, analytics, Worker, D1, redirect, and deployment implementation.

## Phase A — Shared layout fixes only

1. Preserve and regression-test the existing flex sticky footer.
2. Replace giant inner-page/page-bio heroes with a compact production-like title treatment.
3. Remove giant-wrapper and fragmented-card extremes: use one restrained content panel where production uses one flow.
4. Normalize inner-page width, vertical rhythm, heading scale, background transparency, borders, radius, and shadows against the homepage/production visual language.
5. Validate desktop and 320/390/768 px mobile layouts before page-specific changes.

**Acceptance:** About, Events, Donate, Contact, archive, and bios visibly belong to the same site as the homepage; short pages keep the footer at the viewport bottom.

## Phase B — Inductee archive and biography formatting

1. Restore production-like tall archive portraits and quieter card spacing while retaining all 150 links and Astro search.
2. Replace the alternate blue pending-review SVG with one canonical production-familiar missing-inductee image for all 33 unresolved portraits.
3. Update missing-image alt behavior so it does not assert a portrait identity.
4. Simplify biography title/class/portrait/body structure and constrain prose to 65–75ch.
5. Restore paragraph boundaries for Dan Weikle, Julius Carabello, Robert Schnabel, and Warren Kettner.
6. Remove all public source/migration-lane notes.
7. Make pending/review/alias presentation subtle; gate unresolved records editorially where appropriate.
8. Obtain a board decision for Gene Rozzelle/Rozelle and the 33-record review queue.

**Acceptance:** 150 routes build; 150 archive links work; no person-specific missing file is treated as a portrait; no internal editorial language is public.

## Phase C — Page-specific parity fixes

### About

Restore production's linear topic sequence and familiar panel rhythm. Retain corrected/verified wording, but remove public “pending” governance scaffolding and do not assert unverified scholarship/impact claims.

### Events

Use production-like event information hierarchy and approved imagery. Keep comments, shares, login UI, and stale transactional CTAs removed.

### Golf

Consolidate duplicate pre/post support content, reduce the hero/card treatment, and present one approved current status/registration CTA. Preserve valid date/time/fee/location and safe post-event switching.

### Banquet

Present it clearly as a concluded archive, preserve the three inductee links, and keep the broken time, expired hotel/price details, countdown, and Eventbrite CTAs removed.

### Donate

Simplify to mission, approved use of funds, approved legal/tax/receipt/contact facts, and one future native checkout location. Remove the Sponsor CTA until packages are approved.

### Contact

Restore familiar copy/image hierarchy without collecting data until an approved delivery/privacy workflow exists. Once approved, expose one clear contact path rather than multiple “coming later” notices.

## Phase D — Deferred functionality

- Native registration and event state management.
- Native Stripe donation checkout, receipts, refunds/cancellations, and approved tax language.
- Sponsor packages, fulfillment, ownership, and payment/inquiry workflow.
- Contact/newsletter delivery, consent, retention, spam controls, and unsubscribe behavior.
- Analytics and Google Ad Grants after consent/privacy decisions.

## Recommended sequence

Phase A first, then Phase B as a single archive/template pass. Phase C should follow after visual tokens stabilize. Phase D remains a separate architecture/operations project and must not block parity cleanup.

## Validation checklist

- Compare production/Astro screenshots at desktop and 390 px for every listed route.
- Build all 150 biographies and verify canonical title/class/portrait/body output.
- Confirm counts in the parity CSVs remain aligned with `src/data/inductees.json`.
- Verify no login, comments, shares, stale countdown, broken banquet time, or internal migration note appears.
- Verify footer placement on 404, Terms, Privacy, Contact, pending biography, and other short pages.
- Run `npm run build` and `npm run validate` with no implementation changes on this branch.
