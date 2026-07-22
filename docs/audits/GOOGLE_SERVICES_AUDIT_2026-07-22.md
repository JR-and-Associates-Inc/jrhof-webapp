# Google Services Configuration Audit — 2026-07-22

## Scope and evidence handling

This is a read-only, authenticated snapshot of Search Console, Google Analytics 4, Google Ads / Ad Grants, Google Business Profile, and Google Cloud Maps setup. No Ads campaign, bid, budget, keyword, conversion, Analytics, Search Console, Business Profile, or organization-authentication setting was changed. Screenshots are retained in the private local audit-evidence folder; account numbers, stream IDs, email addresses, and personal data are intentionally omitted from this report.

## Search Console

### Current state and differences

| Item | Supplied starting observation | Verified 2026-07-22 |
|---|---:|---:|
| Indexed pages | 118 | 118 |
| Not indexed | 146 | 141 across six active reasons |
| Sitemap | Successful; 169 discovered | Successful; 169 discovered; last read July 15 |
| Breadcrumb enhancement | 11 valid, 0 invalid | 11 valid, 0 invalid; no issue in the last 90 days |
| Core Web Vitals | Insufficient traffic | Mobile and desktop both show no data |
| Unused ownership token warning | One warning | Not present on the current ownership page; domain-provider verification is successful |

The not-indexed groups are: 15 `404`, 86 crawled-not-indexed, one intentional `noindex`, five ordinary redirects, one redirect error, and 33 discovered-not-indexed. The previously reported unused-token warning could not be reproduced; do not remove any DNS or HTML verification token without first identifying it in the current account and DNS history.

### URL Inspection

| URL class | Result |
|---|---|
| Homepage | On Google; indexed |
| Donate | On Google; indexed |
| Inductee archive | On Google; indexed |
| 2027 banquet | Not on Google; discovered, not yet crawled/indexed |
| Terms | Not on Google; discovered, not yet crawled/indexed |
| Privacy | Not on Google; crawled, currently not indexed |
| Representative complete profile (`terry_angell`) | On Google; indexed |
| Representative short/placeholder profile (`richard_mauro`) | On Google; indexed |

The results do not justify forcing every URL into the index. Terms and Privacy remain accessible and internally linked; Google may still decide they have low independent search value. The 2027 page should be submitted only after its improved public version is deployed.

### Coverage sampling and repository fixes

- Legacy root-profile redirects are expected and working; sampled URLs redirect in one hop to their canonical inductee pages.
- Removed WordPress feeds, comment feeds, and `wp-*.php` probes are expected low-value 404s and should stay removed.
- The recorded redirect error for `/Steve_Heuer/` is stale: a current request returns one `301` to the correct canonical page.
- Search Console exposed six genuine missing legacy routes. `public/_redirects` now adds one-hop redirects for `/category/golf/`, two historical golf-post routes, and three hyphenated nested inductee routes.
- Crawled-not-indexed examples contain both stale WordPress feed URLs and real profiles. The former need no repair. For short biographies, editorial enrichment with verified facts—not generic filler—is the appropriate improvement.
- Discovered-not-indexed examples are mostly the new event archive and detail pages. Their canonicals, sitemap entries, internal links, breadcrumbs, and structured data already validate; crawl/index requests should follow deployment.

### Post-deployment steps

1. Confirm the production sitemap still contains exactly the canonical public pages and no preview, return, or thank-you URLs.
2. Inspect the homepage, Donate, inductee archive, 2027 banquet, Terms, Privacy, one complete biography, and one short biography again.
3. Submit `/sitemap-index.xml` only if its URL or status changed; otherwise use the existing successful submission.
4. Request indexing for the deployed 2027 banquet page and the small number of materially improved biographies. Do not mass-request every placeholder profile.
5. Start validation for the verified redirect/404 fixes after production serves them. Leave intentional feed/probe 404s alone.
6. Recheck coverage after Google recrawls; indexing is Google's decision and cannot be guaranteed.

## Google Business Profile

Business Profile Manager shows zero businesses. The repository and public site identify no staffed, customer-facing JRHOF location, and the Hall of Fame does not document a service-area operation that visits or delivers to customers. Google permits a profile when an organization has a customer-visitable physical location or travels to customers; a staffed storefront must be able to receive customers during stated hours ([Google's representation guidelines](https://support.google.com/business/answer/3038177/guidelines-for-representing-your-business-on-google)).

Do not create a profile now. Holiday Inn Denver–Lakewood is the 2027 event venue, not JRHOF's permanent staffed address. Reconsider only if the board documents an eligible permanent exhibit/location or a real qualifying service-area operation. Until then, use Organization and Event schema, Search Console, the optional event map, and accurate nonprofit/social profiles.

## Google Ads and Ad Grants

### Current account state

- Three Search campaigns are enabled: Banquet & Community, Brand & Archive, and Donations.
- All use Maximize Clicks. Their enabled ad groups are eligible, and no policy disapproval was visible.
- For June 22 through July 21, all three recorded zero impressions, zero clicks, zero conversions, and zero grant cost.
- The structure has four ad groups total: two in Brand & Archive, one in Donations, and one in Banquet. The latter two do not meet the current two-ad-group program guidance.
- The keyword table contains 49 keywords. In the visible/loaded sample, seven of twelve were `Low search volume`; every sampled keyword had zero impressions. Several other terms were eligible but still did not enter visible auctions.
- The account shows a security warning to protect it from unauthorized activity. Review access and recovery, but do not enable organization-wide authentication enforcement without the staged owner review.
- Ad Preview and Diagnosis could not run because Google detected a Chrome ad blocker in the signed-in profile. Repeat this check in a clean, extension-free signed-in Chrome profile before changing bids or keywords.

The July 13 remediation successfully removed the earlier conversion-starved Target CPA loop: auto-apply remains documented as off and the campaigns remain on Maximize Clicks. Continued zero delivery now points primarily to low query volume, thin ad-group structure, auction/ad-rank or targeting details that require the clean Ad Preview run—not to a need for more budget or indiscriminate broad match.

### Conversion integrity

Google Ads currently treats both `purchase` and `donation_complete` as Primary Purchase actions, while `form_submit` is a Primary Contact action. All are awaiting conversions. This is not a sound long-term bidding contract:

- `purchase` and `donation_complete` may describe the same donation and could double-count one outcome.
- `form_submit` cannot represent a meaningful site-hosted form completion because the current contact page has no hosted form.
- The current donation return signal is observational and client-side. A success URL or redirect event is not payment truth.
- Future banquet completion must come from a signature-verified webhook and server-confirmed paid record with one safe reconciliation/deduplication reference.

Google recommends one account-default goal when actions represent different stages of the same funnel ([conversion-goal guidance](https://support.google.com/google-ads/answer/10995103)). Before Smart Bidding is reconsidered, choose exactly one server-confirmed donation outcome as Primary, keep duplicate/diagnostic actions Secondary, and make `form_submit` Primary only after a real successful form delivery exists.

### Current Ad Grants requirements checked

Google's current compliance guide requires mission-based multiword keywords, no overly generic terms, pausing keywords with Quality Score 1–2, at least 5% monthly CTR when impressions accrue, accurate meaningful conversion tracking, at least two tightly themed ad groups per campaign, at least two sitelinks, and completion of the annual program survey ([Ad Grants policy guide](https://support.google.com/nonprofits/answer/9314402)). Google also says an active account should record at least one meaningful conversion per month ([conversion tracking policy](https://support.google.com/nonprofits/answer/9841491)).

Current gaps or unverified items:

- Banquet and Donations each need a second genuinely distinct, landing-page-relevant ad group; do not split them artificially just to satisfy a count.
- Quality Score cannot be meaningfully assessed on terms with no impressions; add the Quality Score and landing-page-experience columns and review once data exists.
- Verify at least two eligible sitelinks in each campaign branch in the extension-free session; the current asset view was also blocked by the ad-blocker warning.
- Review the in-product survey notification and confirm the annual survey was completed with the correct account identifier; no submission was made during this audit.
- Inspect campaign dates/schedules, presence-only location targeting, English language, Google Search-only network, negative-keyword conflicts, final URLs, RSA approval, and access warnings in the same clean session. The July account audit found Search-only campaigns and no obvious policy disapproval, but these settings should be re-read before any launch changes.

### Proposed changes—do not activate without TJ approval

1. Resolve the account-security warning and rerun Ad Preview for representative brand, archive, donation, and banquet searches using the actual target location/language/device.
2. Keep Maximize Clicks and the current grant bid cap while there is no trustworthy conversion volume. Do not raise budgets; budget is not the limiting signal.
3. Use Search Terms and Keyword Planner evidence to pause low-value/low-volume or Quality Score 1–2 terms. Keep phrase/exact mission-based terms; do not enable broad match indiscriminately.
4. Add a second tightly themed ad group to Banquet and Donations only after it has distinct approved ad copy, multiple relevant multiword terms, and a matching JRHOF landing page. Keep banquet ads on the nontransactional 2027 page until registration is approved.
5. Verify two or more eligible, non-duplicative sitelinks per campaign. Suitable existing public destinations may include the inductee archive, About, Contact, the event page, and Donate when they match that campaign's intent.
6. Demote duplicate or non-meaningful conversion actions. Do not optimize toward return-page payment events. Move a campaign to Smart Bidding only after a reliable Primary action has sustained real volume.
7. Record annual-survey completion and review CTR weekly once impressions begin. A zero-impression month has no meaningful CTR, but it still requires delivery diagnosis.

No campaign, bid, budget, keyword, negative, asset, goal, conversion, schedule, location, or auto-apply setting was changed in this audit.

## Analytics, GTM, and privacy

- The repository and rendered site use GTM as the only Google measurement loader; GA4 and Google Ads are not hard-coded in parallel.
- Search Console is linked to the JRHOF GA4 web stream.
- Enhanced Measurement is enabled for page views, scrolls, outbound clicks, site search, video engagement, file downloads, and form interactions. These remain observational; they are not payment confirmation.
- Event and user-data retention are both 14 months; user retention resets on new activity.
- The Internal Traffic exclusion filter is in Testing. No Developer Traffic filter is configured.
- The GA4 key-event list currently includes `conversion_event_purchase`, `donation_complete`, `form_submit`, and `purchase`. This mirrors the Ads integrity issue described above.
- Preview hostnames are blocked from production measurement by the GTM hostname guard. Stripe attribution uses an opaque client reference, but leaving JRHOF for Stripe is not proof of payment and cross-domain settings must not transmit purchaser, attendee, dietary, seating, or payment identifiers.
- The public Privacy Policy names Google measurement, Cloudflare, Clarity, optional Google Maps activation, and payment/registration processors. The registration branch's analytics allowlist excludes names, emails, phone numbers, dietary notes, seating requests, and raw payment data.
- DebugView should be used only with synthetic/test interactions. Verify event names and safe parameters, then close debug mode; never enter attendee or dietary data for analytics testing.

## Google Maps Platform

The public page already implements an accessible, click-to-load Maps Embed API component, a keyless directions fallback, narrow CSP, privacy disclosure, no user-location collection, a descriptive title, responsive sizing, lazy loading, and `strict-origin-when-cross-origin`. It intentionally emits no Google request before activation.

Google Cloud authentication succeeds, but Maps onboarding is blocked at the billing-profile step. Google requires an API key and valid billing profile even though Maps Embed API usage is no-charge ([Maps Embed billing](https://developers.google.com/maps/documentation/embed/usage-and-billing)). The owner must accept the billing terms/profile; automation must not do that.

After owner acceptance:

1. Create a dedicated `JRHOF Website` Cloud project if one does not already exist.
2. Enable only Maps Embed API.
3. Create a separate browser key named `JRHOF 2027 banquet map embed`.
4. Restrict the key to Maps Embed API and Website referrers for `https://jrhof.org/*` plus the exact approved Cloudflare branch-preview origin. Google recommends a separate Embed key with both API and website restrictions ([Maps key security](https://developers.google.com/maps/api-security-best-practices)).
5. Store the public client key as the Cloudflare build variable `PUBLIC_GOOGLE_MAPS_EMBED_API_KEY`; do not commit it to Git.
6. Rebuild the preview, activate the map by keyboard and pointer, confirm the exact Holiday Inn Denver–Lakewood address, and verify no Google request occurs before activation.
7. After production verification, remove obsolete preview referrers. To rotate, create and restrict a replacement first, update Cloudflare, verify both preview and production, then disable/delete the old key.

Until those owner steps are complete, the page must continue to ship the selectable address and direct Google Maps directions link without an iframe. No unrestricted key should be used as a shortcut.

## Owner checklist

- Complete the Google Cloud billing-profile screen; then have the implementation operator create/restrict the Embed key.
- Run Ad Preview in an extension-free signed-in Chrome profile and capture the diagnosis for one representative query per campaign.
- Confirm the annual Ad Grants survey and account-recovery warning.
- Approve or reject the proposed conversion cleanup and ad-group/sitelink restructuring; no changes are pre-authorized by this report.
- After the public page deploys, run the Search Console post-deployment steps above.
- Revisit Business Profile only if the board documents a real eligible staffed location or service-area operation.
