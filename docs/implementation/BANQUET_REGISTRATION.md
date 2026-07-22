# Banquet Registration

> Historical Phase 3 record for the preserved original feature branch. For the reconciled V2 design, protected board export, current launch gates, and corrected success-URL behavior, use [BANQUET_REGISTRATION_V2.md](BANQUET_REGISTRATION_V2.md). Statements below that say the protected HTTP export is absent or that a success URL confirms receipt describe the earlier implementation and are not current V2 behavior.

## Current status

The preview workflow is implemented on `feature/banquet-registration-checkout` with bounded requests, preview-only abuse controls, PII-free structured observability, safer API responses, replay detection, a Stripe test-mode E2E procedure, and board/staff review gates. The isolated remote preview Worker and D1 database completed one synthetic Stripe test-mode payment and server-verified webhook reconciliation. No live payment mode, production D1 binding, production route, or production Worker behavior is enabled.

A board-operated CLI export now reads `banquet-2027` registrations from the isolated remote preview D1 database. It exports every stored reservation status by default and offers a stricter paid/verified-only mode. It writes a local ignored CSV with dollar-denominated amounts, full CSV escaping, spreadsheet-formula neutralization, and owner-only file permissions. This is not a web admin export, does not expose an HTTP endpoint, and does not satisfy the unresolved production retention/access launch gates.

The Cloudflare feature preview has a fail-closed build boundary in `scripts/build-site.mjs`. Workers Builds enables the draft only when Cloudflare supplies both `WORKERS_CI=1` and the exact branch `feature/banquet-registration-checkout`; its public UI preview forces the ticket display to `0` so the page says the price is pending rather than showing an unapproved amount. Every other Cloudflare branch—including `main`—has both banquet preview variables removed before Astro runs. This changes only the non-promoted feature preview artifact; it does not change `jrhof.org`, production Worker configuration, routes, bindings, migrations, or runtime secrets.

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
- A local static build renders the draft only when `BANQUET_REGISTRATION_PREVIEW=true` is present at build time.
- Cloudflare Workers Builds sets that flag only for the exact `feature/banquet-registration-checkout` branch and removes it for all other branches.
- The ticket price is a preview display input, provided as integer cents through `BANQUET_PREVIEW_TICKET_PRICE_CENTS`. It defaults to `0` (price pending) and is not an approved or server-authoritative price.
- The guarded form calls the local preview API only after browser validation. The Worker repeats validation, ignores browser totals, and rejects non-test Stripe keys.
- Production/default builds omit the preview variables. Cloudflare builds outside the exact feature branch forcibly remove them until board approval and all launch gates are complete.
- Preview resources must use Stripe test mode and an isolated preview D1 database. Preview builds must never receive live Stripe secrets or production write bindings.
- No DNS, route, custom-domain, or production deployment changes are part of this phase.
- On 2026-07-05, the repository owner approved showing this draft on the unlinked feature Workers preview without Cloudflare Access. This exception is limited to the UI-only artifact: it has no live Stripe secrets, production D1 access, write-capable banquet API, production route/domain, or public navigation/homepage/sitemap link. Stripe E2E remains localhost-only.
- Cloudflare Access becomes required before a preview receives PII, secrets, admin routes, or write-capable bindings. This exception does not waive those controls or any production launch gate.

Example local UI review with price pending:

```bash
BANQUET_PREVIEW_TICKET_PRICE_CENTS=0 npm run dev
```

Example static preview build:

```bash
BANQUET_REGISTRATION_PREVIEW=true BANQUET_PREVIEW_TICKET_PRICE_CENTS=0 npm run build
```

Local full-stack preview sequence (never use live keys):

```bash
cp .dev.vars.example .dev.vars
npm run banquet:db:migrate
BANQUET_REGISTRATION_PREVIEW=true BANQUET_PREVIEW_TICKET_PRICE_CENTS=<TEST_PRICE_CENTS> npm run build
npx wrangler dev --local --config wrangler.banquet-preview.jsonc
```

The copied `.dev.vars` file is ignored by Git. The proposed migrations apply only to Wrangler's local D1 state unless an operator adds `--remote`, which is prohibited before board approval.

## Remote feature preview (test mode)

The local flow above stays on `127.0.0.1`. A separate, isolated remote preview lets the D1 + Stripe **test-mode** checkout be exercised on a real Cloudflare Worker without touching production. It is defined only in `wrangler.banquet-remote-preview.jsonc` and is intentionally kept apart from both the local-only `wrangler.banquet-preview.jsonc` and the production `wrangler.jsonc`.

Boundaries that make this safe:

- The remote-preview Worker is named `jrhof-banquet-registration-remote-preview` — a different name from production `jrhof-webapp`, so a preview deploy can never overwrite production.
- The config declares **no** `route`/`routes` and no custom domain. It only ever serves from an unlinked `*.workers.dev` URL; `jrhof.org` DNS, routes, and the production Worker are untouched.
- The D1 binding is `BANQUET_DB` → database `jrhof-banquet-registration-preview`, a **preview** database separate from any future production database. Its `database_id` ships as the placeholder `REPLACE_WITH_REMOTE_PREVIEW_D1_DATABASE_ID`, so `wrangler deploy` fails closed until an operator provisions the database and pastes the id.
- Migrations still come from `./migrations/proposed`; nothing is promoted into a production migrations directory.
- `STRIPE_SECRET_KEY` must be `sk_test_…`. The Worker's `assertPreviewRuntime()` gate rejects live keys and any Checkout Session with `livemode: true`, remote or local.

### Remote D1 status

Provisioned on 2026-07-05 in the **JR and Associates, Inc** Cloudflare account (`0cd62d96…`):

- Database: `jrhof-banquet-registration-preview`
- `database_id`: `ff728300-e862-4ead-83bb-91cddd86967e` (already set in `wrangler.banquet-remote-preview.jsonc`)
- Region: ENAM · read replication disabled · this is a **preview** database, not production.

All four proposed migrations have been applied `--remote`; `d1_migrations` records `0000`–`0003`. The schema holds `banquet_events` (STRICT, seeded with the single `preview_unapproved` fixture `banquet-2027`, `8500`-cent illustrative price), `banquet_reservations`, `banquet_attendees`, `banquet_webhook_events`, and `banquet_payment_alerts` with their indexes. The database currently contains the synthetic paid/verified test registration recorded in Step 30. The remote preview remains test-mode only.

### One-time remote setup (operator, using placeholders only)

```bash
# 1. [DONE 2026-07-05] Create the remote PREVIEW D1 database and copy the printed database_id.
wrangler d1 create jrhof-banquet-registration-preview

# 2. [DONE] Paste that id into wrangler.banquet-remote-preview.jsonc, replacing
#    REPLACE_WITH_REMOTE_PREVIEW_D1_DATABASE_ID (leave the file otherwise as-is).

# 3. [DONE] Apply the proposed migrations to the REMOTE PREVIEW database (never production).
wrangler d1 migrations apply jrhof-banquet-registration-preview \
  --remote --config wrangler.banquet-remote-preview.jsonc

# 4. Upload Stripe TEST-MODE secrets as Worker secrets (never committed, never in .dev.vars).
wrangler secret put STRIPE_SECRET_KEY    --config wrangler.banquet-remote-preview.jsonc  # paste sk_test_… only
wrangler secret put STRIPE_WEBHOOK_SECRET --config wrangler.banquet-remote-preview.jsonc  # paste whsec_… only

# 5. Build the guarded preview artifact and deploy to the *.workers.dev preview surface.
BANQUET_REGISTRATION_PREVIEW=true BANQUET_PREVIEW_TICKET_PRICE_CENTS=<TEST_PRICE_CENTS> npm run build
wrangler deploy --config wrangler.banquet-remote-preview.jsonc

# 6. Copy the printed https://<name>.<subdomain>.workers.dev origin into the three
#    BANQUET_ALLOWED_ORIGINS / BANQUET_SUCCESS_URL / BANQUET_CANCEL_URL placeholders,
#    then re-run step 5 so the origin allowlist and redirect URLs match the live URL.
```

The remote `STRIPE_WEBHOOK_SECRET` comes from a Stripe **test-mode** webhook endpoint (Dashboard → Developers → Webhooks, test mode) pointed at `https://<name>.<subdomain>.workers.dev/api/webhooks/stripe`, subscribed to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.expired`. Copy its signing secret (`whsec_…`) in step 4. The Stripe CLI `stripe listen` secret is for the localhost flow only; it does not sign deliveries to the remote endpoint.

To decommission, run `wrangler delete --config wrangler.banquet-remote-preview.jsonc` and `wrangler d1 delete jrhof-banquet-registration-preview`; production is unaffected either way.

## Daily board preview export

Run the export only from a trusted board/staff workstation with an authenticated Wrangler session authorized for the **JR and Associates, Inc** Cloudflare account:

```bash
# Daily export of every stored reservation status:
npm run banquet:export:preview

# Replace today's existing CSV:
npm run banquet:export:preview -- --overwrite

# Export only paid, payment-verified, amount-reconciled reservations:
npm run banquet:export:preview -- --paid-only
```

The command performs one read-only query through `wrangler.banquet-remote-preview.jsonc` against binding `BANQUET_DB`. The default export includes every stored `banquet-2027` reservation status, including paid, pending, canceled, expired, checkout-failed, refunded/review states, and any other status present in D1. The `status` column is included so board reviewers can filter or sort the file by status in Excel or, when the destination is separately approved for PII, Google Sheets.

The `--paid-only` option narrows the export to `banquet-2027` reservations where:

- `status = 'paid'`;
- `payment_verified_at` is present;
- `amount_paid_cents` is present and equals the server-calculated expected total; and
- the returned attendee positions are complete and match the reservation attendee count.

The file is written as:

`exports/banquet-registrations-preview-YYYY-MM-DD.csv`

The date is UTC. Without `--overwrite`, the exporter refuses to replace an existing daily file. With `--overwrite`, it replaces today's file and reapplies owner-only mode `0600`. The `exports/*.csv` path is ignored by Git, and no registrant fields are printed to the terminal. Output contains one row per attendee, repeats reservation-level payment/contact fields for that attendee, and converts every present integer-cent amount to a fixed two-decimal dollar string. `total_paid` is blank when D1 has no paid amount for an unpaid reservation.

All CSV cells are quoted and embedded quotes/newlines are escaped. Values that could be interpreted as spreadsheet formulas—including content beginning with whitespace followed by `=`, `+`, `-`, or `@`—receive a leading apostrophe before CSV escaping.

Handling rules:

- Treat the CSV as sensitive preview registration PII.
- Store it only in an approved board/staff location and share it only with approved reviewers.
- Do not commit, email, upload to Google Sheets, or place it in a public/shared folder unless a separate approved handling procedure explicitly authorizes that destination.
- Securely delete local exports according to the board-approved retention schedule. That schedule remains a production launch gate.
- Do not use the preview export as evidence of a live/public registration launch.

There is intentionally no admin web endpoint, Google Sheets integration, production D1 access, or production export configuration in this workflow.

## Checkout return states (preview)

Stripe test Checkout returns the browser to the 2027 event page with a `?checkout=` marker (`BANQUET_SUCCESS_URL` → `?checkout=success`, `BANQUET_CANCEL_URL` → `?checkout=canceled`). The preview component reads that marker client-side via `resolveCheckoutView()` in `src/scripts/banquet-checkout-view.mjs` and renders one of three views:

- **success** — hides the registration form and preview intro, and shows a "Registration received" confirmation panel. It states the payment is being verified through the Stripe test webhook, tells the purchaser to expect Stripe's payment confirmation email, and links to `/contact/` for corrections. It carries a "Preview · Stripe test mode" tag and explicitly makes no claim about tax deductibility, refunds, final seating/table placement, or official receipt behavior.
- **canceled** — keeps the form available and shows a notice that checkout was canceled, no registration was completed, and no payment was recorded.
- **form** (default / unrecognized marker) — the normal draft form, so the preview never asserts a state it was not explicitly returned to.

This is a display state only; it is never authoritative for payment. Actual payment/reservation state is reconciled server-side from the verified Stripe webhook in D1. The behavior is preview-only and ships only in the guarded feature build. `resolveCheckoutView()` is covered by `scripts/test-banquet-checkout-view.mjs`, wired into `npm run check` via `banquet:check`.

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

These remain proposed migrations. They are bound by the local and isolated remote-preview Wrangler configs and have been applied only to the remote preview D1 database; no migration is promoted to a production migration path, and no D1 binding exists in production `wrangler.jsonc`.

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
- exposes no CSV HTTP endpoint; the preview-only board export is an authenticated Wrangler CLI read from the isolated preview D1 database.

## Review artifacts

- `docs/implementation/BANQUET_REGISTRATION_E2E.md` defines the controlled localhost-only Stripe test-mode review and safe evidence handling.
- `docs/implementation/BANQUET_REGISTRATION_REVIEW_CHECKLIST.md` records the board/staff/privacy/technical launch gates and explicit go/no-go decision.
- `docs/implementation/BANQUET_REGISTRATION_PHASE4_READINESS.md` records the current preview diagnosis, safe board-preview requirements, and blocked E2E evidence.

## Launch gates

Registration must remain hidden until all of the following are approved and verified:

1. Board approval of ticket price, capacity, registration dates, meal options, donation bounds, and public copy.
2. Board-approved refund, cancellation, receipt, privacy, retention, and operational ownership rules. The UI must not infer or invent them.
3. Separate preview and production D1 databases, with reviewed migrations, backups, and rollback/recovery procedures.
4. Preview-only Stripe test secrets stored as Worker secrets; no secrets committed to Git.
5. Server-side request validation, authoritative pricing/capacity checks, abuse controls, and safe error handling.
6. Stripe webhook signature verification, idempotency, amount reconciliation, replay tests, and failure alerts.
7. Production export authentication/authorization and an approved data-retention policy. The preview-only Wrangler CLI export does not satisfy this production gate.
8. End-to-end test-mode review covering success, cancel, expiry, duplicate webhook, amount mismatch, and capacity races.
9. Privacy and security review confirming that no card data is stored and PII is minimized and access-controlled.
10. Explicit approval to enable the registration section on the existing 2027 event page.

## Next steps

The next phase should resolve board/staff checklist decisions and produce a reviewed production-readiness design without deploying production. It must define final public abuse controls, operational alert ownership, data retention/deletion rules, and the authentication/authorization boundary for any future web/admin export. Proposed migrations remain unpromoted until the board approves the workflow and retention requirements.

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
- 2026-07-04 — Step 21: began Phase 4 with a clean synchronized branch and unchanged production `wrangler.jsonc`. Browser inspection of the requested aliased Workers preview confirmed the normal 2027 event page is live there but the guarded draft/form is absent, proving the deployed artifact was not built with `BANQUET_REGISTRATION_PREVIEW=true`. The alias loaded without an Access challenge. Local readiness checks found no `.dev.vars` and no Stripe CLI, so all Stripe-dependent E2E scenarios stopped as required without creating a session, reservation, webhook, payment, or synthetic PII.
- 2026-07-04 — Step 22: added a redacted readiness record with explicit BLOCKED outcomes and no fabricated E2E evidence. Documented the initial Access-gated remote review design, conditional feature-branch build flag, non-promoted version alias, UI-only constraint, and unchanged production resources. Corrected stale preview copy so it distinguishes local full-stack test Checkout from static UI-only board review. The Access requirement was superseded by the scoped owner decision in Step 26.
- 2026-07-05 — Step 23: completed every non-credential Phase 4 validation. `npm run check`, the production-default `npm run build`, `npm run validate`, all 22 Worker tests, local D1 migration validation, Wrangler dry-run, production-default leak check, production-config comparison, and `git diff --check` pass. These results are recorded separately from the blocked Stripe E2E table and do not imply a payment, webhook, board approval, deployment, or launch.
- 2026-07-05 — Step 24: added a tested, fail-closed Workers Builds boundary. Only `WORKERS_CI=1` plus the exact `feature/banquet-registration-checkout` branch forces `BANQUET_REGISTRATION_PREVIEW=true` and `BANQUET_PREVIEW_TICKET_PRICE_CENTS=8500`; every other Cloudflare branch deletes both values before Astro builds. Explicit local preview builds still work, while production configuration, routing, bindings, secrets, and proposed migrations remain unchanged.
- 2026-07-05 — Step 25: validated the preview boundary locally. `npm run check`, default and exact-feature preview builds, a simulated Cloudflare `main` build with deliberately supplied preview variables, `npm run validate`, all 22 Worker tests, the final production-default leak check, production-config comparison, and `git diff --check` pass. The feature artifact contains one guarded form only on the existing 2027 banquet page with an `8500`-cent display price; both default and simulated production artifacts omit it.
- 2026-07-05 — Step 31: added preview-only checkout return states. The guarded form now reads the Stripe `?checkout=` marker client-side through a unit-tested `resolveCheckoutView()` helper and renders a "Registration received" confirmation panel on success (form hidden, webhook-verification wording, Stripe email note, `/contact/` correction link, explicit non-claims on tax/refund/seating/receipt) and a "checkout canceled — nothing recorded" notice on cancel, defaulting to the form otherwise. Added `scripts/test-banquet-checkout-view.mjs` (wired into `banquet:check`), updated the docs and E2E evidence, rebuilt the guarded artifact, and redeployed the preview Worker only (version `d7ad97b0…`); the live success/cancel states and the bundled resolver were verified over HTTPS. Default production build still renders no preview HTML; production `wrangler.jsonc`, the production Worker, and jrhof.org are unchanged.
- 2026-07-08 — Step 32: added the preview-only board CSV workflow. `npm run banquet:export:preview` authenticates through Wrangler and reads only paid, payment-verified, amount-reconciled `banquet-2027` rows from the isolated remote preview D1 database. The local ignored export has one attendee per row, fixed two-decimal dollar amounts, complete CSV quoting, spreadsheet-formula neutralization, owner-only permissions, and fail-closed attendee-count validation. No admin route, Sheets integration, production config, production deployment, or public-site behavior was added.
- 2026-07-08 — Step 33: validated the export workflow against the remote preview D1 without displaying PII. One paid/verified synthetic reservation exported as two attendee rows with the exact 17-column schema; the file is ignored by Git and has mode `0600`. `npm run check`, the production-default `npm run build`, `npm run validate`, all 22 Worker tests, export safety tests, the production-config comparison, secret-pattern scan, and `git diff --check` pass. The default build still omits registration, and production `wrangler.jsonc` remains unchanged.
- 2026-07-08 — Step 34: expanded the preview board export to include all stored reservation statuses by default while retaining the existing verified/reconciled payment criteria behind `--paid-only`. Added `--overwrite` for intentionally replacing the UTC-dated daily CSV, with mode `0600` reapplied after writing. Automated tests cover pending/unpaid rows, blank unpaid totals, both query scopes, argument validation, EEXIST protection, overwrite content, CSV safety, and file permissions. The status column remains available for board filtering in an approved spreadsheet location.
- 2026-07-08 — Step 35: exercised the real all-status overwrite command against the isolated remote preview D1; the ignored daily CSV was replaced successfully with one reservation and two attendee rows and retained mode `0600`. `npm run check`, the production-default `npm run build`, `npm run validate`, all 22 Worker tests, and `git diff --check` pass. Production `wrangler.jsonc` and production deployment behavior remain unchanged.
- 2026-07-05 — Step 30: completed the remote test-mode E2E. Owner set the `sk_test_`/`whsec_` Worker secrets and ran one synthetic test-card checkout; the `checkout.session.completed` webhook returned `200` and remote D1 reconciled cleanly — `status=paid`, `attendee_count=2`, `expected_total_cents=17000` == `amount_paid_cents=17000`, `currency=usd`, `verified=1`, one webhook row, zero payment-mismatch alerts, verified via non-PII/aggregate columns only. No live keys, no production deploy, no migration promotion.
- 2026-07-05 — Step 29: with explicit owner re-approval to run the test-mode write API without Cloudflare Access, built the guarded preview artifact and deployed the preview Worker only (`wrangler deploy --config wrangler.banquet-remote-preview.jsonc`) to `https://jrhof-banquet-registration-remote-preview.jr-and-associates-inc.workers.dev`. Captured the workers.dev origin, replaced the three `REPLACE_WITH_REMOTE_PREVIEW_ORIGIN` placeholders with it, and redeployed preview-only (version `29cf3abb…`). Smoke-tested live: the 2027 event page returns 200 with the guarded form, and `POST /api/banquet/checkout` fails closed with `503 preview_runtime_not_configured` because no Stripe secrets are set yet (fail-closed gate PASS). No secrets were set by automation and no live keys were used. Production `wrangler.jsonc`, the production Worker, jrhof.org routes/DNS, and `migrations/proposed` are unchanged. PENDING owner steps: create the Stripe test-mode webhook endpoint at `…/api/webhooks/stripe`, `wrangler secret put` the `sk_test_`/`whsec_` values, and complete one synthetic test-card checkout, after which D1 reconciliation and redacted pass/fail evidence will be recorded.
- 2026-07-05 — Step 28: provisioned the remote preview D1 with explicit owner authorization. Created `jrhof-banquet-registration-preview` (`ff728300-e862-4ead-83bb-91cddd86967e`, ENAM) in the JR and Associates account, set its real `database_id` in `wrangler.banquet-remote-preview.jsonc`, and applied all four proposed migrations `--remote`. Verified the remote schema via the Cloudflare D1 API: `d1_migrations` tracks `0000`–`0003`; the five STRICT banquet tables and their indexes exist; `banquet_events` holds only the seeded `preview_unapproved` `banquet-2027` fixture; reservations/attendees/webhook/PII rows are all zero. No Worker was deployed, no Stripe secrets were set, no live keys were used, and production `wrangler.jsonc` and the production Worker were untouched. Migrations remain under `migrations/proposed` (none promoted).
- 2026-07-05 — Step 27: added a separate remote feature-preview path without touching production `wrangler.jsonc`. Introduced `wrangler.banquet-remote-preview.jsonc` (Worker `jrhof-banquet-registration-remote-preview`, D1 binding `BANQUET_DB` → preview database `jrhof-banquet-registration-preview`, no route/custom domain, `workers.dev` preview only, fail-closed `database_id` placeholder, `migrations_dir` still `./migrations/proposed`). Confirmed the remote D1 does not yet exist (Cloudflare `d1_databases_list` returned zero) and documented manual creation, `--remote` migration apply against the preview DB only, and `wrangler secret put` upload of `sk_test_`/`whsec_` test-mode secrets with placeholders. Extended the E2E doc with a remote test-mode procedure, hardened `.gitignore` against Stripe webhook payload/log artifacts, and clarified `.dev.vars.example`. No production deploy, no live secrets, and no migration promoted to a production directory.
- 2026-07-05 — Step 26: repository owner approved the unlinked Workers feature URL for UI-only review without Cloudflare Access. The exception is justified because the artifact has no live Stripe secrets, production D1 access, write-capable banquet API, production route/domain, or production discovery link. Access is still required before adding PII, secrets, admin routes, or write-capable bindings. The form now states, “Test preview only — registration is not open.”
