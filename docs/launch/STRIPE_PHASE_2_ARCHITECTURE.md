# Stripe Phase 2 Architecture

The launch-ready donation path should remain a static Astro page using approved Stripe Payment Links.

Phase 2 should be implemented only after the organization approves the operational model:

- A Cloudflare Pages Function or Worker creates Stripe Checkout Sessions.
- The Stripe secret key is stored as a Cloudflare secret and is never committed.
- Success and cancel URLs return to `https://jrhof.org/donate/thank-you/` and `https://jrhof.org/donate/return/`.
- A webhook endpoint verifies the Stripe signature before trusting payment status.
- Successful donations can trigger future server-side analytics or conversion events.
- GA4 and Google Ads conversion attribution can be improved after Checkout integration.

Do not add custom Checkout code until products, prices, webhook ownership, fulfillment expectations, refund language, receipts, and donor-record workflows are approved.
