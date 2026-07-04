# Banquet Registration

## Current status

Phase 1 is a preview-only implementation on `feature/banquet-registration-checkout`. It does not create Checkout Sessions, accept payments, write to D1, export CSV files, or change the production Worker configuration.

The final registration experience belongs on the existing 2027 event page:

`/events/induction-banquet/2027-hall-of-fame-induction-banquet/`

No separate permanent registration route is planned. No navigation, homepage, Events page, sitemap, or robots entry points are being added.

## Target architecture

```text
Existing Astro event page
  -> POST /api/banquet/checkout
  -> Cloudflare Worker validates the request and authoritative D1 event config
  -> D1 pending reservation + attendee rows
  -> Stripe Checkout Session (test mode in preview)
  -> POST /api/webhooks/stripe verifies Stripe signature and amount
  -> D1 server-verified payment state
  -> authenticated, server-generated CSV export
```

The browser is never authoritative for price, capacity, registration status, attendee count, donation limits, payment state, or Stripe identifiers. Card data is collected only by Stripe Checkout and must never pass through JRHOF forms, Worker logs, or D1.

## Preview-only rules

- Local `npm run dev` may render the draft UI for review.
- A static build renders the draft only when `BANQUET_REGISTRATION_PREVIEW=true` is present at build time.
- The ticket price is a preview display input, provided as integer cents through `BANQUET_PREVIEW_TICKET_PRICE_CENTS`. It defaults to `0` (price pending) and is not an approved or server-authoritative price.
- Phase 1 makes no registration API request. Its review action only runs browser validation and confirms that no data was sent.
- Production builds must omit `BANQUET_REGISTRATION_PREVIEW` or set it to `false` until board approval and all launch gates are complete.
- Preview resources must use Stripe test mode and an isolated preview D1 database. Preview builds must never receive live Stripe secrets or production write bindings.
- No DNS, route, custom-domain, or production deployment changes are part of this phase.

Example local review with an illustrative, non-approved `$85.00` display price:

```bash
BANQUET_PREVIEW_TICKET_PRICE_CENTS=8500 npm run dev
```

Example static preview build:

```bash
BANQUET_REGISTRATION_PREVIEW=true BANQUET_PREVIEW_TICKET_PRICE_CENTS=8500 npm run build
```

## Phase 1 form model

- Purchaser/contact name
- Email
- Phone
- One to eight attendees
- Full name and meal choice (`chicken` or `steak`) for each attendee
- Optional seating/table notes
- Optional donation amount
- Ticket subtotal and total, calculated in the browser for preview only

Client-side validation improves the review experience, but the future Worker must repeat and strengthen every validation rule before creating any reservation or Stripe Checkout Session.

## Proposed data model

The unapplied SQL under `migrations/proposed/` defines:

- `banquet_reservations`: contact details, attendee count, integer-cent expected amounts, Stripe identifiers, and server-controlled lifecycle state.
- `banquet_attendees`: one ordered attendee row per reservation, with full name and constrained meal choice.

These are planning migrations only. No D1 binding exists in `wrangler.jsonc`, and no migration has been run against any Cloudflare database.

## API and Worker boundary

Phase 1 preserves the asset-only Worker. The proposed API contract lives in `workers/banquet-registration/README.md`; it is documentation, not a deployed Worker entrypoint. Adding an entrypoint and `assets.run_worker_first` behavior is deferred until Phase 2 so this branch cannot alter current static request handling.

The future Worker must:

- validate and normalize all fields server-side;
- load ticket price, capacity, meal options, registration window, and donation bounds from authoritative server configuration;
- calculate all amounts in integer cents and ignore client totals;
- create the pending D1 reservation before redirecting to Checkout;
- use opaque server-generated IDs in Stripe metadata, never attendee/contact PII;
- create only Stripe test-mode Checkout Sessions in preview;
- verify webhook signatures against the raw request body;
- make webhook processing idempotent by Stripe event ID;
- compare Stripe amounts/currency/metadata with D1 before marking a reservation paid;
- generate CSV exports from server-verified D1 state only and protect them with approved authentication.

## Launch gates

Registration must remain hidden until all of the following are approved and verified:

1. Board approval of ticket price, capacity, registration dates, meal options, donation bounds, and public copy.
2. Board-approved refund, cancellation, receipt, privacy, retention, and operational ownership rules. The UI must not infer or invent them.
3. Separate preview and production D1 databases, with reviewed migrations, backups, and rollback/recovery procedures.
4. Preview-only Stripe test secrets stored as Worker secrets; no secrets committed to Git.
5. Server-side request validation, authoritative pricing/capacity checks, abuse controls, and safe error handling.
6. Stripe webhook signature verification, idempotency, amount reconciliation, replay tests, and failure alerts.
7. Authenticated CSV export with escaping/formula-injection defenses and an approved data-retention policy.
8. End-to-end test-mode review covering success, cancel, expiry, duplicate webhook, amount mismatch, and capacity races.
9. Privacy and security review confirming that no card data is stored and PII is minimized and access-controlled.
10. Explicit approval to enable the registration section on the existing 2027 event page.

## Next steps

Phase 2 should add an isolated, test-mode Worker API and local/preview D1 wiring without enabling production registration. It should implement server validation, authoritative event configuration, pending reservation creation, Stripe Checkout Session creation, signed/idempotent webhook handling, and tests. CSV export can follow once payment-state verification and admin authentication are established.

Before production launch, the temporary preview guard must be removed or converted into an approved server-controlled registration-state check on the same 2027 event page. Any temporary preview-only files or configuration must be removed or repurposed.

## Implementation log

- 2026-07-04 — Step 0: synchronized local `main` with `origin/main` at `696e7e6`, created `feature/banquet-registration-checkout`, documented the Phase 1 safety boundary, architecture, preview rules, and launch gates before implementation.
- 2026-07-04 — Step 1: added the guarded form component to the existing 2027 event renderer. It supports purchaser/contact fields, one to eight named attendees with chicken/steak choices, seating notes, an optional donation, integer-cent preview totals, accessible client validation, and a no-network review action. Added typed build-time preview variables and safe zero-price defaults; production rendering remains off by default.
- 2026-07-04 — Step 2: added two explicitly unapplied D1 planning migrations for `banquet_reservations` and `banquet_attendees`. They constrain attendee count and meal values, store money as integer cents, enforce internal expected-total arithmetic, require a verification timestamp for paid state, and reserve Stripe identifiers without introducing a D1 binding or changing Worker configuration.
- 2026-07-04 — Step 3: added a documentation-only Worker/API contract covering test-mode Checkout creation, raw-body webhook verification, idempotent and amount-verified state transitions, authenticated CSV export, PII boundaries, and narrow future Static Assets routing. No Worker entrypoint or runtime configuration was added.
- 2026-07-04 — Step 4: indexed the implementation guide in the active documentation map and recorded the preview-only addition in the changelog. Public navigation and event content remain unchanged.
- 2026-07-04 — Step 5: added a foundation-validation guard that fails a production-default build if the preview heading appears in generated public HTML. Verified browser behavior for attendee expansion, ticket/donation totals, required-field and success states, and a mobile-width layout without horizontal overflow.
- 2026-07-04 — Step 6: validated both build modes. `npm run check`, the production-default `npm run build`, and `npm run validate` pass; the default build omits the draft and its preview flag. An explicitly enabled preview build renders the draft on exactly the existing 2027 banquet page. Both proposed migrations parse successfully together in SQLite/D1-compatible syntax, and `git diff --check` passes.
