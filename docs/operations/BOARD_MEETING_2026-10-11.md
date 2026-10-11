# 2027 banquet: board preview and decisions

Prepared October 11, 2026. Production remains unchanged. The preview uses Stripe test payments and Google Workspace sign-in for board pages.

## Ready to demonstrate

- Banquet: Saturday, February 6, 2027, noon–4 p.m.; business casual.
- Confirmed Class of 2027: Kirby Clock, Sean Grogan, Brent Mulliniks. Supplied portraits have profile/card WebP derivatives in R2; biographies will follow.
- Early bird: $43 through December 15, 2026, inclusive, Mountain time. New checkouts switch to $50 at midnight on December 16. A checkout created before the cutoff retains its price for its existing 31-minute checkout window.
- Each order retains its ticket type and original seat price. Changing the current rate does not change an existing order or its refund reference price.
- Up to eight guests per order; each needs name, meal and dietary response. Guest contacts are optional, purchaser contacts required.
- Separate guest columns and party identifiers in the CSVs; meal/dietary counts, guest editing, payment/refund status, campaign links and logo QR images.
- Personal board home, banquet dashboard and a printable meeting checklist. Google sign-in applies to board pages; registration stays public.

## Decisions needed before live registration

1. **Opening:** Invitations are planned for early November. Keep November 16 as the registration opening, or open earlier?
2. **Closing:** Which exact January date and time closes registration? January 29 is the current preview setting, not a new committee decision.
3. **Meals:** Which two plated entrées and vegetarian accommodation? Chicken/Steak remain rehearsal options, not an approved menu. Confirm whether any choice changes the attendee price. Hotel menu prices are catering costs.
4. **Hotel deadline:** What exact mid-January date are final attendance, meal counts and dietary needs due? Can sales, transfers or meal edits continue afterward?
5. **New umpires:** Who qualifies for $33 recognition registration, who approves the names, and are their guests regular-price? This rate is not enabled in checkout.
6. **Complimentary seats:** Confirm one inductee plus one guest for each honoree (up to six seats). Who gathers their details? How do extra guests pay? A free-registration flow still needs implementation so those guests count toward meals and capacity.
7. **Capacity/seating:** Confirm 300 seats, eight-person tables and reserved inductee seating. Does the board require a strict reservation lock? Current capacity checks can oversell under simultaneous checkouts.
8. **Refunds:** Approve or revise full refunds through January 29 and transfers afterward. Name the person who handles refunds, guest changes and dietary requests.
9. **Venue:** Confirm final Holiday Inn/DoubleTree name, hotel contact, booking link and any negotiated room rate.
10. **Privacy:** Approve registration privacy wording, guest-data retention and export handling. Collecting guest contacts does not automatically enroll anyone in marketing.

## Follow-ups

- Receive approved biographies; confirm MC/keynote, program, volunteer/check-in times and meal cards.
- Decide whether future-inductee suggestions should use a separate form.
- Confirm next golf date before publishing a save-the-date.
- Choose Google Chat space/recipients and the information permitted in signup/donation alerts. Alerts are not yet enabled.

## Demonstration route

1. Open `/board/`, confirm the signed-in greeting and open the banquet dashboard.
2. Open **Board meeting checklist** and **View banquet page**; review the honorees and event details.
3. Choose **Try test registration**. Add guests, meals and dietary details; confirm $43 each and any donation total.
4. Continue to Stripe test checkout. Test card: `4242 4242 4242 4242`, a future expiration date, any CVC.
5. Review the paid order, original seat price, kitchen sheet and guest CSVs.
6. Show **Share links & QR codes**. Preview links are for rehearsal, not attendee distribution.

Live launch remains a separate approved release: finish the event decisions and privacy/retention policy, configure separate live Stripe credentials/webhook and production board access, validate payment/refund behavior, then authorize the production release.
