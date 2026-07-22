# Board Guide: Downloading Banquet Registration CSVs

The download is a preview-only design until the board approves production registration and Cloudflare Access. Registration and payment remain closed.

1. Open the board export link supplied by the authorized operator. Cloudflare Access will ask Greg to sign in through the approved identity provider. Do not share the sign-in session or download URL.
2. Choose `registrations.csv` for one row per registration or `seating-plan.csv` for one row per attendee. The default includes every status so pending, canceled, failed, disputed, and refunded records are visible.
3. Open the downloaded file in Excel. For Google Sheets, create a board-approved private Sheet and use **File → Import → Upload**; do not enable public link sharing.
4. Filter the `payment_status` column to `paid` and `refund_status` to `not_refunded`, or use the authorized `?paid-only=true` link. A blank `total_paid` is not a payment.
5. In `seating-plan.csv`, sort by `meal`, then `dietary_note`, for meal counts; sort by `seating_request` and registration reference for table planning. The open-seating policy still applies and specific tables are not guaranteed.
6. Store the CSV only in the board-approved encrypted location with the approved access list. Do not email it or place it in a personal drive. Delete local downloads and emptied trash according to the board-approved retention schedule; record completion with the responsible operator.

The files contain purchaser contact information, attendee names, optional dietary notes, and seating requests. Treat them as confidential. They intentionally exclude secrets, full Stripe identifiers, and webhook payloads. Report unexpected access or a misplaced file immediately to the designated incident owner.
