# Banquet Registration Worker — Isolated V2 Preview

This directory contains an isolated Cloudflare Worker implementation for local and remote board previews plus automated tests. `wrangler.banquet-preview.jsonc` is local-only. The remote rehearsal deliberately uses two unlinked Workers with no production route or custom domain:

- `wrangler.banquet-remote-preview.jsonc` is the public registration and Stripe-webhook origin.
- `wrangler.banquet-board-preview.jsonc` is the whole-origin Cloudflare Access-protected board-review origin.

Both remote Workers use the same isolated preview D1 database and Stripe test mode. The production `wrangler.jsonc` and its asset-only behavior are unchanged.

Never deploy the local config. Any remote preview deploy must name one of the two remote configs explicitly and pass a preflight confirming test-only secrets, preview D1, no routes, and no custom domain. Use only Stripe test-mode credentials in an ignored local `.dev.vars` file or encrypted remote Worker secrets.

## Runtime boundary

The Worker entrypoint runs before static assets only for:

- `POST /api/banquet/checkout`
- `GET /api/banquet/config`
- `GET /api/banquet/confirmation`
- `GET /api/banquet/dashboard`
- `POST /api/webhooks/stripe`
- `GET /api/banquet/exports/registrations.csv`
- `GET /api/banquet/exports/seating-plan.csv`

Every other request is returned through the `ASSETS` binding. Runtime startup checks require `ENVIRONMENT=local-preview`, an `sk_test_` Stripe key, and a `whsec_` webhook secret.

`BANQUET_PREVIEW_ROLE=registration` serves guest configuration, checkout, confirmation, and the public Stripe webhook. It redirects `/board/banquet/*`, the dashboard API, and both CSV APIs to `BOARD_PREVIEW_ORIGIN`. `BANQUET_PREVIEW_ROLE=board-review` serves those board surfaces after Cloudflare Access protects the entire Worker origin. Stripe never targets the board origin. Both roles enforce the signed Access JWT and exact Worker-side email allowlist before any board D1 read.

Preview bindings and secrets:

- `BANQUET_DB`: Wrangler-local D1 or the isolated remote preview D1 using `migrations/proposed/`.
- `STRIPE_SECRET_KEY`: Stripe test secret, supplied only through `.dev.vars` locally or encrypted Worker secrets remotely.
- `STRIPE_WEBHOOK_SECRET`: Stripe test webhook signing secret, supplied only through `.dev.vars` locally or encrypted Worker secrets remotely.
- `BANQUET_PREVIEW_ROLE`: `registration` or `board-review`; any other value fails closed for board requests.
- `BOARD_PREVIEW_ORIGIN`: exact Access-protected board origin used only by the public registration role.
- `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`: exact Cloudflare Access JWT issuer and application audience.
- `BOARD_REPORT_ALLOWED_EMAILS`: comma-separated board-report allowlist stored only as a Worker secret. The legacy `BOARD_EXPORT_ALLOWED_EMAILS` name remains a temporary read-only fallback for preview-secret rotation.
- `BANQUET_ALLOWED_ORIGINS`: exact origin allowlist for the selected local or remote preview.
- `BANQUET_CHECKOUT_RATE_LIMITER`: locally simulated checkout limiter (10 attempts per 60 seconds); its actor key is hashed and not logged.
- Success and cancel URLs point back to the dedicated 2027 registration route on the same preview origin.

## Checkout endpoint

`POST /api/banquet/checkout` accepts this exact JSON shape:

```json
{
  "eventId": "banquet-2027",
  "contact": {
    "name": "Purchaser Name",
    "email": "purchaser@example.org",
    "phone": "+1 303 555 0100"
  },
  "attendees": [
    {
      "fullName": "Attendee Name",
      "mealId": "chicken",
      "dietaryNotes": "Relevant allergy or dietary accommodation only"
    }
  ],
  "seatingNotes": "Optional, 300 characters maximum",
  "donationAmountCents": 0,
  "attribution": {
    "source": "jrhof_email",
    "medium": "email",
    "campaign": "banquet_2027",
    "content": "save_the_date",
    "term": null
  },
  "acknowledgements": {
    "terms": true,
    "privacy": true,
    "informationAccuracy": true,
    "refundPolicy": true
  }
}
```

The Worker bounds checkout JSON at 16 KiB, rejects unknown fields and control characters, applies NFKC/whitespace normalization, validates the D1-configured attendee limit and meal IDs, limits dietary and seating notes to 300 characters, validates five optional UTM labels, requires four explicit acknowledgements, rate-limits checkout before D1/Stripe work, and loads price, capacity, registration window, currency, donation bounds, meals, and checkout lifetime from D1. Browser price, subtotal, total, capacity, status, and Stripe identifiers are not accepted. Meal descriptions are mandatory at the production launch gate; the test fixtures deliberately have none.

Reservation and attendee IDs are generated with Web Crypto. A D1 batch atomically performs the capacity-conditional pending reservation insert and attendee inserts. Stripe receives only opaque event and reservation IDs in metadata; the validated purchaser email is supplied through Stripe's dedicated `customer_email` field so the guest does not retype it. Contact and attendee PII never enters Stripe metadata, and card data never enters this Worker or D1.

## Public event configuration endpoint

`GET /api/banquet/config` is same-origin, no-store, test-mode-only, and contains no registrant data. It exposes the D1-controlled test price, currency, open/scheduled/closed/sold-out state, registration window, capacity remaining, order limit, donation bounds, available meals, and whether a refund-policy version exists. The guest form stays disabled if this response cannot be verified.

If Stripe Checkout creation fails, the reservation becomes `checkout_failed`. A successful response contains only an opaque reservation ID and verified `https://checkout.stripe.com/...` test URL. The browser return path never marks a reservation paid.

## Purchaser confirmation endpoint

Before redirecting to test Checkout, the browser stores the opaque registration ID in same-tab session storage; it never puts a Stripe Checkout Session ID in the page URL or analytics. After `?checkout=success`, `GET /api/banquet/confirmation?reference=<opaque UUID>` reads D1 and reports `confirmed` only when the reservation has the exact server-paid state and reconciled amount created by the signature-verified webhook. Pending records remain `processing`; expired, canceled, failed, disputed, review, or refunded records are never confirmed.

The confirmed response contains only the safe registration reference, paid integer-cent total, and currency. It excludes Stripe IDs and every purchaser, attendee, meal, dietary, and seating field. All confirmation responses are same-origin, `no-store`, `noindex`, and use no-referrer headers. The browser emits the test-only, session-deduplicated `registration_complete` data-layer event only after this response; preview-hostname GTM protections keep it out of production GA4 and Ads.

## Stripe webhook endpoint

`POST /api/webhooks/stripe` reads a raw body bounded at 64 KiB and verifies `Stripe-Signature` before parsing through Stripe's SDK. It rejects live-mode event envelopes and live-mode Checkout Session objects.

For `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`, the Worker reconciles reservation ID, event ID, Checkout Session ID, expected integer-cent amount, currency, session state, payment state, and PaymentIntent identity. Only a matching paid session can transition a reservation to `paid`. A completed but still-unpaid asynchronous session remains a capacity-holding `payment_review` record until its signed success or failure event arrives; a verified asynchronous failure releases that hold. Mismatches become `payment_review` with an operator-facing D1 alert. Expired, failed, canceled, disputed, partially refunded, and refunded events have explicit state transitions and remain idempotent.

The remote Stripe test webhook must also subscribe to `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`, and `charge.dispute.created` so terminal failures, refunds, and disputes reach those explicit state transitions and board reports.

## Protected board dashboard and exports

`GET /api/banquet/dashboard` is served only by the `board-review` role and requires the same Access checks as the CSV endpoints. It returns aggregate counts and cents only: registrations/seats by state, verified paid and active-pending seats, payment-review count, capacity remaining, gross/refunded/net amounts, donation amount, paid meal counts, 30-day activity, and UTM source/medium rollups. It contains no purchaser, attendee, contact, dietary, seating, Stripe, or Access identity fields. Each read writes a separate subject-digest audit record.

Both export routes require a signed `Cf-Access-Jwt-Assertion`. The Worker verifies the RS256 signature against the Access JWKS plus issuer, audience, expiration, application token type, subject, and email allowlist. It never trusts `Cf-Access-Authenticated-User-Email` by itself. Missing configuration fails closed.

Exports default to all statuses; `?paid-only=true` applies the authorized paid-only view. Responses use UTF-8 BOM and CRLF, quote every cell, neutralize spreadsheet formulas, exclude Stripe IDs and raw webhooks, and set `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, and attachment disposition. Audit rows store only a one-way subject digest, export type, scope, row count, and timestamp. See [Cloudflare Access export setup](../../docs/implementation/CLOUDFLARE_ACCESS_EXPORT.md) and the [board guide](../../docs/operations/BOARD_REGISTRATION_EXPORT_GUIDE.md).

`banquet_webhook_events.stripe_event_id` is the idempotency key. Event recording and the corresponding reservation state change run in one D1 batch. An exact duplicate must match the stored event type and SHA-256 payload digest; altered content reusing an event ID is a replay conflict. Raw webhook bodies are not persisted.

## Errors and observability

API errors return stable codes without exception messages, provider responses, record contents, or secrets. Responses are non-cacheable and include an opaque `X-Request-ID`, defensive JSON headers, and the route-appropriate `Allow` method. Rate-limit responses include `Retry-After: 60`.

Structured logs are limited to request ID, API path, method/status/timing, opaque event/reservation IDs, bounded outcome/reason values, and error class names. Never log request bodies, contact/attendee fields, seating notes, signatures, secret values, addresses, or raw provider errors. Preview logs/traces use full sampling only for deliberate local review; this does not configure production observability.

## Local commands

```bash
cp .dev.vars.example .dev.vars
npm run banquet:db:migrate
BANQUET_REGISTRATION_PREVIEW=true npm run build
npx wrangler dev --local --config wrangler.banquet-preview.jsonc
```

Use a Stripe CLI test-mode listener only if an end-to-end Stripe review is intentionally being performed. Never substitute live credentials or add `--remote` to the D1 command.

Follow `docs/implementation/BANQUET_REGISTRATION_E2E.md` for the controlled test-mode procedure and `docs/implementation/BANQUET_REGISTRATION_REVIEW_CHECKLIST.md` for approval gates.

Validation commands:

```bash
npm run banquet:check
npm run banquet:test
npx wrangler deploy --dry-run --config wrangler.banquet-preview.jsonc
```

The Workers-runtime tests apply the entire proposed migration sequence to an isolated local D1 database. They inject Checkout Session creation at the outbound network boundary while exercising the real Stripe SDK/Web Crypto webhook signature verifier.

## Deferred work

The protected HTTP export is preview-only and the CLI remains the operator fallback. A Google Sheets webhook or service account is intentionally not implemented. It requires separate board approval of the Workspace destination, access list, retention, retry behavior, and responsible operator. The preview limiter is intentionally coarse and must be replaced or approved alongside the final public abuse-control strategy before launch.

Before production launch, satisfy every gate in [registration v2 controls](../../docs/implementation/BANQUET_REGISTRATION_V2.md), promote reviewed migrations through the approved process, configure distinct production resources and secrets, and keep the experience on the existing 2027 event page. None of those actions is authorized by this branch.
