# Donation, Conversion, and Search Modernization

**Status:** architecture recommendation for board and technical review. It does not authorize production changes, live Stripe activity, tax language, or a donation launch.

## Recommendation in one sentence

Keep the current Stripe Payment Links working while the banquet registration system proves the shared payment, webhook, reporting, and reconciliation pattern; then replace the one-time donation link with a JRHOF-owned giving form that hands card entry to Stripe Checkout and records success only after a signed webhook.

"Native" should mean that JRHOF owns the donor journey, campaign attribution, transaction record, confirmation state, and reporting. It should not mean collecting card numbers in JRHOF forms. Stripe-hosted Checkout keeps sensitive card entry out of this application while still returning donors to the JRHOF experience.

## Current state

The current donation page already has a credible foundation:

- it explains why the work matters instead of presenting a bare payment button;
- it names the legal organization and EIN;
- it offers one-time, monthly, and banquet-support choices; and
- it preserves a safe disabled state when approved links are missing.

The operational gap is that all three choices open separate Stripe Payment Links. JRHOF can measure the outbound intent, but the site does not own an authoritative donor record or a verified completion flow. The donation return page intentionally emits only the observational `donation_return` event. A return URL, query value, or browser redirect is not proof of payment.

That restraint is correct. It should remain in place until the server can verify the Stripe event.

## Proposed target flow

1. A donor chooses an amount and approved purpose on `/donate/`. One-time giving ships first.
2. The browser sends only validated donation choices and first-touch UTM labels to a same-origin Worker.
3. The Worker loads limits and approved purposes from server-owned configuration, creates a pending D1 donation record, and creates a Stripe Checkout Session in the matching test or live mode.
4. Stripe Checkout collects payment details. Stripe IDs remain out of analytics and out of public URLs wherever practical.
5. A signature-verified webhook validates mode, currency, amount, purpose, and the opaque JRHOF donation reference before marking the record paid.
6. The return page polls a same-origin status endpoint and shows a receipt-oriented thank-you state only after the database says the payment is verified.
7. `donation_complete` is emitted once, with an opaque deduplication reference and server-confirmed value/currency. No name, email address, Stripe ID, message, or other donor information enters analytics.
8. Approved board operators use an aggregate dashboard and protected CSV export for reconciliation. Access to donor-level data is logged.

The banquet implementation already establishes most of the reusable pattern: strict input validation, D1-authoritative amounts, idempotency, signed webhooks, test/live separation, server-confirmed status, Cloudflare Access reports, and privacy-safe campaign attribution. Reuse those primitives after the banquet has been rehearsed; do not combine donation work into the banquet approval release.

## Deliberate delivery phases

### Phase 1 — one-time donations

- donor-selected amount within board-approved minimum and maximum bounds;
- a short, board-approved list of purposes, including an unrestricted option;
- optional donor message only if there is an identified operational owner and retention period;
- Stripe Checkout, signed webhook confirmation, D1 ledger, aggregate dashboard, and protected export;
- test-mode rehearsal and documented refund/reconciliation procedure; and
- server-confirmed conversion tracking.

### Phase 2 — recurring giving

Add monthly giving only after JRHOF assigns ownership for subscription changes, failed-payment follow-up, cancellations, refunds, receipt questions, and webhook lifecycle events. Recurring gifts are not merely a second price option; they create an ongoing service obligation.

### Later, only with demonstrated need

- donor accounts or saved payment methods;
- automated receipts beyond Stripe's approved receipt behavior;
- CRM, accounting, or email-platform synchronization;
- employer matching or tribute-gift workflows;
- automated refunds; and
- a mutable administration console.

These are not prerequisites for a professional first release.

## Board and finance decisions required

| Decision | Required before build or launch |
| --- | --- |
| One-time minimum, maximum, and suggested amounts | Before implementation |
| Approved gift purposes and unrestricted-gift wording | Before implementation |
| Whether donor messages or dedication fields are genuinely needed | Before implementation |
| Approved tax-deductibility, receipt, and legal language | Before launch; reviewed by the appropriate professional |
| Refund policy and person authorized to issue refunds | Before launch |
| Donor-data retention period and approved report recipients | Before launch |
| Finance reconciliation cadence and source of truth | Before launch |
| Stripe receipt settings and donor-support contact | Before launch |
| Conversion value and counting rules in GA4 and Google Ads | Before production measurement |
| Owner for monthly-gift servicing | Before recurring giving |

Do not infer tax deductibility, deductible value, or receipt language from nonprofit status alone. The repository should contain only wording that JRHOF has explicitly approved.

## Measurement contract

Google Ad Grants should optimize toward meaningful, accurately tracked outcomes. For JRHOF, a verified donation and a verified paid banquet registration are meaningful outcomes; ordinary page views, time on site, button clicks, and return-page visits are supporting signals, not primary conversions.

- Keep GTM as the single Google measurement loader.
- Keep `donate_click`, `donation_return`, registration starts, and campaign visits observational.
- Send `donation_complete` and `registration_complete` only after signed-webhook confirmation.
- Deduplicate by an opaque JRHOF transaction reference.
- Keep preview traffic from production GA4 and Google Ads destinations.
- Compare Stripe/D1 totals with analytics every month and document expected browser loss rather than treating analytics as the finance ledger.
- Preserve first-touch `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and optional `utm_term`; never place names or email addresses in UTM values.

Google's current Ad Grants guidance emphasizes meaningful conversion goals and accurate tracking:

- [Track meaningful conversions for Google Ad Grants](https://support.google.com/nonprofits/answer/9841491?hl=en)
- [Google Ad Grants compliance guide](https://support.google.com/nonprofits/answer/9314402?hl=en)
- [Google Ad Grants account management policy](https://support.google.com/nonprofits/answer/117827?hl=en)

## Campaign links and QR codes

The banquet preview's local campaign builder is the right initial tool. Use human-readable, durable labels such as:

| Channel | Example |
| --- | --- |
| Newsletter | `utm_source=jrhof_newsletter&utm_medium=email&utm_campaign=banquet_2027` |
| Board member | `utm_source=board_outreach&utm_medium=email&utm_campaign=banquet_2027&utm_content=initials` |
| Printed program | `utm_source=printed_program&utm_medium=qr&utm_campaign=banquet_2027` |
| Partner website | `utm_source=partner_name&utm_medium=referral&utm_campaign=banquet_2027` |
| Google Ad Grants | Values populated by the approved Ads/GTM convention; preserve auto-tagging |

Generate QR images locally so a third-party QR service does not become a redirect dependency. Short paths such as `/go/banquet-email` may be added later as version-controlled redirects, but only when an owner can preserve them for the life of every printed piece. The destination should still include the approved UTM labels.

## Search and content priorities

The site already has a strong technical base: canonical URLs, sitemap and robots controls, structured data, a fast static archive, and a distinctive body of inductee material. The biggest opportunity is not a visual rebuild. It is making the archive and current event information more complete, specific, and useful.

Recommended order:

1. Complete missing or thin inductee biographies with family-approved facts, service history, years, associations, photographs, and source notes.
2. Publish the 2027 event's approved schedule, price, meal, accessibility, refund, parking, and contact facts in a concise FAQ; add or update `Event` schema only from those approved facts.
3. Strengthen internal links among relevant inductees, event history, banquet pages, the archive, and donation context.
4. Maintain Google Search Console and review indexing, queries, rich-result eligibility, and page experience after releases.
5. Build a small set of genuinely useful Colorado umpiring-history pages only when JRHOF has original material and a named editorial owner.
6. Use the verified conversion system to improve landing pages and campaigns; do not manufacture generic search copy merely to increase page count.

The standard should be primary-source storytelling and accurate event operations. That is more defensible—and more likely to earn links and trust—than mass-produced SEO pages.

## Acceptance criteria for a future native donation release

- no production or live-mode change before board and technical approval;
- one-time flow passes test-mode success, cancel, retry, duplicate webhook, tampered amount, mismatched currency/mode, and refund tests;
- a return-page visit cannot create a paid record or primary conversion;
- the finance report reconciles exactly to test Stripe and the D1 ledger;
- public endpoints expose no donor data;
- detailed reports require exact-email authorization through Cloudflare Access and write an access audit record;
- retention, refund, receipt, privacy, and support procedures have named owners;
- production resources and secrets are separate from preview;
- launch smoke tests and rollback steps are written and rehearsed; and
- monthly giving remains on Payment Links until its complete lifecycle is owned and tested.
