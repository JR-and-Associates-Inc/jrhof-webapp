# Stripe Phase 2 Architecture

> **Event registration** is implemented and test-rehearsed on the unmerged Stripe preview branch through the registration Worker; production main remains asset-only. See [../PROJECT_STATE.md](../PROJECT_STATE.md). For the implementation, see [../operations/EVENT_REGISTRATION.md](../operations/EVENT_REGISTRATION.md) and ADR-017. This page covers a possible future move of **donations** off Payment Links.

The launch-ready donation path should remain a static Astro page using approved Stripe Payment Links.

Phase 2 should be implemented only after the organization approves the operational model:

- An approved Cloudflare Worker runtime creates Stripe Checkout Sessions; production main has no Stripe secret or request-time code, while the event preview already has a separate, test-only Worker.
- The Stripe secret key is stored as a Cloudflare secret and is never committed.
- Success and cancel URLs return to `https://jrhof.org/donate/thank-you/` and `https://jrhof.org/donate/return/`.
- A webhook endpoint verifies the Stripe signature before trusting payment status.
- Successful donations can trigger future server-side analytics or conversion events.
- GA4 and Google Ads conversion attribution can be improved after Checkout integration.

Do not add custom Checkout code until products, prices, webhook ownership, fulfillment expectations, refund language, receipts, and donor-record workflows are approved.
