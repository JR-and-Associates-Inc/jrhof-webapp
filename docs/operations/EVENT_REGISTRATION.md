# Event Registration

Online registration for JRHOF events (first used for the 2027 Hall of Fame Induction Banquet). It replaces Eventbrite. Stripe is the only place registrations are stored.

## How it works

1. A guest opens the event page and chooses **Register now**. The registration form (`src/pages/events/[eventType]/[slug]/register.astro`) collects:
   - the purchaser's name, email, and phone
   - up to 8 guests, each with a full name, a meal choice, and an optional dietary note
   - an optional seating request
   - an optional donation
2. The form posts to `/api/registration/checkout`. That request is handled by the `jrhof-webapp` Worker (`worker/`), which:
   - checks the dates and the seats left
   - validates every field
   - sets the price itself; the browser never sends a price
   - creates a Stripe Checkout Session with one line item per guest (for example, "Banquet seat for Pat Smith (Chicken)") plus the donation, so the purchaser's Stripe receipt lists every guest and meal
3. The guest pays on Stripe's checkout page (card, Apple Pay, or Google Pay). Stripe emails the receipt.
4. Stripe returns the guest to `/registration/confirmed/?cs={CHECKOUT_SESSION_ID}`. That page asks the Worker, which asks Stripe, whether the session is paid. Only then does it show the confirmation and fire `registration_complete`.
5. The board opens `https://jrhof.org/board/`. It shows live totals, meal counts, orders, refunds, the kitchen sheet, and the attendee CSV. Every page reads Stripe on each visit, so nothing can drift out of sync.

Guest names, meals, and dietary notes are saved on the Stripe payment's metadata as `guest_1_name`, `guest_1_meal`, `guest_1_dietary`, and so on. They are readable in the Stripe Dashboard on each payment.

Settings live in one file, `src/data/registrations.ts`:

- seat price, and `priceApproved`
- capacity
- maximum guests per order
- meals
- open and close dates
- refund policy text
- whether the donation option is on

Both the form and the Worker read it.

**Seat price approval.** The 2027 banquet price, $50, is proposed and not yet approved by the board. While `priceApproved` is `false`:

- Public event pages say "To be announced" instead of a price, and the Event schema has no `offers`.
- The Worker refuses live-mode (real money) checkout.
- Stripe test mode works normally, so reviewers can go through the whole flow.

Set `priceApproved: true` (or change `seatPriceCents` first) only after the board records its decision.

| Path | Purpose |
| --- | --- |
| `src/data/registrations.ts` | Event registration settings |
| `worker/index.ts` | Routes: `/api/registration/{status,checkout,confirm}` and `/board/*`; everything else is static |
| `worker/validation.ts` | Form validation and guest metadata |
| `worker/orders.ts` | Turns Stripe sessions into orders, totals, capacity, and the CSV |
| `worker/board.ts` | Board pages (plain HTML, no scripts) |
| `worker/session.ts` | Board sign-in: password check and the signed 12-hour session cookie |
| `worker/stripe.ts` | Minimal Stripe REST client |
| `scripts/test-registration-worker.mjs` | Worker tests against a fake Stripe (`npm run test:worker`) |

## For board members

Open **https://jrhof.org/board/**. Cloudflare first asks for your email and sends a one-time code (only board members' addresses are allowed); then enter the board password. You stay signed in on that device for 12 hours; **Sign out** is at the top right. Changing `BOARD_PASSWORD` or the Stripe key signs everyone out.

| You want to… | Do this |
| --- | --- |
| See who is coming and the meal count | Open the dashboard. The top cards show seats sold, Chicken, Steak, money collected, and donations. |
| Give the hotel the headcount | Choose **Kitchen sheet** and print it. It lists meal totals, dietary notes, and every guest. |
| Get a spreadsheet | Choose **Download attendee list (CSV)**. You get one row per guest, with meal, dietary note, purchaser, email, phone, and paid status. Refunded guests are at the bottom, marked "Refunded - not attending". |
| Change a guest's name or meal | Choose **Edit guests** on the order, make the change, and save. |
| Refund a whole order | Choose **Open in Stripe**, then **Refund payment**. The dashboard marks it Refunded and removes its guests from the counts. Stripe emails the refund receipt. |
| Refund one guest | In Stripe, refund the price of one seat. Back on the dashboard, choose **Edit guests** and clear that guest. Until you do, the order shows under **Needs attention**. |
| A card was declined, or someone gave up | Nothing to do. No order exists, and any seat hold ends after 30 minutes. The dashboard lists these people under "Started but did not finish" if you want to follow up. |
| Someone disputes a charge | The order appears under **Needs attention**. Respond to the dispute in Stripe. |

A yellow **TEST MODE** banner means you are looking at practice orders made with Stripe's test cards.

## For the maintainer

### Local testing

1. Copy `.dev.vars.example` to `.dev.vars`.
2. Add a Stripe **test-mode** secret key (`sk_test_…`) and any 12+ character board password.
3. Run `npm run preview`. It builds the site, then serves the site and the Worker together at http://localhost:8787.
4. Pay with card `4242 4242 4242 4242`, any future expiry date, and any CVC.

In test mode the opening date is ignored, so you can rehearse before launch. The closing date still applies.

`npm run dev` (Astro only) shows the form but has no `/api` or `/board`.

### Secrets

These are set in Cloudflare on the `jrhof-webapp` Worker, never in Git:

| Secret | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe secret key, or a restricted key that has write access to Checkout Sessions and PaymentIntents. Test key for rehearsal; live key at launch. |
| `BOARD_PASSWORD` | 12+ characters. Share it with the board through a password manager or in person, not by email. |
| `BOARD_SESSION_SECRET` | Optional. A long random value that signs board sessions. Without it, `STRIPE_SECRET_KEY` is used, so replacing the Stripe key at launch signs the board out once. |

Without `STRIPE_SECRET_KEY`, the API answers "registration is not available" and the form says so, and `/board/` is closed. Without `BOARD_PASSWORD`, `/board/` is closed.

Board sessions are signed with the password plus the server secret, so a copied session cookie cannot be used to guess the password offline.

### Review on a preview URL

Review happens on a preview version of `jrhof-webapp` before anything reaches `main`. The repository rule (`docs/CLOUDFLARE.md`, "Previews") is that previews carrying secrets, admin routes, or personal data are protected with Cloudflare Access first. Set it up in this order:

1. ⚠ In Cloudflare, go to Workers & Pages → `jrhof-webapp` → Settings → Domains & Routes. Turn on Cloudflare Access for **Preview URLs**. Allow the reviewers' email addresses.
2. ⚠ Set the Worker secrets, `STRIPE_SECRET_KEY` with a **test** key (`sk_test_…`) and `BOARD_PASSWORD`. Never paste keys into chat or Git. Either:
   - in the Cloudflare dashboard (no API token needed): Workers & Pages → `jrhof-webapp` → Settings → Variables and Secrets → Add, type **Secret**, scoped to **Preview**. Use the Worker's runtime variables, not the Build variables. Then push the branch so the preview is rebuilt with them; or
   - with Wrangler: `npx wrangler secret put STRIPE_SECRET_KEY` and `npx wrangler secret put BOARD_PASSWORD`.

   Secrets belong to the whole Worker, not just one preview. The live site ignores them today, because the version deployed from `main` has no Worker script.
3. Push the branch. Workers Builds builds every pushed branch and gives it a branch preview address that stays the same after each push. For this branch the registration form is at `https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/`. The Cloudflare bot's comment on the pull request also lists it as "Branch Preview URL". Use the `jr-and-associates-inc` address, not a copy built in another Cloudflare account.
4. Reviewers sign in through Access and try the flow with test cards: the event page, the form, Stripe Checkout, the confirmation, and `/board/`. The test-mode banner appears on the form, the confirmation, and the board.
5. Each push rebuilds the preview at the same address.

**Changing a secret while previews exist.** Once preview versions are newer than the live version, `wrangler secret put` and the dashboard both refuse ("the latest version of your Worker isn't currently deployed"). Do **not** take the suggestion to deploy the latest version: that would put the preview live on jrhof.org. Instead, either:

- Run `npx wrangler versions secret put <NAME>`. It saves the secret in a new version without deploying anything. Or, without an API token:
- In the dashboard, open `jrhof-webapp` → Deployments, find the latest build of `main`, and choose **Retry build**. That redeploys the code already live, so the newest version is the deployed one again. Then add the secret under Settings → Variables and Secrets.

Then push the branch again (or wait for the next push), so the branch preview is rebuilt with the new value.

After the registration change merges and deploys, plain `wrangler secret put` works again.

**Seat count on the registration page.** The form asks the Worker how many seats are left so it can cap the guest rows or show "sold out". The Worker remembers that count for 30 seconds, so a burst of visitors doesn't turn into a burst of Stripe calls. Checkout always recounts exactly.

**Old test orders.** The Stripe test account also holds paid test orders from the retired D1 prototype (July–August 2026). They carry the same `banquet-2027` event ID but no `seats` metadata, so the board ignores them.

### Launch checklist (2027 banquet)

Ask TJ before each step marked ⚠: production, Stripe live mode, or Cloudflare changes.

1. After preview review, and once the board approves the price, set `priceApproved: true` and merge the registration pull request. The Worker ships dark: there is no Register button yet.
2. If you have not already, set the test key and board password (see the preview steps above).
3. Rehearse with the board on jrhof.org using test cards:
   - one guest
   - a full table of 8
   - a donation
   - a cancelled checkout
   - a full refund
   - a one-seat refund followed by Edit guests
   - the CSV download
   - the kitchen sheet
4. ⚠ In the Stripe Dashboard (live mode), confirm these settings:
   - Settings → Customer emails: "Successful payments" and "Refunds" are on
   - branding and public support details are correct
   - every team member uses two-step authentication, and board members have a view-only or support role
   - `STRIPE_SECRET_KEY` is a restricted key (`rk_live_…`) with write access to Checkout Sessions and PaymentIntents and read access to Charges
5. ⚠ In Cloudflare Zero Trust, add a self-hosted Access application for `jrhof.org/board/*` that allows only the board members' email addresses (one-time PIN, or the organization's Google Workspace sign-in once it exists). The shared password then becomes a second factor, and each person can be removed individually.
6. ⚠ On **Monday, November 16, 2026**:
   - Replace `STRIPE_SECRET_KEY` with the **live** key.
   - Merge a one-line change in `src/data/events.ts`: `registration.status: 'open'` and `status: 'registration-open'`. This shows the Register buttons, the price, and the Event `offers` schema.
   - `npm test` follows the open state automatically.
7. Make one real one-seat purchase, check it on the dashboard, then refund it.
8. After registration closes (January 29), the form closes by itself. Set `registration.status: 'closed'`.
9. After the banquet and any refunds, clear the guest names, dietary notes, and phone numbers from the Stripe metadata on the retention schedule the board adopts. The payments themselves stay for accounting.

### Analytics

- `begin_checkout` is pushed to `dataLayer` when the guest leaves for Stripe. Parameters: `event_slug`, `event_year`, `value`, `currency`. It is a diagnostic, not a conversion.
- `registration_complete` fires once per Checkout Session, and only after the Worker confirms `payment_status: paid` with Stripe. Parameters:
  - `transaction_id`: the Checkout Session ID, which GA4 and Google Ads use to deduplicate
  - `value`, `currency`, `event_slug`, `event_year`
- Stripe test-mode payments send `registration_complete_test` instead, so preview and rehearsal orders never count as Ads conversions. In GTM, also limit the `registration_complete` trigger to Page Hostname equals `jrhof.org`.
- The confirmation API returns no names or emails, so sharing the session ID with analytics exposes nothing personal.
- GTM, GA4, and Google Ads mapping is configured separately (see `docs/ANALYTICS.md`).
- The form carries `data-clarity-mask` so Clarity never records what people type.

### Reusing this for the golf tournament

1. Add a record to `registrations` in `src/data/registrations.ts`. Choose:
   - a new `id` (for example `golf-2027`)
   - `eventRecordId` matching the event in `src/data/events.ts`
   - `seatLabel: 'Golfer'`
   - `meals` (the guest "options": lunch choices, or a single `{ id: 'golfer', name: 'Golfer' }`)
   - the price, capacity, dates, and refund policy
2. Give the golf event record `registration: { status: 'not-open', url: '<event path>register/' }`.
3. The form, checkout, confirmation, board, and CSV work without code changes.
4. Add tests for anything golf-specific. Foursomes are just 4 guests per order with `maxSeatsPerOrder: 4`.
5. Once golf registration moves to jrhof.org, remove `eventLinks.golfRegistration` (Eventbrite) and the Eventbrite exception in `scripts/validate-foundation.mjs`.

### Known limits

- **Capacity is checked, not locked.** At checkout, the Worker counts paid guests plus unexpired checkouts. Two people buying the very last seats in the same few seconds could oversell by a few seats. If that matters near sell-out, lower `capacity` by a small buffer.
- **Unpaid checkouts hold at most 15% of capacity** (`MAX_HELD_SHARE` in `worker/orders.ts`), so scripted or abandoned checkouts can't make the event look sold out. Checkout is limited to 5 attempts per minute per visitor (`wrangler.jsonc`).
- **No bot challenge yet.** Adding Cloudflare Turnstile to the form (a site key, a secret, and a CSP entry for `challenges.cloudflare.com`) is the next hardening step if abuse appears.
- **Board sign-in is one shared password.** Cloudflare Access in front of `/board/*` (launch step 5) adds a per-person check with no code change.
- **Changes made in the Stripe Dashboard show up on the board.** If someone edits metadata there by hand, meal names are matched without regard to case.

## History

The first attempt, `feature/banquet-registration-checkout`, used D1, webhooks, and a Cloudflare Access board portal. It is archived as tag `archive/banquet-registration-checkout-2026-08-05`. That design was replaced by this Stripe-only design to keep the site maintainable by one volunteer. The Worker's validation rules came from that branch.
