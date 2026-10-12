# Analytics Strategy

This operational summary implements the canonical measurement design in [JRHOF Marketing Architecture](architecture/JRHOF_MARKETING_ARCHITECTURE.md). If another document conflicts with this one, the single-loader rule below controls.

## Active tools

- **Google Tag Manager:** container `GTM-WGDF4SBN` is loaded directly by `src/components/BaseLayout.astro` and is the authoritative Google measurement layer for every public page.
- **Google Analytics 4 and Google Ads:** measurement tags, configuration, and conversion-event mappings are managed through GTM. The Astro codebase does not load GA4, Google Ads, `gtag`, or a Google tag directly.
- **Site event bridge:** `src/components/BaseLayout.astro` initializes `window.dataLayer` and emits selected events to it. It also dispatches the `jrhof:analytics-event` browser event for non-Google integrations or diagnostics.
- **Cloudflare Web Analytics:** may remain active for privacy-conscious traffic and web-performance visibility. It is managed in the Cloudflare dashboard; automatic injection means the beacon may not appear in repository templates.
- **Microsoft Clarity:** optional. When enabled with `PUBLIC_CLARITY_PROJECT_ID`, it is loaded by `src/components/Clarity.astro` and must not also be loaded through GTM, Zaraz, or another injector.

Cloudflare Zaraz must not load GA4, Google Ads, GTM, or another Google measurement tag. Do not add hardcoded GA4, Google Ads, `gtag`, or Google tag scripts while GTM is installed. Do not manually add the Cloudflare beacon while automatic injection is active. Each measurement tool must have exactly one loader to prevent duplicate pageviews, conversions, and client work.

The Google Ads CSP endpoint patch and gallery `window.gtag` fallback cleanup are complete. Repository events, including gallery events, use `jrhofTrack` to push into `dataLayer`; GTM owns delivery to Google destinations.

**Donation conversion.** Each Stripe donation Payment Link should redirect after payment to `https://jrhof.org/donate/thank-you/?cs={CHECKOUT_SESSION_ID}`; Stripe fills in the Checkout Session ID only after a successful payment. When `?cs=` holds a live session ID (`cs_live_…`), the thank-you page pushes `donation_complete` with `transaction_id` set to that ID, once per browser session. Test-mode IDs, malformed values, and direct visits push nothing, and `/donate/return/` never emits it. `donation_complete` is the Primary donation conversion for GA4 and Google Ads (ADR-016); Stripe remains the financial record. Keep page views, scrolls, engagement, and routine clicks Secondary or unmarked.

**Zeffy registration conversion (this preview branch only).** A Zeffy form runs on `www.zeffy.com` inside an iframe, so GTM cannot see the order. Zeffy's own Google Analytics integration only counts form visits, and Zeffy offers no Google Ads or GTM integration. `src/lib/zeffyTracking.ts` bridges the gap: `ZeffyEmbed.astro` listens for Zeffy's `zeffy-embed:*` messages, accepting only messages from `https://www.zeffy.com` and from a Zeffy frame on the page.

- When the form reaches its payment step, the bridge pushes `begin_checkout`. This is a diagnostic only.
- When Zeffy shows its thank-you screen, the bridge pushes `registration_complete`, the same name the Stripe branch uses, so one GTM and Ads setup serves either platform. Each embed pushes it once per order.

Parameters: `event_slug`, `event_year`, `payment_provider: zeffy`, `currency: USD`, and a generated `transaction_id` (`zeffy-<uuid>`).

Limits to know:

- Zeffy's messages carry no amount, so no `value` is sent. Set a default value on the Google Ads conversion action.
- Zeffy shows its thank-you screen for every completed order, including pay-by-check orders, $0 tickets, and orders paid in full with a discount code.
- Orders placed on Zeffy's full-page checkout (the Apple Pay / Google Pay link) never return to jrhof.org, so they are not counted. That link is tracked only as `external_partner_click`.
- Zeffy has no test mode. Off `jrhof.org` the bridge sends `begin_checkout_test` and `registration_complete_test` instead, and GTM's production-hostname guard blocks preview traffic as well.

`node scripts/test-zeffy-tracking.mjs` (part of `npm test`) covers this behavior.

## Validation and ownership

The analytics owner should verify after material releases:

1. GTM Preview connects to production and reports container `GTM-WGDF4SBN` once per page.
2. GA4 Realtime/DebugView sees one page view per navigation and the approved custom events emitted through `dataLayer`.
3. Google Ads receives only the conversion actions explicitly configured and triggered in GTM.
4. Zaraz has no active GA4, Google Ads, GTM, or Google tag tools.
5. Cloudflare Web Analytics receives production traffic without a duplicate beacon.
6. Clarity, if enabled, is loaded from exactly one source.
7. Preview traffic is excluded or clearly distinguishable.
8. `public/_headers` continues to allow the required Google, Cloudflare, and optional Clarity endpoints without broadening CSP unnecessarily.
9. Privacy language and consent behavior match the actual tools and organizational policy.

Keep account identifiers, access roles, consent decisions, and dashboard screenshots in an access-controlled operations runbook. Do not commit credentials or recovery information.

## Microsoft Clarity

Clarity is **enabled in production** (project `v8l2xfpqpy`, live since the 2026-07-01 cutover) through the `src/components/Clarity.astro` integration and `PUBLIC_CLARITY_PROJECT_ID` at build time — never also through GTM, Zaraz, or another injector (the GTM container holds no Clarity tag; verified 2026-07-12). Ongoing ownership: JR and Associates maintains the privacy purpose, recording/masking settings, consent behavior, retention, and access roles. Builds made without the env value silently remove Clarity.
