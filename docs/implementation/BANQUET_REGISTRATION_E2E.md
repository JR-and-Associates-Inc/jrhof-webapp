# Banquet Registration Stripe Test-Mode E2E Review

## Scope and safety boundary

This procedure reviews the banquet flow entirely on localhost with Stripe test mode and Wrangler-local D1. It must not deploy a Worker, create a public preview URL, use `--remote`, attach a route/domain, or use any key beginning with `sk_live_`, `rk_live_`, or `pk_live_`.

The primary procedure below is localhost-only. A separate remote procedure appears later for the isolated Workers preview; it is allowed only with the preview D1 database, Stripe test credentials, the exact origin allowlist, and Cloudflare Access plus an approved-email allowlist for board data. The current D1 values are unapproved fixtures, not event facts.

Use synthetic contact and attendee information. Never enter a real card number, retain screenshots containing personal information, paste secrets into issue trackers or chat, or commit `.dev.vars`. This procedure tests software behavior; it does not approve pricing, capacity, public copy, receipt behavior, refunds, cancellation terms, privacy language, or launch.

## Preconditions

- The reviewer has identified the exact candidate branch/commit and confirmed the worktree contains no unrelated changes.
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
  --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,payment_intent.payment_failed,payment_intent.canceled,charge.refunded,charge.dispute.created \
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
BANQUET_REGISTRATION_PREVIEW=true npm run build
npx wrangler dev --local --port 8787 --config wrangler.banquet-preview.jsonc
```

Open only:

`http://127.0.0.1:8787/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/`

The displayed amount is the synthetic integer-cent value in the local `preview_unapproved` D1 fixture. It is not an approved or public price.

## Review scenarios

### Successful test payment

1. Enter synthetic purchaser and attendee data, exercise both meal choices, and optionally add a small test donation.
2. Confirm the browser subtotal/total changes as expected.
3. Submit once and confirm redirect only to `https://checkout.stripe.com/` with a `cs_test_` session.
4. Complete Checkout using a Stripe-published successful test payment method. Never use a real payment method.
5. Confirm the browser returns to the dedicated registration route on localhost and initially says it is checking the server-confirmed state—not that the return URL proves payment.
6. Confirm terminal A forwarded `checkout.session.completed` and Wrangler returned `200`.
7. Confirm the page changes to “Test payment confirmed” only after `GET /api/banquet/confirmation` reads the verified paid D1 state.
8. Inspect `window.dataLayer` and confirm exactly one `registration_complete` event with only the opaque transaction reference, value, currency, event ID, `payment_status=paid`, and `test_mode=true`. It must contain no Stripe Session/PaymentIntent ID or purchaser/attendee/meal/dietary/seating data.
9. Refresh once and confirm session deduplication prevents a second completion event.
10. Confirm logs contain request IDs and opaque record IDs but no names, email, phone, seating notes, addresses, secrets, signatures, or request bodies.

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
3. Confirm return to the dedicated localhost registration route and no paid state transition.
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

## Remote preview test-mode review (optional, isolated)

The scenarios above run entirely on localhost. When a remote test-mode rehearsal is authorized, use the two isolated preview configs — never production `wrangler.jsonc`, and never live keys:

- `wrangler.banquet-remote-preview.jsonc`: public guest registration, confirmation, and Stripe webhook.
- `wrangler.banquet-board-preview.jsonc`: whole-origin Cloudflare Access-protected board review, dashboard, and CSVs.

Both are unlinked `*.workers.dev` Workers with no route or custom domain, so `jrhof.org` and the production Worker are untouched. They share only the isolated preview D1 database. The public Worker redirects board routes to the protected Worker; Stripe sends signed test webhooks only to the public Worker.

One-time setup (operator; placeholders only, nothing secret is committed):

```bash
# [DONE 2026-07-05] Remote PREVIEW D1 already provisioned:
#   database jrhof-banquet-registration-preview
#   id ff728300-e862-4ead-83bb-91cddd86967e (already in the config)
#   migrations 0000-0003 were applied and verified at that rehearsal.
# Apply and verify the later 0004, 0005, and 0006 migrations before this candidate deploy.
# To recreate from scratch only if it is ever deleted:
wrangler d1 create jrhof-banquet-registration-preview
# Put the new isolated preview id in the remote-preview config, then:
wrangler d1 migrations apply jrhof-banquet-registration-preview \
  --remote --config wrangler.banquet-remote-preview.jsonc
wrangler d1 migrations list jrhof-banquet-registration-preview \
  --remote --config wrangler.banquet-remote-preview.jsonc

# Upload Stripe TEST-MODE secrets and the exact board allowlist as encrypted
# Worker secrets (never in committed files). Repeat for both remote configs.
wrangler secret put STRIPE_SECRET_KEY --config wrangler.banquet-remote-preview.jsonc # sk_test_… only
wrangler secret put STRIPE_WEBHOOK_SECRET --config wrangler.banquet-remote-preview.jsonc # whsec_… only
wrangler secret put BOARD_REPORT_ALLOWED_EMAILS --config wrangler.banquet-remote-preview.jsonc
wrangler secret put STRIPE_SECRET_KEY --config wrangler.banquet-board-preview.jsonc # same sk_test_… only
wrangler secret put STRIPE_WEBHOOK_SECRET --config wrangler.banquet-board-preview.jsonc # runtime gate only
wrangler secret put BOARD_REPORT_ALLOWED_EMAILS --config wrangler.banquet-board-preview.jsonc

# Set exact ACCESS_TEAM_DOMAIN and ACCESS_AUD values in both remote configs.
# Build, verify, and deploy only to the two workers.dev preview surfaces:
BANQUET_REGISTRATION_PREVIEW=true npm run build
node scripts/test-banquet-registration-route.mjs --enabled
npm run validate
wrangler deploy --dry-run --config wrangler.banquet-remote-preview.jsonc
wrangler deploy --dry-run --config wrangler.banquet-board-preview.jsonc
wrangler deploy --config wrangler.banquet-remote-preview.jsonc
wrangler deploy --config wrangler.banquet-board-preview.jsonc
```

Confirm the printed `https://…workers.dev` origin exactly matches `BANQUET_ALLOWED_ORIGINS`, `BANQUET_SUCCESS_URL`, and `BANQUET_CANCEL_URL`; correct and redeploy if needed.

The remote `STRIPE_WEBHOOK_SECRET` is the signing secret of a Stripe **test-mode** webhook endpoint (Dashboard → Developers → Webhooks, test mode) targeting `https://<name>.<subdomain>.workers.dev/api/webhooks/stripe`. Subscribe it to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`, and `charge.dispute.created`. The localhost `stripe listen` secret does not apply to the remote endpoint.

Run the same success, cancel, and expiry scenarios against the workers.dev URL. Inspect only non-PII state, now with `--remote`:

```bash
wrangler d1 execute jrhof-banquet-registration-preview \
  --remote --config wrangler.banquet-remote-preview.jsonc \
  --command "SELECT status, attendee_count, expected_total_cents, amount_paid_cents, currency, payment_verified_at IS NOT NULL AS verified FROM banquet_reservations ORDER BY created_at DESC LIMIT 1"
```

Stop immediately if any key, session, PaymentIntent, or event reports `livemode: true`. To decommission, delete both preview Workers before deleting the preview D1 database. Production behavior does not change in any step here.

### Remote preview run evidence — 2026-07-05 (redacted)

- Worker: `jrhof-banquet-registration-remote-preview`, version `29cf3abb…`, origin `https://jrhof-banquet-registration-remote-preview.jr-and-associates-inc.workers.dev`.
- Owner re-approved running the test-mode write API without Cloudflare Access (test mode only, origin-gated, rate-limited).

| Check | Result |
| --- | --- |
| Guarded preview build contains the draft form | PASS |
| Preview Worker deployed (preview config only, no production) | PASS |
| Origin placeholders replaced with live workers.dev origin + redeploy | PASS |
| Live event page returns `200` with guarded form | PASS |
| `POST /api/banquet/checkout` before secrets → `503 preview_runtime_not_configured` (fail-closed) | PASS |
| Stripe test-mode secrets set as Worker secrets (`sk_test_`/`whsec_`) | PASS (owner-set) |
| Synthetic test-card checkout → `checkout.session.completed` webhook `200` | PASS |
| D1 reservation reconciliation | PASS — `status=paid`, `attendee_count=2`, `expected_total_cents=17000` == `amount_paid_cents=17000`, `currency=usd`, `verified=1` |
| Webhook idempotency / no mismatch alerts | PASS — 1 `checkout.session.completed` row, `banquet_payment_alerts=0` |
| No synthetic PII displayed in verification (opaque/aggregate columns only) | PASS |
| Success return state (`?checkout=success`) hides form, shows confirmation panel | PASS (live) |
| Cancel return state (`?checkout=canceled`) shows canceled notice, keeps form | PASS (live) |
| Production `wrangler.jsonc` / Worker / jrhof.org unchanged; no live keys; no migration promotion | PASS |

### Board-candidate remote run evidence — 2026-08-05 (redacted)

- Public Worker: `jrhof-banquet-registration-remote-preview`, version `d00206e2…`.
- Protected board Worker: `jrhof-banquet-registration-board-preview`, version `b47a598a…`.
- Cloudflare Zero Trust Free is active at `$0/month`; the Access application covers the entire board Worker and allows only the three owner-approved email identities through one-time PIN.
- Production `jrhof.org`, the production Worker, routes, DNS, and live Stripe configuration were not changed.

| Check | Result |
| --- | --- |
| Public registration route and D1 configuration | PASS — `200`, test mode, `preview_unapproved`, Chicken and Steak |
| Public board route | PASS — `302` to the dedicated board Worker |
| Board Worker without an Access session | PASS — `302` to the JRHOF Access login |
| Public unsigned webhook request | PASS — rejected with `400 stripe_signature_required`, not intercepted by Access |
| Fresh synthetic Checkout | PASS — Stripe Sandbox, two `$85` seats plus `$5` test donation |
| Browser completion trust boundary | PASS — “Test payment confirmed” appeared only after the signed webhook reconciled D1 |
| D1 reservation reconciliation | PASS — `status=paid`, `payment_status=paid`, 2 attendees, `17500` expected and paid cents, `500` donation cents |
| Meal reconciliation | PASS — 1 Chicken and 1 Steak |
| Attribution reconciliation | PASS — `board_review / internal / board_final_approval` |
| Webhook and alert state | PASS — `checkout.session.completed`, `livemode=0`, `outcome=applied`, zero unresolved alerts |
| Production isolation | PASS |

The remote D1 contains only this current synthetic rehearsal record. Earlier synthetic preview rows were exported to an ignored owner-only `0600` backup and removed before this run.

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
