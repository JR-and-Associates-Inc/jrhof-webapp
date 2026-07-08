# Banquet Registration Board and Staff Review Checklist

This checklist is a launch gate, not approval language. Leave registration hidden until every required owner records an explicit decision. A blank or uncertain item is a no-go.

## Board decisions

- [ ] Approve event identity, date/time, venue, public registration opening/closing dates, and capacity.
- [ ] Approve ticket price, included benefits, meal choices, attendee maximum, donation bounds, and all public copy.
- [ ] Approve refund and cancellation policies in writing; do not infer them from Checkout behavior.
- [ ] Approve receipt wording and delivery ownership; do not imply tax deductibility unless separately authorized in approved language.
- [ ] Approve privacy notice, data fields collected, data-retention period, deletion process, and who may access registrant PII.
- [ ] Approve how seating requests, accessibility needs, dietary questions, payment disputes, refunds, and event changes are handled.
- [ ] Approve separate preview/production Stripe and D1 ownership, backup/recovery expectations, and reconciliation responsibility.
- [ ] Explicitly approve enabling registration on the existing 2027 banquet event page; no competing permanent route is permitted.

## Staff operational review

- [ ] Name a primary operator and backup operator for registration, payment reconciliation, capacity monitoring, and incident response.
- [ ] Confirm least-privilege access to Stripe and D1; document access removal when staff roles change.
- [ ] Confirm no card data enters the JRHOF form, Worker, logs, D1, screenshots, CSV files, or support notes.
- [ ] Confirm Stripe metadata contains only opaque event/reservation IDs and no purchaser or attendee PII.
- [ ] Confirm staff can identify `payment_review`, failed Checkout creation, webhook signature failures, replay conflicts, and capacity exhaustion without viewing raw request bodies.
- [ ] Confirm a support/escalation path for a purchaser whose payment state and reservation state disagree.
- [ ] Confirm retention/deletion operations and audit ownership before any production/admin CSV export is implemented; apply interim approved handling to preview CLI exports.
- [ ] Complete keyboard, screen-reader, mobile, validation-message, and contrast review of the guarded UI.
- [ ] Complete the Stripe test-mode E2E procedure on the candidate commit using synthetic information only.

## Technical evidence

- [ ] Production-default build omits the draft heading and preview flag.
- [ ] The enabled preview appears only on `/events/induction-banquet/2027-hall-of-fame-induction-banquet/`.
- [x] The 2026-07-05 owner decision permits the unlinked feature Workers URL without Cloudflare Access only while it remains UI-only with no PII, secrets, admin routes, production D1, or write-capable bindings; Access is required before any of those are introduced.
- [ ] Production `wrangler.jsonc`, DNS, routes, domains, navigation, homepage, Events page, sitemap, and robots remain unchanged.
- [ ] No live Stripe secret, production D1 binding, or promoted production migration exists in the branch; the remote D1 ID is preview-only.
- [ ] Server validation, authoritative integer-cent pricing, capacity reservation, signed webhook processing, idempotency, replay conflict, amount/currency/metadata reconciliation, expiry, and livemode rejection tests pass.
- [ ] Request-size limits, checkout rate limiting, safe errors, request IDs, and PII-free structured logging are verified.
- [ ] Proposed migrations remain under `migrations/proposed/`; any remote application is limited to the isolated preview D1 database.
- [ ] `npm run check`, `npm run build`, `npm run validate`, Worker tests, local migration validation, Wrangler dry-run, leak check, and `git diff --check` pass on the candidate commit.

## Deferred and prohibited until separately approved

- [ ] No production/admin CSV export is implemented until authentication, authorization, audit logging, and retention requirements are approved. The preview-only Wrangler CLI export remains restricted to authorized Cloudflare operators.
- [ ] Email sending remains unimplemented until provider, sender identity, templates, consent, delivery, and operational ownership are approved.
- [ ] No deployment, live secret, public registration exposure, production migration, DNS/domain/route change, or merge to `main` has occurred.

## Decision record

- Candidate commit:
- Board decision and date:
- Staff operations decision and date:
- Privacy/security reviewer and date:
- Technical reviewer and date:
- Remaining blockers:
- Explicit go/no-go decision:
