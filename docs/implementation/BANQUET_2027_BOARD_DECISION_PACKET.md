# 2027 Banquet Registration — Board Decision Packet

**Purpose:** approve the guest experience and the operational rules needed to replace Eventbrite. This is a decision worksheet, not an authorization to open registration or use live Stripe data.

## What is already confirmed on the JRHOF website

| Item | Confirmed detail |
| --- | --- |
| Event | 2027 Hall of Fame Induction Banquet |
| Date | Saturday, February 6, 2027 |
| Venue | Holiday Inn Denver–Lakewood |
| Address | 7390 W. Hampden Ave., Lakewood, CO 80227 |
| Meal choices | Chicken and Steak |
| Public status | Save the date; registration coming soon |

## What the proposed system does

- Keeps the invitation, registration form, campaign tracking, and confirmation experience under the JRHOF website design.
- Sends card entry to hosted Stripe Checkout; card data never passes through the JRHOF Worker or database.
- Creates a pending reservation before checkout, temporarily holds capacity, and marks it paid only after a signed Stripe webhook matches the reservation, amount, currency, and test/live mode.
- Gives approved board operators a plain-language dashboard for paid seats, pending holds, canceled/expired attempts, payment review, collections, refunds, meals, and campaign sources.
- Supplies audited Excel-compatible registration and seating/catering reports. Detailed reports require Cloudflare Access and an exact approved-email allowlist.
- Captures only standard first-touch UTM labels (`source`, `medium`, `campaign`, `content`, and optional `term`). No purchaser or attendee details enter analytics or Stripe metadata.
- Generates tagged links and QR codes for email, board-member outreach, partners, print, social, and paid search.

## Decisions the board must make

Blank items are launch blockers. Chicken and Steak are confirmed meal choices. Their preparation, sides, descriptions, and final availability still require approval. The current preview values of **$85 per seat**, **300 seats**, and **up to 8 attendees per order** are test fixtures—not proposals or approved facts.

| Decision | Board-approved value | Owner / date |
| --- | --- | --- |
| Doors open / program start / program end |  |  |
| Ticket price and what it includes |  |  |
| Maximum sellable seats after honoree/guest reserves |  |  |
| Maximum attendees in one online order |  |  |
| Public registration opens |  |  |
| Public registration closes |  |  |
| Chicken and Steak preparation, sides, descriptions, and availability |  |  |
| Accessibility and dietary-accommodation wording |  |  |
| Refund deadline and refund/cancellation language |  |  |
| Handling when JRHOF cancels or changes the event |  |  |
| Whether an additional donation is offered at checkout |  |  |
| Approved donation wording; tax-language reviewer |  |  |
| Purchaser/attendee/dietary/seating data retention period |  |  |
| Primary registration operator and backup |  |  |
| Board emails allowed to view/download reports |  |  |
| Approved location for downloaded reports |  |  |
| Support contact for corrections, refunds, and payment issues |  |  |
| Stripe receipt and JRHOF confirmation-email wording/owner |  |  |

## Practical policy recommendations for discussion

- Set the registration close time from the caterer’s final-guarantee deadline, leaving staff at least one full business day to reconcile exceptions.
- Set sellable capacity only after subtracting every reserved honoree, guest, sponsor, staff, and accessibility seat.
- Tie the refund cutoff to the last date JRHOF can reduce its catering commitment. State what happens after that cutoff in plain language.
- Keep dietary notes optional, visible only to the smallest necessary operations group, and delete them on an approved schedule after the event.
- Use Stripe’s test mode through board approval and staff rehearsal. A production launch requires a separate D1 database, Worker route, Access policy, Stripe webhook, live secrets, monitoring, and rollback check.
- Begin with the dashboard plus CSV reports. Do not add a mutable admin console, automated refunds, Google Sheets synchronization, or bulk email until the board demonstrates a real operational need.

## Board review script

1. Open the guest preview and complete one synthetic registration with one attendee, then one with multiple attendees and a seating note.
2. Use a Stripe test card only. Return to JRHOF and confirm the page waits for verified payment state.
3. Open the protected board report and confirm paid seats, dollars, meals, and source/medium totals agree with the test order.
4. Download both paid-only reports and confirm the columns support registration reconciliation, seating, and catering.
5. Create an email link and a print/QR link in the campaign builder, visit each, complete synthetic test registrations, and confirm the source labels roll up separately.
6. Review the closed, sold-out, canceled-checkout, expired-hold, failed-payment, refund, and payment-review behaviors.
7. Complete every board decision above and the technical/staff checklist before recording a go/no-go vote.

## Approval record

- Preview URL reviewed:
- Candidate commit reviewed:
- Board vote and date:
- Approved event configuration attached:
- Operations owner / backup:
- Privacy and retention approval:
- Technical release approver:
- Remaining conditions:
- Decision: **GO / NO-GO**

Even after a **GO** decision, production remains closed until the approved values are applied, the isolated production resources are created, the exact release candidate passes the rehearsal and security checks, and the technical release approver explicitly authorizes the production deployment.
