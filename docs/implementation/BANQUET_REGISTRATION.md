# Banquet Registration

## Current status

Phase 2 is implemented for local preview and automated test use on `feature/banquet-registration-checkout`. It can create Stripe test-mode Checkout Sessions and write to local D1 only when the separate preview Worker is intentionally started with test secrets. It does not accept live payments, export CSV files, deploy a Worker, or change the production Worker configuration.

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
- The guarded form calls the local preview API only after browser validation. The Worker repeats validation, ignores browser totals, and rejects non-test Stripe keys.
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

Local full-stack preview sequence (never use live keys):

```bash
cp .dev.vars.example .dev.vars
npm run banquet:db:migrate
BANQUET_REGISTRATION_PREVIEW=true BANQUET_PREVIEW_TICKET_PRICE_CENTS=8500 npm run build
npx wrangler dev --local --config wrangler.banquet-preview.jsonc
```

The copied `.dev.vars` file is ignored by Git. The proposed migrations apply only to Wrangler's local D1 state unless an operator adds `--remote`, which is prohibited before board approval.

## Registration form model

- Purchaser/contact name
- Email
- Phone
- One to eight attendees
- Full name and meal choice (`chicken` or `steak`) for each attendee
- Optional seating/table notes
- Optional donation amount
- Ticket subtotal and total, calculated in the browser for preview only

Client-side validation improves the review experience. The local preview Worker independently repeats and strengthens validation before creating a reservation or Stripe Checkout Session; browser totals are never authoritative.

## Proposed data model

The local-preview-only SQL under `migrations/proposed/` defines:

- `banquet_events`: authoritative preview event state, integer-cent ticket price, capacity, currency, donation bounds, and Checkout lifetime.
- `banquet_reservations`: contact details, attendee count, integer-cent expected amounts, Stripe identifiers, and server-controlled lifecycle state.
- `banquet_attendees`: one ordered attendee row per reservation, with full name and constrained meal choice.
- `banquet_webhook_events`: Stripe event IDs and payload digests for idempotency, plus a separate mismatch-alert table.

These remain proposed migrations. They are bound only by `wrangler.banquet-preview.jsonc` and have been exercised in ephemeral/local D1; no migration has run against a remote Cloudflare database, and no D1 binding exists in production `wrangler.jsonc`.

## API and Worker boundary

Phase 2 adds an entrypoint only to the separate `wrangler.banquet-preview.jsonc`. Its selective Worker-first rules cover the two banquet API paths, while all other requests pass to static assets. The production `wrangler.jsonc` remains asset-only and unchanged.

The local preview Worker now:

- validate and normalize all fields server-side;
- load ticket price, capacity, meal options, registration window, and donation bounds from authoritative server configuration;
- calculate all amounts in integer cents and ignore client totals;
- create the pending D1 reservation before redirecting to Checkout;
- use opaque server-generated IDs in Stripe metadata, never attendee/contact PII;
- create only Stripe test-mode Checkout Sessions in preview;
- verify webhook signatures against the raw request body;
- make webhook processing idempotent by Stripe event ID;
- compare Stripe amounts/currency/metadata with D1 before marking a reservation paid;
- defers CSV export until approved authentication and retention rules exist.

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

Phase 3 should perform an intentional Stripe test-mode end-to-end review using temporary preview credentials, add request abuse controls, decide the approved authentication/authorization boundary for CSV export, and document data retention before implementing export. Proposed migrations must stay local-only until the board approves the workflow and retention requirements.

Before production launch, the temporary preview guard must be removed or converted into an approved server-controlled registration-state check on the same 2027 event page. Any temporary preview-only files or configuration must be removed or repurposed.

## Implementation log

- 2026-07-04 — Step 0: synchronized local `main` with `origin/main` at `696e7e6`, created `feature/banquet-registration-checkout`, documented the Phase 1 safety boundary, architecture, preview rules, and launch gates before implementation.
- 2026-07-04 — Step 1: added the guarded form component to the existing 2027 event renderer. It supports purchaser/contact fields, one to eight named attendees with chicken/steak choices, seating notes, an optional donation, integer-cent preview totals, accessible client validation, and a no-network review action. Added typed build-time preview variables and safe zero-price defaults; production rendering remains off by default.
- 2026-07-04 — Step 2: added two explicitly unapplied D1 planning migrations for `banquet_reservations` and `banquet_attendees`. They constrain attendee count and meal values, store money as integer cents, enforce internal expected-total arithmetic, require a verification timestamp for paid state, and reserve Stripe identifiers without introducing a D1 binding or changing Worker configuration.
- 2026-07-04 — Step 3: added a documentation-only Worker/API contract covering test-mode Checkout creation, raw-body webhook verification, idempotent and amount-verified state transitions, authenticated CSV export, PII boundaries, and narrow future Static Assets routing. No Worker entrypoint or runtime configuration was added.
- 2026-07-04 — Step 4: indexed the implementation guide in the active documentation map and recorded the preview-only addition in the changelog. Public navigation and event content remain unchanged.
- 2026-07-04 — Step 5: added a foundation-validation guard that fails a production-default build if the preview heading appears in generated public HTML. Verified browser behavior for attendee expansion, ticket/donation totals, required-field and success states, and a mobile-width layout without horizontal overflow.
- 2026-07-04 — Step 6: validated both build modes. `npm run check`, the production-default `npm run build`, and `npm run validate` pass; the default build omits the draft and its preview flag. An explicitly enabled preview build renders the draft on exactly the existing 2027 banquet page. Both proposed migrations parse successfully together in SQLite/D1-compatible syntax, and `git diff --check` passes.
- 2026-07-04 — Step 7: committed Phase 1 as `7bd91d0`, pushed `feature/banquet-registration-checkout`, and repeated the production-default build-leak check before starting Worker code. The committed default build contains neither the draft heading nor its preview flag.
- 2026-07-04 — Step 8: added `wrangler.banquet-preview.jsonc` as a separate local-only Worker configuration with no routes, no preview URL, no deploy action, a local D1 binding pointed at `migrations/proposed`, and Worker-first execution limited to the checkout and Stripe webhook paths. The production `wrangler.jsonc` remains unchanged. Added current Stripe and Workers-runtime test dependencies plus local-only type, test, and migration scripts.
- 2026-07-04 — Step 9: revised only the proposed/local migration set. Added a `preview_unapproved` event-config fixture, strengthened reservations/attendees as SQLite `STRICT` tables, added a checkout-failure state and verified paid amount, and added webhook idempotency plus payment-alert tables that store a payload digest instead of raw Stripe payloads. No migration moved into a production directory or ran against a remote database.
- 2026-07-04 — Step 10: generated binding/runtime types from the local preview config and separated strict Worker typechecking from Astro DOM typechecking to prevent platform-global namespace collisions. `npm run check` now runs both the existing Astro check and the isolated Worker TypeScript project.
- 2026-07-04 — Step 11: added Workers-runtime integration tests backed by the local D1 binding and the full proposed migration sequence. Stripe session creation is injected at the network boundary, while Stripe webhook signature verification uses the real async SDK/Web Crypto implementation. Tests cover malformed JSON, 1–8 attendee limits, meal allowlisting, donation bounds, client-total tampering, capacity exhaustion, paid reconciliation, duplicate webhook IDs, amount mismatch review, session expiry, and livemode rejection.
- 2026-07-04 — Step 12: connected the already-hidden form to the same-origin preview checkout endpoint. The browser sends contact, attendee, meal, seating, and donation inputs—but no ticket price, subtotal, total, capacity, or payment state—and accepts only an HTTPS `checkout.stripe.com` redirect URL. Added a test-only `.dev.vars.example`; copied secrets remain ignored, and the Worker rejects live Stripe keys.
- 2026-07-04 — Step 13: completed the correctness pass after connecting the UI. The Worker now returns a service-unavailable response for preview-runtime misconfiguration, rejects a live-mode Checkout Session even inside a test-mode event envelope, and uses a one-hour preview Checkout lifetime to avoid the provider's minimum-expiry boundary. Added the corresponding livemode-session test and replaced stale Phase 1/future-Worker documentation with the implemented local-preview contract.
- 2026-07-04 — Step 14: validated the complete local-preview implementation. `npm run check`, production-default and explicitly enabled preview builds, `npm run validate`, and all 17 Workers-runtime tests pass. Wrangler applied all four proposed migrations to isolated local D1 and bundled the preview Worker with `--dry-run`; no remote operation or deployment occurred. The enabled draft appears only inside the existing 2027 event page, while the final production-default build contains neither the draft heading nor preview flag. `wrangler.jsonc` remains unchanged.
