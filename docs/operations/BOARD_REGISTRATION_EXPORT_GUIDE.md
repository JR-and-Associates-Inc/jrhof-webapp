# Board Guide: Banquet Registration Reports

These reports are preview-only until the board approves production registration. Cloudflare Access is active on the board preview, Stripe is in test mode, and no test record is an official reservation or charge.

1. Open `https://jrhof-banquet-registration-board-preview.jr-and-associates-inc.workers.dev/board/banquet/`. Cloudflare Access will email a one-time PIN to an approved board address. Do not share the PIN, sign-in session, or report URL.
2. Use the dashboard for routine totals: paid seats, pending holds, remaining capacity, payment review, gross/refunded/net collections, donations, meals, and campaign source/medium. It contains aggregate data only.
3. Choose `registrations.csv` for one row per registration or `seating-plan.csv` for one row per attendee when names or contact details are operationally necessary. The default includes every status so pending, canceled, failed, disputed, and refunded records are visible.
4. Open the downloaded file in Excel. For Google Sheets, create a board-approved private Sheet and use **File → Import → Upload**; do not enable public link sharing.
5. Filter the `payment_status` column to `paid` and `refund_status` to `not_refunded`, or use the authorized `?paid-only=true` link. A blank `total_paid` is not a payment.
6. Use `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term` to reconcile outreach. Blank values mean the visitor did not arrive with a tagged link; they do not mean tracking failed.
7. In `seating-plan.csv`, sort by `meal`, then `dietary_note`, for catering; sort by `seating_request` and registration reference for table planning. The paid-only version also provides blank `table_assignment` and `checked_in` working columns for the final seating/check-in sheet. The open-seating policy still applies and specific tables are not guaranteed.
8. Store the CSV only in the board-approved encrypted location with the approved access list. Do not email it or place it in a personal drive. Delete local downloads and emptied trash according to the board-approved retention schedule; record completion with the responsible operator.

The files contain purchaser contact information, attendee names, optional dietary notes, and seating requests. Treat them as confidential. They intentionally exclude secrets, full Stripe identifiers, and webhook payloads. Report unexpected access or a misplaced file immediately to the designated incident owner.
