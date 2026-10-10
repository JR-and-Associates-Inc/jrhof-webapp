# Event Registration

This branch replaces Eventbrite registration with hosted Stripe Checkout, starting with the 2027 Hall of Fame Induction Banquet. Stripe is the durable registration store; there is no D1 database. Golf still uses Eventbrite until its event is explicitly moved to this flow.

## Demo setup

The board meeting is Sunday, October 11, 2026 at 7:00 p.m. Mountain time. Rehearse before the call with fictional guest details and Stripe sandbox cards.

The JR and Associates branch preview was confirmed in the Cloudflare deployment comment on PR #76 on October 10, 2026:

- Site: https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev/
- Form: https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/
- Board: https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev/board/

Preview branch builds already work. Confirm the latest commit in the deployment comment after each push. Use the `jr-and-associates-inc` preview, rather than the mirror in TMCO's account. `main` must stay the production branch. Non-production branches must upload versions, not deploy them to jrhof.org.

### 1. Google login method

1. In **Cloudflare Zero Trust → Settings → Authentication → Login methods**, add **Google**. Note the team domain, `jrhof.cloudflareaccess.com`.
2. In a Google Cloud project owned by the JRHOF Google Workspace organization, configure **Google Auth Platform** (formerly OAuth consent screen) with audience **Internal**. Use an organization's administrator if the Internal choice is unavailable.
3. Create an OAuth client, type **Web application**. Its authorized redirect URI is `https://jrhof.cloudflareaccess.com/cdn-cgi/access/callback`.
4. Copy the client ID and client secret directly into the Cloudflare Google login method, then test it with an `@jrhof.org` account. Never put the client secret in this repository or chat.

### 2. Protect only the board

In **Cloudflare Zero Trust → Access → Applications**, create a **Self-hosted** application named **JRHOF Board**. Add these host/path entries (the UI may call them Public hostnames):

| Host | Path |
| --- | --- |
| `feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev` | `board` |
| `feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev` | `board/*` |
| `jrhof.org` | `board` |
| `jrhof.org` | `board/*` |

These cover `/board`, `/board/`, and every dashboard, export, kitchen sheet, and guest edit. Use one Access application so all four entries share the same Audience tag. Do not make a host-only application: that would gate the whole website.

- Allowed identity providers: **Google only**. Disable “Accept all available identity providers.” Do not include one-time PIN.
- Allow policy: **Include → Emails ending in → `@jrhof.org`**, and **Require → Login methods → Google**. For access limited to the actual board roster, instead Include the individual board addresses and Require emails ending in `@jrhof.org` as well as Google. A domain rule alone allows all accounts in the domain.
- Session duration: **12 hours**.
- Copy the application's **Application Audience (AUD) tag** from its overview. This value is not a secret.

Leave the Workers **whole-preview Access protection** toggle off. If an existing host-wide preview Access application gates this preview, replace that scope with these board paths. The homepage, event pages, registration form, confirmation, and `/api/registration/*` remain public. The webhook must be reachable by Stripe without Google login.

The Worker independently verifies the Access assertion's RSA signature, issuer, audience, expiry, and exact email domain. A missing policy on an alternate Worker URL therefore cannot expose board data. Without the matching assertion it returns 401. There is no shared board password or local login bypass. Google-only authentication is enforced by the Access application's identity-provider settings.

### 3. Runtime values

On **Workers & Pages → jrhof-webapp**, add these runtime bindings. These are **Worker runtime secrets**, not Workers Builds variables, Astro `PUBLIC_*` values, or Cloudflare Pages Preview variables. For the board configuration, Secret storage is used to preserve the bindings across Wrangler version uploads; their values themselves are non-sensitive.

| Name | Type | Value |
| --- | --- | --- |
| `STRIPE_PREVIEW_SECRET_KEY` | Secret | A sandbox restricted key (`rk_test_…` preferred), or a compatible existing test key (`sk_test_…`). Checkout Sessions and PaymentIntents: read/write. Charges: read. |
| `BOARD_ACCESS_TEAM_DOMAIN` | Secret binding | `jrhof.cloudflareaccess.com` without `https://` or a path |
| `BOARD_ACCESS_AUD` | Secret binding | The JRHOF Board application's Audience tag |
| `STRIPE_PREVIEW_WEBHOOK_SECRET` | Secret | The preview webhook's signing secret, `whsec_…`, from step 4 |

A separate Stripe sandbox isolates practice data and settings from live mode. An existing test environment can be kept for continuity. No publishable Stripe key is needed: payment happens on Stripe's hosted checkout.

**Important Workers version behavior:** when the latest version is a preview, ordinary `wrangler secret put` or a dashboard secret edit can fail because the latest version isn't deployed. Do not deploy that preview to production to fix it. From an authenticated local terminal in the repository, use version-only commands instead:

```bash
npx wrangler versions secret put STRIPE_PREVIEW_SECRET_KEY
npx wrangler versions secret put BOARD_ACCESS_TEAM_DOMAIN
npx wrangler versions secret put BOARD_ACCESS_AUD
npx wrangler versions secret put STRIPE_PREVIEW_WEBHOOK_SECRET
```

Each command prompts for its value and creates a version without routing production traffic to it. Never put a key on a command line. Then rebuild the registration branch in Workers Builds (or push its next commit) so the branch alias gets the new code and bindings. Verify that version has all four bindings. If CLI authentication is needed, the account owner runs `npx wrangler login` on their own computer.

Workers previews share Worker bindings; they do not have Pages-style independent Preview secret settings. The code prefers `STRIPE_PREVIEW_SECRET_KEY` on all `*.workers.dev` URLs and rejects live keys there. If that binding is absent, the preview can reuse the earlier `STRIPE_SECRET_KEY` binding only when it contains a test key (`sk_test_` or `rk_test_`). An explicitly configured preview key always takes precedence; an invalid/live preview key fails closed. Before production receives a live key, add the separate preview test key so rehearsals keep working. Unknown hosts cannot create checkout.

`BOARD_PASSWORD` and `BOARD_SESSION_SECRET` are no longer used. Old versions may still require them; remove obsolete bindings only after those versions are retired.

### 4. Stripe webhook

In the same Stripe sandbox, **Workbench → Webhooks** (or **Event destinations**), create a webhook endpoint:

`https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev/api/registration/webhook`

Subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Save its signing secret as `STRIPE_PREVIEW_WEBHOOK_SECRET`, then rebuild the preview. This is required for the demo's payment-event logs and before live launch. The webhook verifies the raw request signature with a five-minute tolerance and rejects mismatched live/test events. It rereads payment status from Stripe; an unpaid completion never counts as paid. Retries can repeat an audit entry with the same Stripe event ID but do not create registrations or payments. Stripe is the durable store, and the board does not depend on the purchaser visiting the confirmation page or on the logs.

## Rehearse the demo

1. In an incognito browser, open the site and registration form. Neither should ask for login. The form should show **TEST MODE**, and should work before November 16 because test mode ignores the opening date.
2. Register fictional guests, choose different meals, and optionally add a donation. Pay with `4242 4242 4242 4242`, any future expiry, and any CVC. Confirm the total on Stripe and the returned confirmation page.
3. Open `/board/`. Sign in with an `@jrhof.org` Google account. Confirm no shared password or email PIN is requested. A personal Gmail account must be denied.
4. Check seats, meals, donations, and the order. Download both CSVs and print the kitchen sheet. Edit one guest's meal and verify the counts change.
5. Start another checkout and cancel. It appears under **Paying right now** until its 31-minute expiry, then **Started but did not finish**. Its contact and guest details remain in **Download all registrations (CSV)**. It does not count as a paid attendee.
6. In Stripe, refund a test order. Reload the board and confirm its status and counts. After a partial seat refund, use **Edit guests** to remove the cancelled guest.
7. Check the webhook delivery in Stripe is 200, and Worker logs show `registration_payment_event`. Logs contain event/session IDs and status, not guest names, emails, phone numbers, or dietary notes.
8. Open a commit preview or the Worker's default hostname without signing in: board exports must remain inaccessible. Only the configured branch/production board hosts provide the Google login screen; other URLs fail closed.

## Registration records and exports

A successfully created Checkout Session records purchaser contact information, guest names/meals/dietary notes, seating request, and donation. The same details are copied to the PaymentIntent for successful payments. Board edits update the PaymentIntent; the current attendee list uses those edits. The session retains the original submission. Forms rejected before Stripe creates a session are not durable registrations and are not saved.

| Board action | Contents |
| --- | --- |
| Dashboard | Paid orders, refunds, disputes, processing/open/abandoned checkouts, seats and meal counts |
| Download attendee list (CSV) | One row per current guest on attending or fully refunded orders. Refunded guests are marked not attending. |
| Download all registrations (CSV) | One row per checkout, including pending, abandoned, and refunded registrations, guest details, contacts, amounts, status, and session/payment IDs. |
| Kitchen sheet | Attending guests, meal counts, and dietary notes |
| Edit guests | Correct names/meals or remove a cancelled guest from paid orders |
| Open in Stripe | Accounting record, refunds, and disputes |

CSV values are quoted and spreadsheet formulas neutralized. All board responses and registration APIs send `Cache-Control: no-store`. Board pages are not indexed. Stripe provides durable records; Worker observability logs are diagnostic, with retention determined by Cloudflare. Export files contain personal information and should be handled by the board according to its retention policy.

## Production launch

The proposed banquet price is **$50**, not yet approved. Public event pages hide it and live checkout is blocked while `priceApproved` is false. Test checkout remains available. The demo uses a direct form link; the production event's Register button stays closed until its event record is opened.

Before launch:

1. Record board approval of price, capacity, meals, refund text, registration privacy disclosure, and data retention. Settings live in `src/data/registrations.ts`; set `priceApproved: true` only after approval.
2. Complete the demo checklist and approve/merge PR #76 through the normal release process. Merging to `main` deploys to production.
3. Confirm the Google-only Access policy on `jrhof.org/board` and `jrhof.org/board/*` and its matching Worker audience.
4. In live Stripe, create a restricted key with the same permissions and a **separate live webhook** for `https://jrhof.org/api/registration/webhook`, subscribing to the same events. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for the production version. Preserve the two preview secrets. Confirm successful-payment/refund emails, branding, support information, and team access. Require strong two-factor authentication for Stripe users.
5. On **Monday, November 16, 2026**, open the event record (`registration.status: 'open'`, `status: 'registration-open'`) and verify checkout with an approved production purchase/refund. The server enforces the opening date and price approval independently of the button.
6. Recheck preview checkout still uses test mode. Production and previews must use their matching webhook secrets.
7. Confirm the board export and kitchen-sheet workflow before selling real seats. Name the refund/support owner and schedule registration exports and retention cleanup.

Only an authorized production release should deploy a new Worker version. To pause live registration, remove the live Stripe key or release an explicit server-side closure; hiding a Register button alone does not disable the direct form/API. Worker rollback does not undo Stripe payments or metadata edits.

After January 29, registration closes automatically. After the event/refund period, remove personal registration metadata from **both Checkout Sessions and PaymentIntents**, including abandoned checkouts and original submissions. Retain the payment records needed for accounting and manage exported files on the same retention schedule. This cleanup is an operational task, not an automatic feature.

## Local testing and implementation

Copy `.dev.vars.example` to `.dev.vars` (gitignored), add a test credential, then run `npm run preview` at http://localhost:8787. Public checkout works locally; Google board login is rehearsed on the Cloudflare preview. `npm run dev` serves Astro only and has no Worker endpoints. `npm run verify` checks the static site and runs Worker tests against fake Stripe and signed Access assertions. No test moves money.

| File | Purpose |
| --- | --- |
| `src/data/registrations.ts` | Price, approval, capacity, meals, dates, refund policy |
| `worker/index.ts` | Public APIs, signed webhook, board routes, preview key selection |
| `worker/access.ts` | Access JWT verification and exact `@jrhof.org` domain restriction |
| `worker/webhook.ts` | Stripe webhook signature verification |
| `worker/stripe.ts` | Stripe REST client pinned to `2026-08-26.dahlia` |
| `worker/orders.ts` | Orders, totals, capacity, attendee/all-registration CSVs |
| `worker/board.ts` | Board HTML and print views |
| `worker/validation.ts` | Validates forms and encodes guest metadata |
| `scripts/test-registration-worker.mjs` | Authentication, checkout, exports, edits, webhook and isolation tests |

Stripe is read live on each board request. The public seat count is cached for 30 seconds; checkout recounts. Capacity is checked, not transactionally locked: simultaneous buyers can oversell, especially because open checkouts can hold at most 15% of capacity to limit abuse. Resolve this before promising a hard inventory limit; D1/Durable Object reservation locking would be a separate design change. Checkout is rate limited to 5 attempts per minute per visitor. Delayed payment methods remain processing until Stripe resolves them.

Golf can reuse the form/Worker by adding a registration record and linking its event. Remove its Eventbrite link only when that migration is ready. The earlier D1 prototype is archived at `archive/banquet-registration-checkout-2026-08-05`; its preview Workers are not used by this branch.
