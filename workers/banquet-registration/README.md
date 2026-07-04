# Banquet Registration Worker — Phase 1 Design Stub

This directory is intentionally documentation-only. It is not a Worker entrypoint, is not referenced by `wrangler.jsonc`, and cannot receive requests. The existing Astro + Workers Static Assets build remains asset-only.

## Proposed Phase 2 runtime boundary

After approval, add a reviewed Worker entrypoint and limit Worker-first routing to narrow API paths. Static asset handling and every existing public route should remain unchanged.

Proposed preview-only bindings and secrets:

- `BANQUET_DB`: isolated preview D1 database; never the production database.
- `STRIPE_SECRET_KEY`: Stripe test-mode Worker secret; never committed or exposed to the browser.
- `STRIPE_WEBHOOK_SECRET`: Stripe test webhook signing secret; never committed.
- Non-secret, server-authoritative event configuration for event ID, registration window, capacity, meal options, ticket price in cents, donation limits, and allowed origins.

Do not add routes, custom domains, DNS changes, or live credentials as part of Phase 2.

## `POST /api/banquet/checkout`

Purpose: validate a registration, reserve capacity in D1, and create a Stripe test-mode Checkout Session.

Request body shape:

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

Do not accept ticket price, ticket subtotal, total, payment status, capacity, or Stripe IDs from the browser.

Required server flow:

1. Require HTTPS, `POST`, an exact JSON content type, a bounded request body, and an approved preview origin.
2. Apply approved abuse controls before expensive Stripe work.
3. Parse and validate the entire payload; reject unknown fields and normalize strings conservatively.
4. Load the authoritative event configuration and confirm registration is open in the preview environment.
5. Validate 1–8 attendees, approved meal choices, donation bounds, and capacity.
6. Calculate ticket subtotal and total in integer cents on the server.
7. Generate reservation/attendee IDs with Web Crypto and insert a pending reservation plus all attendees transactionally.
8. Create a Stripe test-mode Checkout Session. Put only opaque `event_id` and `reservation_id` values in Stripe metadata and `client_reference_id`; never put contact or attendee PII in metadata.
9. Store the returned Checkout Session ID and expiry in D1.
10. Return a same-origin JSON response containing only the Stripe-hosted Checkout URL and opaque reservation ID. Add `Cache-Control: no-store`.

If Stripe session creation fails after the pending insert, record a server-controlled failure/expiry state or remove the uncommitted reservation according to the final transaction design. Never mark a registration paid from the checkout response or success-page redirect.

Example success response shape:

```json
{
  "reservationId": "opaque-server-generated-id",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

## `POST /api/webhooks/stripe`

Purpose: translate verified Stripe events into server-verified D1 payment state.

Required behavior:

1. Read a bounded raw request body; do not parse JSON before signature verification.
2. Verify `Stripe-Signature` with the preview webhook secret and a supported tolerance.
3. Insert the Stripe event ID into a dedicated idempotency store/table before applying state changes. The final migration for that table belongs in Phase 2.
4. For a completed Checkout Session, locate the reservation by opaque metadata/session ID and verify event ID, test-mode livemode flag, currency, expected amount, payment status, and Checkout/PaymentIntent identifiers against D1.
5. Mark paid only after all checks succeed. Amount or identity mismatches enter `payment_review` and create an operator alert; they never silently become paid.
6. Handle session expiry and approved refund event types with explicit, tested state transitions.
7. Return a small response promptly and use structured, PII-minimized logs. Every Promise must be awaited, returned, or passed to `ctx.waitUntil()`.
8. Add `Cache-Control: no-store`. Never expose webhook verification errors, secrets, or record contents to clients.

Webhook delivery is the payment authority. The browser return page is informational and must never update payment state.

## `GET /api/admin/banquet/export.csv`

This endpoint is a later launch gate, not a public Phase 2 endpoint. It must be protected by approved operator authentication/authorization and query only server-verified D1 records.

Export requirements:

- default to paid/server-verified reservations;
- allow only an allowlisted event and report type;
- use UTF-8, deterministic columns, quoted fields, and CRLF line endings if Excel compatibility is approved;
- neutralize spreadsheet-formula prefixes (`=`, `+`, `-`, `@`, tab, and carriage return) in user-controlled cells;
- set `Content-Type: text/csv; charset=utf-8`, `Content-Disposition`, and `Cache-Control: no-store`;
- record an access audit event without logging the exported PII;
- enforce the approved privacy, access, and retention policy.

## Static Assets compatibility

Phase 2 may add a Worker entrypoint only after a dry-run confirms that normal routes continue to resolve through the existing `env.ASSETS` binding. Worker-first execution should be limited to reviewed `/api/...` patterns. Do not add a second Pages project, attach a domain, or change production routing to test this feature.

Before any runtime configuration is committed, verify the current Wrangler schema and Cloudflare Workers Static Assets documentation, generate binding types with Wrangler, and test preview and production-default builds separately.
