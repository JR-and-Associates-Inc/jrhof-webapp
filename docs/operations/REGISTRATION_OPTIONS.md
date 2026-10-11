# Banquet registration: Stripe custom flow or Zeffy

Prepared October 11, 2026 for the board's platform decision. Both options are running as previews at the same page path, so they can be opened side by side. Neither is live. Facts about Zeffy come from its help center (see [ZEFFY_EVALUATION.md](ZEFFY_EVALUATION.md) for sources and acceptance tests); facts about the Stripe flow come from the code on `feature/banquet-stripe-registration`.

## Side-by-side demo

Open both register pages in two windows:

- Stripe: https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/
- Zeffy: https://feature-zeffy-registration-preview-jrhof-webapp.jr-and-associates-inc.workers.dev/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/

Suggested walk-through:

1. Same header, footer, hero and event summary on both: the page around the form is identical JRHOF design.
2. Fill a party of three: guest names, meals, dietary needs, an added donation.
3. Stripe: continue to Stripe test checkout (card 4242 4242 4242 4242) and land on the jrhof.org confirmation page. Zeffy: step through the embedded form up to payment, then stop. Zeffy has no test mode on a published form, so do not pay.
4. After-sale tools: Stripe preview `/board/banquet-2027/` (Google sign-in) versus the Zeffy dashboard's attendee list, exports, manual entry and refunds.
5. Show the optional Zeffy contribution step and how a buyer sets it to $0.

## Pros and cons

### Stripe custom flow (current registration branch)

Pros

- The form is ours: exact JRHOF design, wording and field rules (purchaser contact, up to eight guests, meal and dietary response per guest).
- Completed registrations are confirmed server-side and sent to Google Analytics with the amount. That is a real, valued conversion for Google Ad Grants, and invitation/QR campaign labels survive checkout.
- Board tools already built for this event: dashboard, guest CSV with one row per guest, kitchen sheet by meal, guest edits, refunds, share/QR tool, all behind Google Workspace sign-in.
- Early-bird logic is exact: the server picks $43 or $50 and each order keeps the rate it was quoted.
- One financial record: registrations land in the same Stripe account as donations. No new vendor, no new third-party script on the site.
- Built, tested and rehearsed (34 automated tests; an eight-guest sandbox checkout and refund on October 11).

Cons

- Card processing fees come out of every ticket. Stripe's standard US online rate is 2.9% + 30¢ per payment (about $11.90 on a $400 table of eight); Stripe has offered 501(c)(3)s a reduced rate on request. Confirm JRHOF's actual rate in the Stripe dashboard.
- About 3,300 lines of custom code and tests for one volunteer to maintain, plus the Worker, webhook, Cloudflare Access, secrets and dependency updates around them.
- Still missing for a real event: offline cash/check entries, comps and recognition pricing, strict seat locking (concurrent checkouts can oversell), check-in. Each needs more code; offline entries need a database.
- Golf, add-ons (mulligans, raffle), sponsorships and tribute gifts would each be more custom work.
- Day-to-day operation depends on the person who understands the code.

### Zeffy

Pros

- No platform or processing fees to JRHOF. Zeffy funds itself with an optional contribution the buyer can lower to $0.
- Everything the custom flow still lacks is built in: scheduled ticket availability (early bird), group/table tickets, per-attendee questions, manual entries for cash and checks, comps, refunds, attendee exports, automatic tax receipts, waitlists, and day-of check-in by scanning e-tickets or by name ([check-in manager](https://support.zeffy.com/checking-in-guests-the-day-of-your-event-scan-their-e-ticket-or-check-them-in-manually-using-the-check-in-manager-kpd21)).
- Board members can run it themselves in a standard dashboard with their own logins; nothing to deploy or patch.
- The same account can handle golf (tickets and add-ons), sponsorships and donation forms later, which retires Eventbrite without more code.
- On jrhof.org it is one embedded form: no Worker, webhook, database or secrets.

Cons

- The optional contribution appears at checkout. Some buyers will pay it without noticing and some will find it confusing; the board should see it before deciding.
- Google measurement: Zeffy's native Google Analytics integration reports visits and traffic sources only, not completed payments, and the form runs inside an iframe. A completed registration is not a valued Ad Grants conversion without extra work. Event ticketing does not carry UTM/QR campaign labels.
- Design: inside the form, fonts and spacing are Zeffy's, and Zeffy adjusts a custom color for legibility. The page around the form matches; the form itself will look close, not identical.
- Money and data move to a separate Zeffy-managed Stripe account. The current JRHOF Stripe account cannot be attached, so registrations and donations would be reconciled across two systems.
- Guest data lives in Zeffy. A jrhof.org board dashboard would need Zeffy's API and webhooks; otherwise the board uses Zeffy's dashboard and exports.
- Adds a third-party script and a payment iframe on the register page, with matching security-header exceptions for that page.
- No test mode on a published form. Rehearsals need Zeffy's documented test workflow or a draft campaign.

### Where each one wins

| Need | Better fit |
|---|---|
| Lowest cost per ticket | Zeffy |
| Volunteer can run it without code | Zeffy |
| Cash/check, comps, check-in, refunds this season | Zeffy (Stripe flow would need new work) |
| Golf, sponsorships and add-ons next | Zeffy |
| Exact JRHOF look inside the form | Stripe |
| Ad Grants conversion with value, campaign labels | Stripe |
| One financial system with existing donations | Stripe |
| Board dashboard tailored to this banquet | Stripe today; Zeffy dashboard is generic |

### Closing the Zeffy measurement gap

The embed script sends `zeffy-embed:thank-you-page-shown` from `https://www.zeffy.com` when a buyer reaches the thank-you screen. The page could turn that into a browser-side conversion, the same strength as today's donation completion on the Stripe return page: no amount, and not server-verified. Zeffy's completed-payment webhooks could add a verified record later. Neither is built; both need approval as an analytics change and testing against the acceptance list in [ZEFFY_EVALUATION.md](ZEFFY_EVALUATION.md). Ad Grants can also keep meeting its monthly conversion requirement through donations and contact conversions while banquet registration runs on Zeffy.

## Making the Zeffy form match

Observed on the published Zeffy campaign page on October 11, 2026:

| Now in Zeffy | Change to |
|---|---|
| One ticket, "General Admission", $35, "includes the full program and access to all main activities" | Two scheduled tickets once the board approves prices: Early bird $43 through December 15, 11:59 p.m. Mountain; Regular $50 from December 16 until registration closes. Plain description: "Banquet seat, including meal." |
| No per-guest questions visible | Per-attendee questions: Full name (required); Meal, Chicken or Steak until the menu is set (required); Dietary needs or allergies, "None" allowed (required); Email and Phone (optional). Purchaser phone required. |
| No order limit visible | Maximum 8 tickets per order (a full table); total capacity 300, if the board confirms. Consider a "Table of 8" bundle. |
| No date or time shown on the page; address only | Saturday, February 6, 2027, noon–4 p.m.; venue name Holiday Inn Denver–Lakewood, 7390 W. Hampden Ave., Lakewood, CO 80227. |
| No event description | Short description using the board-approved slogan, business casual attire, and the seating policy used on jrhof.org. Add the refund policy once approved. |
| Social preview names "Jr And Associates Inc" while the page says Joe Rossi Umpires Hall of Fame | Set the public display name to Joe Rossi Umpires Hall of Fame (legal name JR and Associates, Inc. stays on receipts). |
| Stock photo of a banquet table; light blue theme | JRHOF banquet hero image and emblem; theme color navy `#082b4c`, light mode, simple background. Zeffy may shift the shade slightly. |
| Donation add-on with an open amount | Keep it; add $25 / $50 / $100 suggestions if Zeffy allows, matching the Stripe preview. |
| Availability dates not shown | Opens November 16, closes end of day January 29 (Mountain), pending board confirmation. |
| Campaign is reachable publicly (noindex) | Keep it unpublished or clearly in draft until the board decides, so nobody pays early. |

After editing, recheck the embedded form on the preview at desktop width and at 390px phone width.

## Recommendation

For a volunteer-run nonprofit with one banquet and one golf tournament a year, Zeffy's built-in operations (offline entries, comps, check-in, refunds, golf and sponsorships) and zero fees outweigh the custom flow's advantages, provided the board accepts two trade-offs: the optional contribution at checkout, and weaker Google Ads measurement for registrations. If valued Ad Grants conversions from the banquet and campaign-level QR attribution are must-haves this season, keep the Stripe flow and budget the remaining work (offline entries, comps, seat locking).

Either way, finish the Zeffy form changes above first so the comparison is fair, and run the acceptance tests in [ZEFFY_EVALUATION.md](ZEFFY_EVALUATION.md) before any live sale.
