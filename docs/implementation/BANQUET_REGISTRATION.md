# Banquet Registration

## Current status

Phase 3 is implemented for local preview and automated test use on `feature/banquet-registration-checkout`. It adds bounded requests, a coarse preview-only checkout limiter, PII-free structured observability, safer API responses, altered-replay detection, a Stripe test-mode E2E procedure, and board/staff review gates. It can create Stripe test-mode Checkout Sessions and write to local D1 only when the separate preview Worker is intentionally started with test secrets. It does not accept live payments, export CSV files, deploy a Worker, or change production Worker behavior.

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

- validates and normalizes all fields server-side;
- bounds checkout and webhook bodies before buffering or parsing;
- rate-limits preview checkout attempts before D1 or Stripe work;
- loads ticket price, capacity, meal options, registration window, and donation bounds from authoritative server configuration;
- calculates all amounts in integer cents and ignores client totals;
- creates the pending D1 reservation before redirecting to Checkout;
- uses opaque server-generated IDs in Stripe metadata, never attendee/contact PII;
- creates only Stripe test-mode Checkout Sessions in preview;
- verifies webhook signatures against the raw request body;
- makes webhook processing idempotent by Stripe event ID and rejects altered replay content;
- compares Stripe amounts/currency/metadata with D1 before marking a reservation paid;
- emits structured PII-free logs and generic API errors with request IDs;
- defers CSV export until approved authentication and retention rules exist.

## Review artifacts

- `docs/implementation/BANQUET_REGISTRATION_E2E.md` defines the controlled localhost-only Stripe test-mode review and safe evidence handling.
- `docs/implementation/BANQUET_REGISTRATION_REVIEW_CHECKLIST.md` records the board/staff/privacy/technical launch gates and explicit go/no-go decision.

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

Phase 4 should execute the documented test-mode E2E review with authorized temporary test credentials, resolve board/staff checklist decisions, and produce a reviewed production-readiness design without deploying. It should define the final public abuse controls, operational alert ownership, data retention/deletion rules, and authentication/authorization boundary for a later CSV export. Proposed migrations must stay local-only until the board approves the workflow and retention requirements.

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
- 2026-07-04 — Step 15: began Phase 3 with a clean, synchronized feature branch (`0` ahead/`0` behind) and a fresh production-default build-leak pass. Compared `wrangler.jsonc` with the branch point and found no change; repository scans found no live Stripe credential pattern, remote binding flag, D1 database ID, or migration outside `migrations/proposed/`. Reviewed current Cloudflare Worker rate-limiting/observability guidance and Stripe Checkout/webhook testing guidance before implementation.
- 2026-07-04 — Step 16: added preview-only abuse controls without touching production configuration. Checkout JSON remains capped at 16 KiB; verified webhook payloads are now capped at 64 KiB. The separate preview config has a locally simulated checkout rate-limit binding set to 10 attempts per 60 seconds and uses a SHA-256 key derived from the allowlisted origin plus Cloudflare-provided edge address, without logging either value. A `429` response includes `Retry-After: 60`. Added deterministic oversized-body and limiter-denial tests. The full-stack preview origin is consistently `127.0.0.1:8787`.
- 2026-07-04 — Step 17: added preview-only structured observability and safer API responses. Every banquet API response now carries an opaque server-generated request ID plus no-store, no-referrer, MIME-sniffing, framing, and same-origin resource headers; unsupported methods return `Allow: POST`. Structured logs contain only request/path/status/timing, opaque Stripe/reservation IDs, bounded enums, and error class names—never bodies, contact fields, attendee names, email, phone, secrets, signatures, IP addresses, or raw error messages. The preview config enables full local-review log and trace sampling; production config remains untouched.
- 2026-07-04 — Step 18: hardened webhook replay handling on top of the existing D1 primary-key idempotency transaction. An exact retry must match the stored event type and SHA-256 payload digest to receive the normal idempotent `200`; reuse of a Stripe event ID with altered content now produces a generic `409 webhook_replay_conflict`, a PII-free error log, and no reservation, webhook, or alert mutation. Added a transaction-backed altered-replay test alongside the existing exact-duplicate test.
- 2026-07-04 — Step 19: documented a controlled localhost-only Stripe test-mode E2E procedure covering safe credential handling, successful payment, back/cancel behavior, deliberate test-session expiry, non-PII D1 verification, limiter/error checks, log inspection, evidence handling, and cleanup. Added a separate board/staff checklist for pricing/capacity/content, policy/privacy/retention, operational ownership, accessibility, technical evidence, and explicit go/no-go decisions. CSV export, email, deployment, public exposure, and production resource changes remain prohibited.
- 2026-07-04 — Step 20: validated Phase 3 without deployment or remote access. `npm run check`, the final production-default `npm run build`, `npm run validate`, all 22 Workers-runtime tests, local D1 migration validation, Wrangler `deploy --dry-run`, the production-default leak check, and `git diff --check` pass. An isolated Wrangler-local runtime also proved the configured limiter: ten malformed synthetic requests returned bounded `400` responses and the eleventh returned `429` with `Retry-After: 60`; every response included a request ID and no Stripe/D1 work occurred. Production `wrangler.jsonc` still matches the branch point, no live-key-shaped value exists, and all four migrations remain only under `migrations/proposed/`. The documented real Stripe test-mode E2E review was not executed because no temporary test credentials were introduced in this phase.
