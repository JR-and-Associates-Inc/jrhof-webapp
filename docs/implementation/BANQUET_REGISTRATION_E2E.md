# Banquet Registration Stripe Test-Mode E2E Review

## Scope and safety boundary

This procedure reviews the banquet flow entirely on localhost with Stripe test mode and Wrangler-local D1. It must not deploy a Worker, create a public preview URL, use `--remote`, attach a route/domain, or use any key beginning with `sk_live_`, `rk_live_`, or `pk_live_`.

The protected feature preview URL is a separate UI-only review surface. Its exact Cloudflare feature-branch build displays the guarded form with an illustrative `8500`-cent ticket price, but it intentionally has no remote Stripe secrets, D1 binding, or banquet API Worker. Do not attempt the Stripe scenarios below against that remote URL; execute them only through the localhost Worker flow.

Use synthetic contact and attendee information. Never enter a real card number, retain screenshots containing personal information, paste secrets into issue trackers or chat, or commit `.dev.vars`. This procedure tests software behavior; it does not approve pricing, capacity, public copy, receipt behavior, refunds, cancellation terms, privacy language, or launch.

## Preconditions

- The current branch is `feature/banquet-registration-checkout`, clean, and synchronized.
- `npm run check`, `npm run build`, `npm run validate`, and `npm run banquet:test` pass.
- The production-default build leak check passes.
- `git diff 696e7e629dcfbf303af6bc254933e36460e6023c -- wrangler.jsonc` is empty.
- The Stripe CLI is installed and authenticated to the JRHOF Stripe sandbox/test environment.
- A temporary test secret key beginning with `sk_test_` is available outside Git.
- The reviewer understands that all D1 records created here are local test records and may contain only synthetic PII.

Stop immediately if any credential, Checkout Session, PaymentIntent, or event reports `livemode: true`.

## Start the local webhook listener

In terminal A:

```bash
stripe login
stripe listen \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.expired \
  --forward-to http://127.0.0.1:8787/api/webhooks/stripe
```

Stripe prints a temporary webhook signing secret beginning with `whsec_`. Keep terminal A open. Do not copy the secret into documentation or shell history.

## Start the full-stack preview

In terminal B:

```bash
cp .dev.vars.example .dev.vars
chmod 600 .dev.vars
```

Edit `.dev.vars` locally and replace only the placeholders with the temporary `sk_test_` key and the `whsec_` value printed by terminal A. Confirm both prefixes without printing the values.

Then run:

```bash
npm run banquet:db:migrate
BANQUET_REGISTRATION_PREVIEW=true BANQUET_PREVIEW_TICKET_PRICE_CENTS=8500 npm run build
npx wrangler dev --local --port 8787 --config wrangler.banquet-preview.jsonc
```

Open only:

`http://127.0.0.1:8787/events/induction-banquet/2027-hall-of-fame-induction-banquet/`

The displayed `$85.00` is an illustrative test fixture, not an approved public price.

## Review scenarios

### Successful test payment

1. Enter synthetic purchaser and attendee data, exercise both meal choices, and optionally add a small test donation.
2. Confirm the browser subtotal/total changes as expected.
3. Submit once and confirm redirect only to `https://checkout.stripe.com/` with a `cs_test_` session.
4. Complete Checkout using a Stripe-published successful test payment method. Never use a real payment method.
5. Confirm the browser returns to the existing 2027 event page on localhost.
6. Confirm terminal A forwarded `checkout.session.completed` and Wrangler returned `200`.
7. Confirm logs contain request IDs and opaque record IDs but no names, email, phone, seating notes, addresses, secrets, signatures, or request bodies.

Inspect only non-PII local state:

```bash
npx wrangler d1 execute jrhof-banquet-preview-local \
  --local --config wrangler.banquet-preview.jsonc \
  --command "SELECT status, attendee_count, expected_total_cents, amount_paid_cents, currency, payment_verified_at IS NOT NULL AS verified FROM banquet_reservations ORDER BY created_at DESC LIMIT 1"
```

Expected: `status=paid`, expected and paid cents match, currency is `usd`, and `verified=1`.

### Browser cancel/back path

1. Create another synthetic registration and reach Stripe Checkout.
2. Use Checkout's back/cancel control without paying.
3. Confirm return to the existing localhost event page and no paid state transition.
4. Do not interpret this software path as an approved cancellation or refund policy.

### Session expiry

1. Create a new test Checkout Session and record only its `cs_test_` identifier.
2. While the session remains open, expire it through Stripe's test-mode Checkout Session expiration API or Workbench action.
3. Confirm terminal A forwards `checkout.session.expired` and Wrangler returns `200`.
4. Query only status for the corresponding opaque reservation and confirm `expired`, never `paid`.

### Failure and tampering checks

- Submit a ninth attendee and confirm the browser blocks it; separately retain the automated server test proving the Worker rejects counts outside 1–8.
- Confirm browser totals are absent from the checkout request payload and server values determine the Stripe amount.
- Confirm a malformed request, oversized request, invalid meal, out-of-range donation, and disallowed origin receive generic bounded errors.
- Send enough synthetic checkout attempts to observe a `429` plus `Retry-After: 60`; do not use production traffic or shared staff networks for load testing.
- Run `npm run banquet:test` for exact duplicate delivery, altered event-ID replay conflict, amount mismatch, livemode rejection, and transactional state assertions. A local Stripe CLI listener is not a public registered endpoint, so these deterministic replay cases remain part of the automated harness rather than a public webhook resend exercise.

## Evidence to retain

Record only:

- date, reviewer, commit hash, Stripe CLI version, Node version, and Wrangler version;
- pass/fail for each scenario;
- opaque `cs_test_`, `evt_`, and reservation IDs only if needed for troubleshooting;
- redacted screenshots that contain no synthetic or real PII and no secrets;
- relevant `X-Request-ID` values and PII-free structured log events.

Do not retain `.dev.vars`, secret values, raw webhook payloads, card/payment-method details, or exported local D1 files. Delete `.dev.vars` after review and stop both local processes.

## Completion rule

E2E review is complete only when every scenario passes on the same commit and the board/staff checklist is reviewed. A passing test-mode review does not authorize deployment or public exposure.
