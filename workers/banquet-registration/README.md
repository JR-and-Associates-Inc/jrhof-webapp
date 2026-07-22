# Banquet Registration Worker — Isolated V2 Preview

This directory contains an isolated Cloudflare Worker implementation for local preview and automated tests. The active local configuration is `wrangler.banquet-preview.jsonc`; `wrangler.banquet-remote-preview.jsonc` is retained only as historical preview evidence and is not authorization to redeploy. The production `wrangler.jsonc` and its asset-only behavior are unchanged.

The preview config has no routes, custom domains, `workers.dev` endpoint, preview URL, or remote D1 database ID. Do not deploy it. Use only Stripe test-mode credentials in an ignored `.dev.vars` file copied from `.dev.vars.example`.

## Runtime boundary

The preview Worker runs before static assets only for:

- `POST /api/banquet/checkout`
- `GET /api/banquet/confirmation`
- `POST /api/webhooks/stripe`
- `GET /api/banquet/exports/registrations.csv`
- `GET /api/banquet/exports/seating-plan.csv`

Every other request is returned through the `ASSETS` binding. Runtime startup checks require `ENVIRONMENT=local-preview`, an `sk_test_` Stripe key, and a `whsec_` webhook secret.

Preview bindings and secrets:

- `BANQUET_DB`: Wrangler-local D1 using `migrations/proposed/`.
- `STRIPE_SECRET_KEY`: Stripe test secret, supplied only through `.dev.vars`.
- `STRIPE_WEBHOOK_SECRET`: Stripe test webhook signing secret, supplied only through `.dev.vars`.
- `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`: exact Cloudflare Access JWT issuer and application audience.
- `BOARD_EXPORT_ALLOWED_EMAILS`: comma-separated board allowlist stored only as a Worker secret.
- `BANQUET_ALLOWED_ORIGINS`: exact local origin allowlist generated from the preview config.
- `BANQUET_CHECKOUT_RATE_LIMITER`: locally simulated checkout limiter (10 attempts per 60 seconds); its actor key is hashed and not logged.
- Success and cancel URLs point back to the existing 2027 event page on localhost.

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
      "mealId": "preview-option-a",
      "dietaryNotes": "Relevant allergy or dietary accommodation only"
    }
  ],
  "seatingNotes": "Optional, 300 characters maximum",
  "donationAmountCents": 0,
  "acknowledgements": {
    "terms": true,
    "privacy": true,
    "informationAccuracy": true,
    "refundPolicy": true
  }
}
```

The Worker bounds checkout JSON at 16 KiB, rejects unknown fields and control characters, applies NFKC/whitespace normalization, validates one to eight attendees and configuration-driven meal IDs, limits dietary and seating notes to 300 characters, requires four explicit acknowledgements, rate-limits checkout before D1/Stripe work, and loads price, capacity, currency, donation bounds, meals, and checkout lifetime from D1. Browser price, subtotal, total, capacity, status, and Stripe identifiers are not accepted. Meal descriptions are mandatory at the production launch gate; the test fixtures deliberately have none.

Reservation and attendee IDs are generated with Web Crypto. A D1 batch atomically performs the capacity-conditional pending reservation insert and attendee inserts. Stripe receives only opaque event and reservation IDs in metadata. Contact and attendee PII never enters Stripe metadata, and card data never enters this Worker or D1.

If Stripe Checkout creation fails, the reservation becomes `checkout_failed`. A successful response contains only an opaque reservation ID and verified `https://checkout.stripe.com/...` test URL. The browser return path never marks a reservation paid.

## Purchaser confirmation endpoint

Before redirecting to test Checkout, the browser stores the opaque registration ID in same-tab session storage; it never puts a Stripe Checkout Session ID in the page URL or analytics. After `?checkout=success`, `GET /api/banquet/confirmation?reference=<opaque UUID>` reads D1 and reports `confirmed` only when the reservation has the exact server-paid state and reconciled amount created by the signature-verified webhook. Pending records remain `processing`; expired, canceled, failed, disputed, review, or refunded records are never confirmed.

The confirmed response contains only the safe registration reference, paid integer-cent total, and currency. It excludes Stripe IDs and every purchaser, attendee, meal, dietary, and seating field. All confirmation responses are same-origin, `no-store`, `noindex`, and use no-referrer headers. The browser emits the test-only, session-deduplicated `registration_complete` data-layer event only after this response; preview-hostname GTM protections keep it out of production GA4 and Ads.

## Stripe webhook endpoint

`POST /api/webhooks/stripe` reads a raw body bounded at 64 KiB and verifies `Stripe-Signature` before parsing through Stripe's SDK. It rejects live-mode event envelopes and live-mode Checkout Session objects.

For supported Checkout events, the Worker reconciles reservation ID, event ID, Checkout Session ID, expected integer-cent amount, currency, session state, payment state, and PaymentIntent identity. Only a matching paid session can transition a reservation to `paid`. Mismatches become `payment_review` with an operator-facing D1 alert. Expired, failed, canceled, disputed, partially refunded, and refunded events have explicit state transitions and remain idempotent.

## Protected preview exports

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
BANQUET_REGISTRATION_PREVIEW=true BANQUET_PREVIEW_TICKET_PRICE_CENTS=8500 npm run build
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
