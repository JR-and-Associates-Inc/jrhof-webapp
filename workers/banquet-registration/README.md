# Banquet Registration Worker — Phase 2 Local Preview

This directory contains an isolated Cloudflare Worker implementation for local preview and automated tests. It is wired only through `wrangler.banquet-preview.jsonc`; the production `wrangler.jsonc` and its asset-only behavior are unchanged.

The preview config has no routes, custom domains, `workers.dev` endpoint, preview URL, or remote D1 database ID. Do not deploy it. Use only Stripe test-mode credentials in an ignored `.dev.vars` file copied from `.dev.vars.example`.

## Runtime boundary

The preview Worker runs before static assets only for:

- `POST /api/banquet/checkout`
- `POST /api/webhooks/stripe`

Every other request is returned through the `ASSETS` binding. Runtime startup checks require `ENVIRONMENT=local-preview`, an `sk_test_` Stripe key, and a `whsec_` webhook secret.

Preview bindings and secrets:

- `BANQUET_DB`: Wrangler-local D1 using `migrations/proposed/`.
- `STRIPE_SECRET_KEY`: Stripe test secret, supplied only through `.dev.vars`.
- `STRIPE_WEBHOOK_SECRET`: Stripe test webhook signing secret, supplied only through `.dev.vars`.
- `BANQUET_ALLOWED_ORIGINS`: exact local origin allowlist generated from the preview config.
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
    { "fullName": "Attendee Name", "mealChoice": "chicken" }
  ],
  "seatingNotes": "Optional, 500 characters maximum",
  "donationAmountCents": 0
}
```

The Worker bounds and parses the body, rejects unknown fields, normalizes text, validates one to eight attendees and meal choices, and loads price, capacity, currency, donation bounds, and checkout lifetime from D1. Browser price, subtotal, total, capacity, status, and Stripe identifiers are not accepted.

Reservation and attendee IDs are generated with Web Crypto. A D1 batch atomically performs the capacity-conditional pending reservation insert and attendee inserts. Stripe receives only opaque event and reservation IDs in metadata. Contact and attendee PII never enters Stripe metadata, and card data never enters this Worker or D1.

If Stripe Checkout creation fails, the reservation becomes `checkout_failed`. A successful response contains only an opaque reservation ID and verified `https://checkout.stripe.com/...` test URL. The browser return path never marks a reservation paid.

## Stripe webhook endpoint

`POST /api/webhooks/stripe` reads a bounded raw body and verifies `Stripe-Signature` before parsing through Stripe's SDK. It rejects live-mode event envelopes and live-mode Checkout Session objects.

For supported Checkout events, the Worker reconciles reservation ID, event ID, Checkout Session ID, expected integer-cent amount, currency, session state, payment state, and PaymentIntent identity. Only a matching paid session can transition a reservation to `paid`. Mismatches become `payment_review` with an operator-facing D1 alert. Expired sessions become `expired`.

`banquet_webhook_events.stripe_event_id` is the idempotency key. Event recording and the corresponding reservation state change run in one D1 batch. Only a SHA-256 digest of the verified payload is stored; raw webhook bodies are not persisted.

## Local commands

```bash
cp .dev.vars.example .dev.vars
npm run banquet:db:migrate
BANQUET_REGISTRATION_PREVIEW=true BANQUET_PREVIEW_TICKET_PRICE_CENTS=8500 npm run build
npx wrangler dev --local --config wrangler.banquet-preview.jsonc
```

Use a Stripe CLI test-mode listener only if an end-to-end Stripe review is intentionally being performed. Never substitute live credentials or add `--remote` to the D1 command.

Validation commands:

```bash
npm run banquet:check
npm run banquet:test
npx wrangler deploy --dry-run --config wrangler.banquet-preview.jsonc
```

The Workers-runtime tests apply the entire proposed migration sequence to an isolated local D1 database. They inject Checkout Session creation at the outbound network boundary while exercising the real Stripe SDK/Web Crypto webhook signature verifier.

## Deferred work

CSV export is not implemented. It remains gated on approved operator authentication, authorization, retention, and spreadsheet-injection protections. Abuse controls and real test-mode Stripe end-to-end review also remain launch gates.

Before production launch, review and promote migrations through the approved process, configure distinct production resources and secrets, replace the build-time preview gate with the approved registration-state design, and keep the experience on the existing 2027 event page. None of those actions are authorized by Phase 2.
