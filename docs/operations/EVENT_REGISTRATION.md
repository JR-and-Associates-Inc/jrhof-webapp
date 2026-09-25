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
   - creates a Stripe Checkout Session with one line item per meal (for example, "Banquet seat: Chicken × 2") plus the donation
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

**Seat price approval.** The 2027 banquet price, $70, is proposed and not yet approved by the board. While `priceApproved` is `false`:

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
| `worker/stripe.ts` | Minimal Stripe REST client |
| `scripts/test-registration-worker.mjs` | Worker tests against a fake Stripe (`npm run test:worker`) |

## For board members

Sign in at **https://jrhof.org/board/** with the board password. Any username works. Your browser will offer to remember it.

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

Without `STRIPE_SECRET_KEY`, the API answers "registration is not available" and the form says so. Without `BOARD_PASSWORD`, `/board/` is closed.

### Review on a preview URL

Review happens on a preview version of `jrhof-webapp` before anything reaches `main`. The repository rule (`docs/CLOUDFLARE_DEPLOYMENT.md`) is that previews carrying secrets, admin routes, or personal data are protected with Cloudflare Access first. Set it up in this order:

1. ⚠ In Cloudflare, go to Workers & Pages → `jrhof-webapp` → Settings → Domains & Routes. Turn on Cloudflare Access for **Preview URLs**. Allow the reviewers' email addresses.
2. ⚠ Set the Worker secrets. TJ runs these; never paste keys into chat or Git:
   - `npx wrangler secret put STRIPE_SECRET_KEY`, with a **test** key (`sk_test_…`)
   - `npx wrangler secret put BOARD_PASSWORD`

   Secrets belong to the whole Worker, not just one preview. The live site ignores them today, because the version deployed from `main` has no Worker script.
3. ⚠ Upload a preview version with a stable address. Either push the branch, if Workers Builds builds non-production branches, or run `npm run build && npx wrangler versions upload --preview-alias banquet-registration`. The preview address is `https://banquet-registration-jrhof-webapp.jr-and-associates-inc.workers.dev`.
4. Reviewers sign in through Access and try the flow with test cards: the event page, the form, Stripe Checkout, the confirmation, and `/board/`. The test-mode banner appears on the form, the confirmation, and the board.
5. Upload again after each change. The alias keeps the same address.

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
5. ⚠ On **Monday, November 16, 2026**:
   - Replace `STRIPE_SECRET_KEY` with the **live** key.
   - Merge a one-line change in `src/data/events.ts`: `registration.status: 'open'` and `status: 'registration-open'`. This shows the Register buttons, the price, and the Event `offers` schema.
   - `npm test` follows the open state automatically.
6. Make one real one-seat purchase, check it on the dashboard, then refund it.
7. After registration closes (January 29), the form closes by itself. Set `registration.status: 'closed'`.
8. After the banquet, you can clear the guest metadata in Stripe if the board adopts a retention period. The payments themselves stay for accounting.

### Analytics

- `begin_checkout` is pushed to `dataLayer` when the guest leaves for Stripe. Parameters: `event_slug`, `event_year`, `value`, `currency`. It is a diagnostic, not a conversion.
- `registration_complete` fires once per Checkout Session, and only after the Worker confirms `payment_status: paid` with Stripe. Parameters:
  - `transaction_id`: the Checkout Session ID, which GA4 and Google Ads use to deduplicate
  - `value`, `currency`, `event_slug`, `event_year`
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
- **Board sign-in is one shared password.** Cloudflare Access with Microsoft 365 sign-in can be placed in front of `/board/*` later, with no code change.
- **Changes made in the Stripe Dashboard show up on the board.** If someone edits metadata there by hand, meal names are matched without regard to case.

## History

The first attempt, `feature/banquet-registration-checkout`, used D1, webhooks, and a Cloudflare Access board portal. It is archived as tag `archive/banquet-registration-checkout-2026-08-05`. That design was replaced by this Stripe-only design to keep the site maintainable by one volunteer. The Worker's validation rules came from that branch.
