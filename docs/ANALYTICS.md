# Measurement

How jrhof.org measures visits and outcomes, which event names the site sends, what counts as a conversion, and what to check. Account IDs beyond the public tag IDs, access roles and dashboards belong in the organization's private runbook, not here.

## Loaders: one per tool

- **Google Tag Manager `GTM-WGDF4SBN`** is loaded by `src/components/BaseLayout.astro` and is the only Google loader. GA4 (`G-VYQQ5E7ZHM`) and the Google Ads tag (`AW-17438185594`) are configured inside GTM. Never add `gtag`, GA4 or Ads snippets to the code, and never enable Google tools in Cloudflare Zaraz.
- **Cloudflare Web Analytics** is injected automatically by Cloudflare (dashboard-managed); don't add the beacon by hand.
- **Microsoft Clarity** (`v8l2xfpqpy`) loads only through GTM, from a tag guarded by the "Guard | Non-prod hostname" exception so it never runs on preview or local hosts (ADR-018). Never hard-code the Clarity snippet in the site or load it through Zaraz. Containers around Zeffy embeds carry `data-clarity-mask="true"`; keep the Clarity project's masking mode at Balanced or Strict.
- `public/_headers` allows exactly the endpoints these tools need. Every policy's `connect-src` includes `https://ad.doubleclick.net` for Google Ads conversion pings; the audit checks each one. Extend the CSP only for an approved tool.

## Event names the site sends

The site pushes events into `dataLayer` through `jrhofTrack()` and the `trackingAttrs()` link helper in `src/config/site.ts`. Names are snake_case `object_action`. Link events and their parameters must be on the allowlist in `scripts/audit-launch-readiness.mjs`; add a new one there, here, and in GTM in the same change.

| Event | When | Conversion? |
|---|---|---|
| `donation_complete` | Stripe returns a donor to `/donate/thank-you/?cs=cs_live_…` (once per browser session; `transaction_id` is the Checkout Session ID) | **Primary** |
| `registration_complete` | The Zeffy embed shows its thank-you screen (once per order; `transaction_id` `zeffy-<uuid>`, `event_slug`, `event_year`, `payment_provider: zeffy`, `currency: USD`) | **Primary** |
| `begin_checkout` | The Zeffy form reaches its payment step | No (diagnostic) |
| `donate_click`, `donate_once_click`, `donate_monthly_click`, `banquet_support_click` | Donation links and buttons | No (Secondary) |
| `event_register_click`, `golf_register_click` | Real registration buttons only, never internal navigation. Golf events send `golf_register_click`, every other event `event_register_click` (`registerClickEvent()` in `src/data/events.ts`) | See [Conversion settings](#conversion-settings) |
| `contact_click` | Real "contact us" calls to action in page content (banquet questions, donation questions, share a story) | See [Conversion settings](#conversion-settings) |
| `sponsor_inquiry` | The `/sponsor/` call to action | See [Conversion settings](#conversion-settings) |
| `email_click`, `phone_click` | `mailto:` and `tel:` links (inferred automatically) | See [Conversion settings](#conversion-settings) |
| `nav_click` | Header and footer navigation links to `/contact/`, with `link_context` `header_nav` or `footer_nav` | No |
| `banquet_info_click`, `external_partner_click`, `inductee_profile_click` | Navigation and outbound links | No |
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

## Conversion settings

One row per event: whether it is a GA4 key event and how Google Ads counts it. This is the target once the owner approves and applies the pending dashboard checklist (newsletter, Zeffy donations, Clarity through GTM). Rows the checklist doesn't change keep the setting recorded on October 3, 2026. Dashboards drift, so check Google Ads Goals before relying on a row. All Ads conversions are GA4 imports; don't add native Ads conversion tags as well, or counts double.

| Event | GA4 key event | Google Ads | Count |
|---|---|---|---|
| `donation_complete` | Yes | **Primary**, default value | Every |
| `registration_complete` | Yes | **Primary**, default value | Every |
| `newsletter_signup` (sent once the newsletter embed ships) | Yes | **Primary** | One |
| `sponsor_inquiry`, `email_click`, `phone_click` | Yes | Primary | One |
| `event_register_click` | Yes | Primary (interim, until `registration_complete` records steadily) | One |
| `golf_register_click` | Yes | **Secondary** until 2027 golf registration opens, then Primary | One |
| `contact_click` | Yes | **Secondary** | One |
| `donate_once_click`, `donate_monthly_click` | Yes | Primary (interim); the site stops sending them when donations move to Zeffy, so demote or remove them then | One |
| `begin_checkout`, `nav_click`, `donate_click`, `banquet_info_click`, `external_partner_click`, `inductee_profile_click`, gallery and search events | No | Not imported | — |
| `purchase` | **No** (remove the key event) | Not imported | — |
| Any `*_test` name, `page_view`, `first_visit`, `user_engagement`, `scroll`, `session_start`, `form_submit` | Never | Never | — |

**GTM conventions.** Each site event GA4 should receive has a `GA4 | Event | <name>` tag fired by a `CE | <name>` custom-event trigger limited to Page Hostname `jrhof.org`, so preview hosts never send data. The October 3, 2026 record says live GTM version 12 has such tags for `registration_complete`, `donation_complete`, `golf_register_click` and `sponsor_inquiry`. A GA4 tag for `nav_click` is optional.

**Watch the conversion rate.** Google says clicks shouldn't nearly equal conversions. If the account conversion rate climbs toward the click count, demote the interim click conversions to Secondary first.

## Google Ad Grants

Ad Grants requires accurate conversion tracking with at least one meaningful conversion a month. Keep the account compliant: account CTR at or above 5%, no keywords with Quality Score 1–2 and no single-word keywords, at least two ad groups per campaign with at least two ads each, and sitelinks. Ads land on substantive `jrhof.org` pages. Check Google's current Ad Grants policy before relying on a threshold. Live since October 3, 2026: `Evergreen | Awareness` and `Evergreen | Donations` (United States, "Presence" location option, phrase and exact match only); the older campaigns are paused, not deleted. Planned: `Seasonal | Induction Banquet` (Colorado, about mid-November to late January) and `Seasonal | Umpire's Cup Golf` once the 2027 date is set; separate seasonal campaigns keep at least two ad groups each. JRHOF does not use AdSense; don't add `ads.txt` or AdSense code.

## Checks

**After a deploy that touches layout or links:** load `/` in a clean browser and confirm exactly one `gtm.js` load, one GA4 page view per navigation, and no CSP "Refused" errors for Google, Cloudflare or Clarity domains.

**After any GTM publish:** use GTM Preview on `/`, `/donate/`, one inductee page and one event page. Each event fires its tag once with its parameters, nothing fires twice, and nothing fires on a `workers.dev` preview host. The Clarity tag fires once per page on `jrhof.org` and never on a preview host.

**Monthly:**
- Google Ads Goals: no page-view-type actions in Primary; no "Misconfigured" actions; at least one real conversion recorded.
- GA4 key events: only the events marked Yes in [Conversion settings](#conversion-settings) accrue.
- Compare `donation_complete` with Stripe's successful donations and `registration_complete` with Zeffy's orders; investigate if GA4 records less than about 75%.
- Ad Grants compliance numbers above.

**If something breaks:**
- *Double page views:* a second loader was added (hard-coded tag, Zaraz, a second GA4 config tag in GTM). Remove it; never "fix" by filtering.
- *Conversion rate over 100% or Ads "Misconfigured":* someone imported or starred an automatic event. Unstar it in GA4 and set the Ads action to Secondary or remove it.
- *Events stop while traffic continues:* check the latest GTM version, the CSP in `public/_headers`, and that `BaseLayout.astro` still loads GTM once.
- *A campaign at 0 impressions for 7 days:* check ad approval, keyword status, bid strategy (Maximize Conversions starves without conversions), CTR compliance and budget.
