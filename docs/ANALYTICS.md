# Measurement

How jrhof.org measures visits and outcomes, which event names the site sends, what counts as a conversion, and what to check. Account IDs beyond the public tag IDs, access roles and dashboards belong in the organization's private runbook, not here.

## Loaders: one per tool

- **Google Tag Manager `GTM-WGDF4SBN`** is loaded by `src/components/BaseLayout.astro` and is the only Google loader. GA4 (`G-VYQQ5E7ZHM`) and the Google Ads tag (`AW-17438185594`) are configured inside GTM. Never add `gtag`, GA4 or Ads snippets to the code, and never enable Google tools in Cloudflare Zaraz.
- **Cloudflare Web Analytics** is injected automatically by Cloudflare (dashboard-managed); don't add the beacon by hand.
- **Microsoft Clarity** (`v8l2xfpqpy`) loads only through `src/components/Clarity.astro` when `PUBLIC_CLARITY_PROJECT_ID` is set at build time; never through GTM or Zaraz.
- `public/_headers` allows exactly the endpoints these tools need. Extend the CSP only for an approved tool.

## Event names the site sends

The site pushes events into `dataLayer` through `jrhofTrack()` and the `trackingAttrs()` link helper in `src/config/site.ts`. Names are snake_case `object_action`. Link events and their parameters must be on the allowlist in `scripts/audit-launch-readiness.mjs`; add a new one there, here, and in GTM in the same change.

| Event | When | Conversion? |
|---|---|---|
| `donation_complete` | Stripe returns a donor to `/donate/thank-you/?cs=cs_live_…` (once per browser session; `transaction_id` is the Checkout Session ID) | **Primary** |
| `registration_complete` | The Zeffy embed shows its thank-you screen (once per order; `transaction_id` `zeffy-<uuid>`, `event_slug`, `event_year`, `payment_provider: zeffy`, `currency: USD`) | **Primary** |
| `begin_checkout` | The Zeffy form reaches its payment step | No (diagnostic) |
| `donate_click`, `donate_once_click`, `donate_monthly_click`, `banquet_support_click` | Donation links and buttons | No (Secondary) |
| `event_register_click`, `golf_register_click` | Real registration buttons only, never internal navigation | No (Secondary) |
| `banquet_info_click`, `contact_click`, `email_click`, `phone_click`, `external_partner_click`, `inductee_profile_click` | Navigation and outbound links | No |
| `inductee_search`, `gallery_open`, `gallery_close`, `gallery_next`, `gallery_previous`, `gallery_share`, `gallery_fullscreen` | Archive search and the photo viewer | No |

Allowed link parameters: `link_text`, `destination_url`, `link_context`, `cta_location`, `donation_type`, `event_name`, `partner`, `inductee_name`. Never send personal data.

`page_view`, `first_visit`, `user_engagement`, `scroll` and `session_start` are never key events or Ads conversions.

## Donation conversion

Each Stripe donation Payment Link must redirect after payment to `https://jrhof.org/donate/thank-you/?cs={CHECKOUT_SESSION_ID}`. Stripe fills in the ID only after a successful payment. Test-mode IDs, malformed values and direct visits push nothing, and `/donate/return/` never emits it (ADR-016). Stripe stays the financial record; the event carries no amount.

## Registration conversion (Zeffy)

The Zeffy form runs inside an iframe on `www.zeffy.com`, so GTM can't see the order, and Zeffy's own Google Analytics integration only counts visits. `src/lib/zeffyTracking.ts` listens for Zeffy's `zeffy-embed:*` messages (only from `https://www.zeffy.com` and a Zeffy frame on the page) and pushes `begin_checkout` and `registration_complete`.

- No amount is available, so set a default value on the Google Ads conversion action.
- Every completed Zeffy order counts, including pay-by-check, $0 and fully discounted orders.
- Orders on Zeffy's full-page checkout (the Apple Pay / Google Pay link) never return to jrhof.org and are not counted; that link is tracked only as `external_partner_click`.
- Off `jrhof.org` the bridge sends `begin_checkout_test` and `registration_complete_test`, so previews never count as conversions.

`node scripts/test-zeffy-tracking.mjs` (part of `npm test`) covers this behavior.

## Setup still needed (needs the analytics owner's approval)

1. GTM: GA4 event tags for `donation_complete` and `registration_complete`, firing only on the production hostname.
2. GA4: mark both as key events.
3. Google Ads: import both as **Primary** conversions with a default value; keep everything else Secondary or removed.
4. Stripe: confirm every live donation Payment Link returns with `?cs={CHECKOUT_SESSION_ID}`.

## Google Ad Grants

Ad Grants requires accurate conversion tracking with at least one meaningful conversion a month. Keep the account compliant: account CTR at or above 5%, no keywords with Quality Score 1–2 and no single-word keywords, at least two ad groups per campaign with at least two ads each, and sitelinks. Ads land on substantive `jrhof.org` pages. Check Google's current Ad Grants policy before relying on a threshold. Target structure: **Donations** (Colorado), **Brand & Archive** (US), and **Events** with a banquet ad group (about November to early February) and a golf ad group (about March to June). JRHOF does not use AdSense; don't add `ads.txt` or AdSense code.

## Checks

**After a deploy that touches layout or links:** load `/` in a clean browser and confirm exactly one `gtm.js` load, one GA4 page view per navigation, and no CSP "Refused" errors for Google, Cloudflare or Clarity domains.

**After any GTM publish:** use GTM Preview on `/`, `/donate/`, one inductee page and one event page. Each event fires its tag once with its parameters, nothing fires twice, and nothing fires on a `workers.dev` preview host.

**Monthly:**
- Google Ads Goals: no page-view-type actions in Primary; no "Misconfigured" actions; at least one real conversion recorded.
- GA4 key events: only `donation_complete` and `registration_complete` accrue.
- Compare `donation_complete` with Stripe's successful donations and `registration_complete` with Zeffy's orders; investigate if GA4 records less than about 75%.
- Ad Grants compliance numbers above.

**If something breaks:**
- *Double page views:* a second loader was added (hard-coded tag, Zaraz, a second GA4 config tag in GTM). Remove it; never "fix" by filtering.
- *Conversion rate over 100% or Ads "Misconfigured":* someone imported or starred an automatic event. Unstar it in GA4 and set the Ads action to Secondary or remove it.
- *Events stop while traffic continues:* check the latest GTM version, the CSP in `public/_headers`, and that `BaseLayout.astro` still loads GTM once.
- *A campaign at 0 impressions for 7 days:* check ad approval, keyword status, bid strategy (Maximize Conversions starves without conversions), CTR compliance and budget.
