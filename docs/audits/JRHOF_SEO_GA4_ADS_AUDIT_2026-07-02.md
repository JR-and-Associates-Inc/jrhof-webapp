# JRHOF — SEO, GA4, Google Ads / Ad Grants, Search Console & Tracking Audit

**Date:** 2026-07-02
**Auditor scope:** Technical SEO, GA4, Google Tag Manager, Google Ads, Google Ad Grants, Search Console, tracking, conversion readiness
**Site:** https://jrhof.org — Astro static site on Cloudflare Workers Static Assets
**Repo:** JR-and-Associates-Inc/jrhof-webapp
**Mode:** Read-only. No changes were made to Google Ads, GA4, Search Console, GTM, Cloudflare, Stripe, or the repo.

### How to read this report
- **CONFIRMED** = directly observed (repo file/line, live HTTP response, or a screenshot of the authenticated Google UI during this audit).
- **UNVERIFIED** = could not be directly confirmed; each includes exact verification steps.
- **RECOMMENDATION** = judgment/opinion, not a defect.

### Verified account/property identifiers (observed this session)
| System | Identifier | How observed |
|---|---|---|
| Google Tag Manager | `GTM-WGDF4SBN` | `src/components/BaseLayout.astro:122`; live `gtm.js` request 200 |
| GA4 property | Account `373612649` / Property `511268663` | GA4 UI URL `a373612649p511268663` |
| GA4 measurement ID | `G-VYQQ5E7ZHM` | live `gtag/js?id=G-VYQQ5E7ZHM` + `g/collect?tid=G-VYQQ5E7ZHM` |
| Google Ads (active) | **JR AND ASSOCIATES INC** — customer `850-823-3621` | Ads account picker + campaigns URL `__e=8508233621` |
| Google Ads (cancelled) | JR and Associates — customer `567-662-7574` (**Cancelled**) | Ads account picker |
| Google Ads conversion tag | `AW-17438185594` | live `gtag/js?id=AW-17438185594` |
| Microsoft Clarity | `v8l2xfpqpy` | `.env.example`; live `clarity.ms/tag/v8l2xfpqpy` |
| Cloudflare Web Analytics | active beacon | live `static.cloudflareinsights.com/beacon.min.js` |
| Search Console | Domain property `sc-domain:jrhof.org` | GSC UI |
| AdSense (ads.txt) | `pub-7839480824613721` | `public/ads.txt:1` |

---

## 1. Executive summary

**Overall SEO status: Good foundation, one real content-indexing problem.** Indexability config is clean (no robots block, no rogue `noindex`, canonical/OG/schema all present and well-formed, sitemap submitted and read successfully). The measurable problem is **coverage**: Search Console reports **68 indexed vs 169 not-indexed** pages, of which **140 are "Discovered/Crawled – currently not indexed"** — Google is choosing not to index most inductee profile pages (thin/templated content). Plus **17 "Not found (404)"** legacy URLs that still need redirect reconciliation.

**Overall GA4 status: Installed and collecting, but conversion configuration is wrong.** GA4 (`G-VYQQ5E7ZHM`) fires once per page via GTM and is actively receiving data (158 users / 964 events in the last 7 days). The rich custom event taxonomy from the code (donate_click, event_register_click, golf_register_click, contact_click, etc.) **is** reaching GA4. **However, the wrong events are marked as Key events:** `page_view`, `first_visit`, and `user_engagement` are marked key (these fire on every session and are not outcomes), while the actual outcome clicks are **not** key. The two "true completion" key events (`donation_complete`, `conversion_event_purchase`) have **never received data**.

**Overall Google Ads / Ad Grants status: Running, but optimizing on garbage conversions.** The active account runs **2 Search campaigns**, both using **Maximize Conversions** bidding. Account totals for Jun 4–Jul 1: **144 impressions, 12 clicks, 8.33% CTR, and 32 "conversions" — a 266.67% conversion rate.** A >100% conversion rate is proof that a per-session event (almost certainly `page_view`) is being counted as a conversion. Maximize Conversions bidding is therefore steering the budget toward noise. One campaign (**Donations – JRHOF**) is *Eligible* but has **0 impressions** (not serving).

**Highest-risk issues (today):**
1. **GA4 Key events are meaningless conversions** (`page_view` / `first_visit` / `user_engagement` marked key) — and these are being imported into Google Ads (266% conv rate). This corrupts bidding. **P0.**
2. **No real conversion is being measured.** The events that represent nonprofit outcomes (donate clicks, registration clicks, contact, phone/email) are not key events; the two completion events have no data. **P0.**
3. **"Donations – JRHOF" Search campaign serving 0 impressions.** Budget allocated (~$209/day) but no delivery. **P1.**
4. **17 legacy URLs return 404 in Search Console** — redirect coverage gap. **P1.**
5. **140 inductee/profile pages not indexed** (thin content). **P2.**

**Best next actions today (no destructive changes):**
- In GA4, **unmark `page_view`, `first_visit`, `user_engagement` as Key events**; mark the real outcome events as Key (see §6/§7).
- In Google Ads, **audit which conversion actions are imported/primary** and remove page_view-type conversions from the "primary/bidding" set (Goals → Conversions).
- Investigate why **Donations – JRHOF** has 0 impressions (approval status, keywords, or conversion-starved Max Conversions).
- Export the Search Console **"Not found (404)"** list and reconcile against `public/_redirects`.

---

## 2. Technical SEO audit

| Area | Status | Evidence / notes |
|---|---|---|
| Indexability | ✅ CONFIRMED clean | No `X-Robots-Tag`, only intended `noindex` on `/404/` (`src/pages/404.astro:8`). |
| robots.txt | ⚠️ CONFIRMED (managed override) | Repo `public/robots.txt` allows all + points to `sitemap-index.xml`. **Live robots.txt is different** — Cloudflare is injecting a "Managed Content" block (Content-Signals + AI-crawler `Disallow` for GPTBot, CCBot, ClaudeBot, Google-Extended, Bytespider, etc.) **above** the repo content, producing **two `User-agent: *` groups**. Search crawling is still `Allow: /`. See finding SEO-1. |
| sitemap.xml | ✅ CONFIRMED | `https://jrhof.org/sitemap-index.xml` → `sitemap-0.xml`, **168 URLs**, `/404/` correctly excluded (`astro.config.mjs:12`). |
| canonical tags | ✅ CONFIRMED | Self-referential absolute canonical on every page (`BaseLayout.astro:127`, `:35`). |
| redirects | ✅ CONFIRMED working | `public/_redirects` (460 rules) covers legacy WordPress inductee slugs in 3 casings + event/privacy paths. Live tests: `/joe-rossi/`→301, `/Bill_Vincent/`→301. |
| legacy WP redirect coverage | ⚠️ CONFIRMED gap | Extensive coverage, but GSC shows **17 "Not found (404)"** URLs Google still discovers. Export and reconcile (finding SEO-2). |
| page titles | ✅ CONFIRMED | Template `"{title} | Joe Rossi Umpires Hall of Fame"` (`BaseLayout.astro:34`). |
| meta descriptions | ✅ CONFIRMED | Required prop per page; present on audited pages. |
| Open Graph / social | ✅ CONFIRMED | Full OG + Twitter summary_large_image, 1200×630 card (`BaseLayout.astro:135-149`). |
| structured data | ✅ CONFIRMED strong | JSON-LD `@graph`: Organization+NonprofitOrganization (with `taxID` EIN), WebSite, WebPage, BreadcrumbList (`BaseLayout.astro:68-99`). Escapes `<`. |
| 404 behavior | ✅ CONFIRMED | `not_found_handling: "404-page"` (`wrangler.jsonc:10`); live returns HTTP 404 with branded page. |
| internal linking | ✅ Good | Global header/footer nav to all key sections; inductee index links to profiles. |
| image alt text | ⚠️ Mostly good | Header/brand images have alt; footer emblem uses empty `alt=""` (decorative — correct). Inductee/gallery alt not exhaustively audited (UNVERIFIED — spot-check). |
| performance / CWV | ✅ Likely good | Static assets, `cf-cache-status: HIT`, speculation-rules prefetch, lazy images. No field CWV pulled (see §3). |
| duplicate content | ⚠️ Risk | 140 profile pages "crawled/discovered – not indexed" suggests Google sees them as low-value/near-duplicate templated content (finding SEO-3). |
| mobile usability | ✅ CONFIRMED | Responsive viewport, mobile nav toggle, custom mobile gallery viewer. |
| accessibility affecting SEO | ✅ Good | Skip link, `aria-current`, `aria-label`, semantic landmarks in `BaseLayout.astro`. |
| old WP sitemaps in GSC | ✅ Resolved | None present in GSC (see §3) — nothing to remove. |

**Finding SEO-1 (CONFIRMED, low SEO risk):** Live `robots.txt` ≠ repo `robots.txt`. Cloudflare "Managed Content / AI Audit" injects a signals block and blocks AI-training crawlers, creating a duplicate `User-agent: *` record. Google merges duplicate `*` groups and search access remains allowed, so ranking is unaffected. The repo's non-standard `Host:` directive is ignored by Google. **Action:** decide whether the repo file or Cloudflare should own robots.txt so there is a single source of truth (recommendation, not urgent).

**Finding SEO-2 (CONFIRMED):** 17 legacy URLs 404 per GSC. **Action:** GSC → Pages → "Not found (404)" → Export → add missing 301s to `public/_redirects`.

**Finding SEO-3 (CONFIRMED):** ~140 inductee/archive pages not indexed. Templated one-paragraph profiles read as thin content. **Action (§9 P2):** enrich a subset of high-value profiles (Joe Rossi and notable inductees) with unique biographical content, dates, and photos; ensure each is internally linked from the inductee index with descriptive anchor text.

---

## 3. Search Console audit

Property is a **Domain property** (`sc-domain:jrhof.org`) — best practice (covers http/https/www/non-www). CONFIRMED via GSC UI.

| Check | Observed (CONFIRMED) |
|---|---|
| Correct property | ✅ `jrhof.org` Domain property, authenticated as `tj@jrhof.org`. |
| Sitemap submission | ✅ Only `https://jrhof.org/sitemap-index.xml`, Type "Sitemap index", Submitted **Jul 1 2026**, Last read **Jul 1 2026**, Status **Success**, **168 discovered pages**, 0 videos. |
| Indexed pages | **68 indexed.** |
| Not indexed | **169 not indexed**, broken down as: **Discovered – currently not indexed 82**, **Crawled – currently not indexed 58**, **Not found (404) 17**, **Page with redirect 11**, **Redirect error 1**. |
| Blocked by robots.txt | **0** (good). |
| Excluded by 'noindex' | **0** (good). |
| Canonical conflicts | **0** ("Alternate page with proper canonical" 0; "Duplicate, Google chose different canonical" 0) — canonical setup is clean. |
| Crawl / redirect errors | 1 "Redirect error" (investigate — likely a chain/loop among legacy rules). |
| Page experience / CWV | **UNVERIFIED** — not opened. Verify: GSC → Experience → Core Web Vitals (needs field data; may show "not enough data" at current traffic). |
| Manual actions / security | **UNVERIFIED** — not opened. Verify: GSC → Security & Manual Actions (both should read "No issues"). |
| Search queries/pages | ✅ Data exists: **40 total web search clicks** (~90-day), spike ~Jun 23. Low volume, expected for a new cutover. |
| Resubmit new sitemap? | **No** — already submitted and read Success Jul 1. |
| Delete old WP sitemaps? | **No** — none are present. |
| Other | Recommendation card: **"2 unused verification tokens"** on the property (housekeeping; review before removing). |

**Interpretation:** Indexability mechanics are healthy. The 169 "not indexed" is dominated by (a) intentional/expected redirect URLs (11+1) and (b) low-priority thin pages Google is deprioritizing (140). The 17 404s are the only true defect here.

---

## 4. GA4 audit

**Delivery model (CONFIRMED):** GA4 is loaded **through GTM** (`GTM-WGDF4SBN` → GA4 config `G-VYQQ5E7ZHM`). Live network on the home page showed exactly **one** `gtag/js?id=G-VYQQ5E7ZHM` and **one** `g/collect … en=page_view` — **no duplicate page_view observed.** The codebase does **not** hardcode GA4/gtag (confirmed by grep) — single loader, good.

> **Note on the audit browser:** the GA4/Ads `collect` beacons returned HTTP `503` in the audit browser. This is a **client-side content/ad-blocker artifact in that browser** (GA4 library and GTM loaded 200; only the ad/analytics *beacons* were intercepted). GA4 Realtime independently showed live hits, so **collection is working in production.**

| Check | Status | Notes |
|---|---|---|
| Correct property & stream | ✅ | Property `511268663`, data stream "JRHOF Website" active. |
| Measurement ID installed | ✅ | `G-VYQQ5E7ZHM` firing via GTM. |
| GA4 firing | ✅ | Home: 158 users / 964 events (7d); Realtime 3 users. |
| page_view once vs duplicate | ✅ single | One page_view beacon observed. |
| Enhanced measurement | ✅ active | Recent events include `scroll`, `click` (outbound), `file_download`, `form_start`, `session_start`, `first_visit`, `user_engagement`, `page_view`. |
| Outbound clicks | ✅ | `click` event present + custom `external_partner_click` mapping in code. |
| File downloads | ✅ | `file_download` present. |
| Form interactions | ✅ | `form_start`, `form_submit` present. |
| Scrolls | ✅ | `scroll` present. |
| Site search | N/A | No on-site search feature; inductee "discovery" is browse-only. |
| Internal traffic filter | ⚠️ UNVERIFIED | Verify Admin → Data settings → Data filters (Internal traffic "Active" not "Testing") and a defined internal IP. Not opened. |
| Referral exclusions | ⚠️ UNVERIFIED | Verify Admin → Data streams → Configure tag settings → List unwanted referrals includes `stripe.com`, `checkout.stripe.com`, `eventbrite.com`. Not opened. |
| Cross-domain (Stripe/Eventbrite) | ⚠️ Gap | Donations/registration hand off to Stripe/Eventbrite (external, not owned) — cross-domain linking isn't applicable, but **referral exclusion** is (above), otherwise returns show as self-referral. |
| Data retention | ⚠️ UNVERIFIED | Verify Admin → Data settings → Data retention = **14 months** (default is 2 months). Not opened. |
| Attribution | ⚠️ UNVERIFIED | Verify Admin → Attribution settings (model + conversion window). Not opened. |
| **Key events / conversions** | ❌ **MISCONFIGURED** | See below. |
| Audiences | ⚠️ UNVERIFIED | Not opened. |
| DebugView / Realtime | ✅ | Realtime confirmed live. |

### GA4 Key events (CONFIRMED from Admin → Events → Key events)
Currently **marked as Key events**: `conversion_event_purchase` (no data), `donation_complete` (no data), `first_visit`, `form_submit`, `page_view`, `user_engagement`.

**Problems:**
- ❌ `page_view`, `first_visit`, `user_engagement` are **not outcomes** and must not be key events. (page_view as a key event = every pageview is a "conversion".)
- ❌ `conversion_event_purchase` and `donation_complete` show **"No stream data detected"** — they have never fired (donation completion is deferred until Stripe Checkout exists).
- ✅ `form_submit` as a key event is reasonable (contact form).

### Are the important actions tracked? (CONFIRMED via Recent events)
| Outcome | Event in GA4? | Key event? |
|---|---|---|
| Donation click (nav) | `donate_click` ✅ | ❌ not key |
| Donation click (donate page "Give once") | `donate_once_click` ✅ | ❌ not key |
| Event registration click (golf) | `golf_register_click` / `event_register_click` ✅ | ❌ not key |
| Banquet info click | `banquet_info_click` ✅ | ❌ not key |
| Contact click | `contact_click` ✅ | ❌ not key |
| Email click (`mailto:`) | inferred `email_click` in code (`BaseLayout.astro:265`) | not observed in last 28d (low traffic / no clicks) |
| Phone click (`tel:`) | inferred `phone_click` in code | not observed in last 28d |
| PDF/flyer download | `file_download` (enhanced measurement) ✅ | ❌ not key |
| Sponsor CTA | routes through `contact_click` (no dedicated event) | ❌ |
| Outbound Stripe/Eventbrite | captured via the click events above + `click` | ❌ not key |
| Donation completed | `donation_complete` (defined, **no data**) | ✅ key but never fires |

**Net:** the instrumentation in code is good and events flow to GA4, but the **Key-event selection is inverted** — housekeeping events are conversions and real actions are not.

---

## 5. Google Ads / Google Ad Grants audit

**Accounts (CONFIRMED):** two accounts under `tj@jrhof.org` — **JR AND ASSOCIATES INC (`850-823-3621`, active)** and **JR and Associates (`567-662-7574`, Cancelled)**. Recommendation: confirm the cancelled account is intentionally retired and not still linked to GA4/Merchant/Grants (no action taken).

**Campaigns (CONFIRMED — active account, Jun 4–Jul 1 2026):**
| Campaign | Type | Status | Budget/day | Bid strategy | Impr | Clicks | CTR | Cost | Conv | Conv rate |
|---|---|---|---|---|---|---|---|---|---|---|
| Evergreen – Awareness | Search | Eligible | $100.00 | Maximize conversions | 144 | 12 | 8.33% | $98.47 | 32 | 266.67% |
| Donations – JRHOF | Search | Eligible | $208.97 | Maximize conversions | 0 | 0 | — | $0.00 | 0 | 0% |
| **Account total** | | | $308.97 | | 144 | 12 | 8.33% | $98.47 | 32 | 266.67% |

| Check | Finding |
|---|---|
| Account structure | Only 2 campaigns; thin but Search-only (Ad-Grants-shaped). |
| Campaign types | ✅ Both **Search** (Ad Grants prohibits Display/Video/Shopping). |
| Bidding strategy | ✅ **Maximize Conversions** (removes the Ad Grants $2 CPC cap) — but see the conversion problem below. |
| Conversion goals | ❌ **Broken.** 266.67% conversion rate (32 conv / 12 clicks) proves a per-session event (page_view-type) is imported as a conversion. Bidding is optimizing on noise. **This is the #1 Ads issue.** |
| CTR / Ad Grants 5% rule | ✅ 8.33% account CTR is above the Ad Grants 5% minimum — but on tiny volume (12 clicks). |
| Delivery | ❌ **Donations – JRHOF: Eligible, 0 impressions.** Not serving (approval, keywords, or conversion-starved Max Conversions). |
| Keywords / negatives / search terms | **UNVERIFIED** — ad-group/keyword level not inspected this session. Verify single-word keyword removal, quality-score ≥ 2, and a negative-keyword list (Ad Grants requirements). |
| Geo targeting | **UNVERIFIED** — verify targeting to Colorado / relevant metro (not "all countries"). |
| Ad schedule | **UNVERIFIED**. |
| Landing pages | Home/donate/events pages are suitable, but `/donate/` currently shows "leave the site to Stripe" — acceptable. Ad Grants requires a clear nonprofit LP with substantial content (met). |
| Ad copy / sitelinks / assets | **UNVERIFIED** — not inspected. Ad Grants requires ≥2 ads per ad group, ≥2 ad groups per campaign, ≥2 sitelinks. Verify. |
| Ad Grants vs paid account | **UNVERIFIED** — the account shows real "Cost" ($98.47). Ad Grants credit also displays as Cost, so this alone doesn't distinguish. Verify: Billing → whether spend is Grants promotional credit, and whether the account is enrolled in the Grants program (Google for Nonprofits). |
| AdSense on site | ⚠️ `public/ads.txt` declares AdSense `pub-7839480824613721`. Running AdSense on an Ad-Grants site is discouraged/risky. Confirm AdSense is not actively monetizing the site (finding CODE-4). |
| Should any campaign be paused/rebuilt? | **Recommendation only:** do **not** trust current conversion data or Max-Conversions delivery until GA4 key events + Ads conversion imports are fixed (§6). After the fix, rebuild goals and let both campaigns re-learn. Investigate Donations delivery. |

---

## 6. Conversion model recommendation

Fix the GA4 key events first, then import the right ones to Ads. Recommended tiers:

| Action | GA4 event | Primary or Secondary | Import to Ads? | Rationale |
|---|---|---|---|---|
| **Donation completed** | `donation_complete` (+ `purchase` w/ value once Stripe exists) | **Primary** | ✅ Yes (bidding) | The true revenue outcome. Not live yet — wire on Stripe success. |
| Donation click / checkout start | `donate_click`, `donate_once_click`, `donate_monthly_click` | **Secondary** | Optional | Strong intent proxy **until** completion tracking exists; use as interim primary if needed. |
| **Event registration completed** | `registration_complete` (future, on Stripe/native) | **Primary** | ✅ Yes | Golf/banquet revenue outcome. Not live (Eventbrite is external). |
| Event registration checkout start | `event_register_click`, `golf_register_click` | **Secondary** | Optional (interim primary) | Best available signal while registration is on Eventbrite. |
| Contact form submission | `form_submit` (contact) | **Primary** (secondary once donations exist) | ✅ Yes | Real lead; already firing. |
| Email click | `email_click` | Secondary | No | Micro-conversion. |
| Phone click | `phone_click` | Secondary | No | Micro-conversion. |
| Sponsor inquiry | `sponsor_inquiry` (new) or `contact_click{context:sponsor}` | **Primary** (sponsor campaigns) | Optional | Currently folded into contact — split out. |
| PDF flyer download | `file_download` (flyer) | Secondary | No | Interest signal. |
| Event page engagement | `scroll` / `user_engagement` | **Not a conversion** | ❌ No | Engagement metric only. |
| Inductee discovery/use | `select_content` / inductee view | Secondary | No | Content-value signal. |
| Outbound Eventbrite/Stripe click | the click events above | Secondary (interim primary) | Optional | Use until native completion tracking exists. |

**Rule:** exactly one or two **Primary** conversions drive bidding. Never make `page_view`, `first_visit`, `user_engagement`, `scroll`, or `session_start` a conversion.

---

## 7. Recommended GA4 event taxonomy (for Codex)

The code already emits most of these to `dataLayer` via `jrhofTrack` (`BaseLayout.astro:246-278`) and `trackingAttrs` (`config/site.ts:53`). This standardizes names, params, and key/import status. Most changes are in **GTM + GA4 UI**, not code.

| Event name | Trigger | Key params | Key event? | Import to Ads? | Implementation note |
|---|---|---|---|---|---|
| `page_view` | Every page (auto) | — | **No** | No | Un-mark as key in GA4. |
| `donate_click` | Click any Donate link | `link_text`, `destination_url` | Yes (interim) | Interim | Already emitted (nav/footer). |
| `donate_once_click` / `donate_monthly_click` | Donate page CTAs | `donation_type`, `destination_url` | Yes (interim) | Interim | Already emitted (`donate/index.astro:39-41`). |
| `banquet_support_click` | Banquet support CTA | `donation_type` | Secondary | No | Already emitted. |
| `event_register_click` / `golf_register_click` | Registration CTA → Eventbrite | `event_slug`, `destination_url` | Yes (interim) | Interim | Already emitted. |
| `banquet_info_click` | Banquet info CTA | `event_slug` | Secondary | No | Already emitted. |
| `contact_click` | Contact links | `link_text`, `destination_url` | Secondary | No | Already emitted. |
| `form_submit` | Contact form submit | `form_id` | **Yes (Primary)** | ✅ | Already firing; ensure it's a genuine submit, not just focus. |
| `email_click` / `phone_click` | `mailto:` / `tel:` click | `destination_url` | Secondary | No | Already inferred in code. |
| `file_download` | PDF/flyer download | `file_name` | Secondary | No | Enhanced measurement. |
| `sponsor_inquiry` | Sponsor page primary CTA | `sponsor_tier` | **Yes (Primary for sponsor)** | ✅ | **New** — split from `contact_click` on `/sponsor/`. |
| `gallery_open` / `gallery_close` | Gallery lightbox | `gallery_name`, `photo_index` | No | No | Already emitted (`GalleryGrid.astro`). |
| `donation_complete` | Stripe success page/webhook | `value`, `currency`, `transaction_id` | **Yes (Primary)** | ✅ | **Future** — needs Stripe Checkout (deferred). Dedupe by `transaction_id`. |
| `registration_complete` | Registration success | `value`, `event_slug`, `transaction_id` | **Yes (Primary)** | ✅ | **Future**. |

**Codex note:** the biggest wins are configuration, not code. Only *new* code items above are `sponsor_inquiry` (and later `donation_complete`/`registration_complete` when Stripe lands). `GalleryGrid.astro:248` references `window.gtag` as a fallback — harmless (gtag exists only if GTM loads a GA config), but prefer the `jrhofTrack`/dataLayer path for consistency.

---

## 8. Repo / code audit

| Area | Finding |
|---|---|
| Analytics implementation | ✅ Single GTM loader (`BaseLayout.astro:116-124`, noscript `:154-157`); dataLayer bridge + delegated click tracking (`:246-278`); no hardcoded GA4/gtag/Ads (grep-confirmed). Clean architecture. |
| **CSP — Ads gap** | ⚠️ **CODE-1 (CONFIRMED).** `public/_headers:7` CSP whitelists GA4/GTM/Clarity/Cloudflare, but **not** Google Ads endpoints: `www.google.com` (Ads `ccm/collect`), `googleads.g.doubleclick.net`, `td.doubleclick.net`, `googleadservices.com` are **absent** from `connect-src`/`img-src`. GA4 conversions still reach Ads via the GA4→Ads server-side import (explains the 32 conv), but **direct Google Ads remarketing/enhanced-conversion pixels (`AW-17438185594`) may be CSP-blocked** in browsers without a blocker. **Verify** in a clean browser: DevTools console for `Refused to connect … www.google.com/ccm/collect … violates CSP directive "connect-src"`. If confirmed, add the Ads hosts to `connect-src` and `img-src`. |
| CSP — GA4/GTM/Clarity | ✅ Correct: `googletagmanager.com`, `google-analytics.com` (+ region1/`*.analytics.google.com`), `clarity.ms`, `cloudflareinsights` all present in the right directives. |
| Environment variables | ✅ `.env.example` documents `PUBLIC_CLARITY_PROJECT_ID=v8l2xfpqpy`, `PUBLIC_SITE_URL`, `PUBLIC_MEDIA_BASE_URL`; Stripe URL fallbacks in `config/site.ts:24-33`. No secrets committed. |
| Hardcoded dummy/real IDs | ⚠️ **CODE-2.** A **real Stripe donate Payment Link is hardcoded as a fallback** (`config/site.ts:28`) and golf raffle/mulligan links (`:31-32`). Not dummy, but they bypass env config — confirm they're the intended live links. |
| sitemap generation | ✅ `@astrojs/sitemap` (`astro.config.mjs:11-13`), `/404/` excluded, `trailingSlash: 'always'`. |
| robots.txt | ✅ in repo; ⚠️ overridden/merged by Cloudflare managed content live (SEO-1). |
| llms.txt | ✅ Present and well-formed (`public/llms.txt`). |
| structured data component | ✅ In `BaseLayout.astro` (§2). |
| page metadata component | ✅ Centralized in `BaseLayout.astro` props. |
| Astro route coverage | ✅ 168 routes; matches sitemap; legacy routes handled via `_redirects`. |
| 404 / redirect behavior | ✅ `wrangler.jsonc` 404 handling; `_redirects` 301s working live. |
| Cloudflare headers | ✅ Strong security headers (HSTS preload, XFO DENY, nosniff, Permissions-Policy). |
| **ads.txt / AdSense** | ⚠️ **CODE-4.** `public/ads.txt:1` declares AdSense `pub-7839480824613721`. Likely a WordPress leftover. Confirm whether AdSense should exist on a nonprofit/Ad-Grants site; if not, remove `public/ads.txt`. |
| **Stale docs** | ⚠️ **CODE-3 (CONFIRMED).** Three docs state GA4 `G-VYQQ5E7ZHM` is delivered **through Cloudflare Zaraz** (`docs/JRHOF_MASTER_STATUS.md:12`, `docs/DECISIONS.md:51`, `docs/launch/SEO_AND_AD_GRANTS_READINESS.md:58`), while `docs/ANALYTICS.md:5-11` states GA4 is delivered **through GTM** and "Zaraz must not load GA4." **Live traffic proves GA4 now loads via GTM.** These docs contradict each other and will mislead future work. **Also a duplication risk:** if Zaraz *still* has `G-VYQQ5E7ZHM` configured, page_views would double. (Not observed on the home page — only one beacon — but verify Zaraz is empty per `ANALYTICS.md` item 4.) Update the stale docs to reflect GTM as the single loader. |

---

## 9. Prioritized fixes

### P0 — Fix today (Google UI, no code deploy)
1. **GA4:** Un-mark `page_view`, `first_visit`, `user_engagement` as Key events (Admin → Events → Key events → toggle star off).
2. **GA4:** Mark real outcomes as Key events: `form_submit` (keep), and interim `donate_click`/`donate_once_click`, `event_register_click`/`golf_register_click`. (See §6/§7.)
3. **Google Ads:** Goals → Conversions → verify which actions are **Primary** (used for bidding). Remove any page_view-type/GA4 auto-event conversion from Primary; keep only real outcomes. This is what's producing the 266% conv rate.

### P1 — This week
4. **Google Ads:** Diagnose **Donations – JRHOF** 0-impression delivery (ad/keyword approval, keyword list, or conversion-starved Max Conversions). Consider Maximize Clicks temporarily until real conversions accumulate.
5. **SEO:** Export GSC "Not found (404)" (17) → add 301s to `public/_redirects`.
6. **GA4:** Confirm Data retention = 14 months; internal-traffic filter Active; referral exclusions for `stripe.com`/`eventbrite.com`.
7. **Docs (code):** Fix stale Zaraz-vs-GTM docs (CODE-3); confirm Zaraz has no GA4/Ads tag.

### P2 — Before next event campaign
8. **CSP:** Verify/patch Ads endpoints in `public/_headers` (CODE-1) so remarketing/enhanced conversions aren't blocked.
9. **SEO:** Enrich high-value inductee/profile pages to improve indexing (SEO-3).
10. **Ads:** Build proper structure — ≥2 ad groups/campaign, ≥2 ads/ad group, sitelinks/callouts; add negatives; set Colorado geo; remove single-word keywords (Ad Grants).
11. **AdSense:** Resolve `ads.txt`/AdSense (CODE-4).

### P3 — Later
12. Wire `donation_complete`/`registration_complete` with value + `transaction_id` dedupe when Stripe Checkout ships; import as Primary and retire interim click-based conversions.
13. Retire/confirm the cancelled Ads account `567-662-7574`; remove 2 unused GSC verification tokens after review.
14. Decide single owner for robots.txt (Cloudflare managed vs repo).

---

## 10. Codex-ready implementation tasks (repo-side only)

> GA4/Ads/GSC changes are **not** code — see §11. These are the only repo changes.

### Task A — Patch CSP for Google Ads endpoints
- **Branch:** `fix/csp-google-ads-endpoints`
- **Goal:** Allow Google Ads conversion/remarketing pixels so `AW-17438185594` isn't CSP-blocked.
- **Files:** `public/_headers`
- **Change:** add to `connect-src` and `img-src`: `https://www.google.com https://googleads.g.doubleclick.net https://td.doubleclick.net https://www.googleadservices.com`; keep `frame-src` as-is unless a conversion iframe is needed.
- **Acceptance:** clean-browser DevTools shows no CSP "Refused to connect" for `ccm/collect`/doubleclick; GA4/Clarity still load; no new console CSP errors.
- **Validate:** load `/` and `/donate/` in a browser **without** an ad blocker; Network shows `ccm/collect` 200/204; Tag Assistant shows Ads tag firing.
- **Safe to deploy immediately:** Yes (additive CSP; verify first in preview).

### Task B — Remove/confirm AdSense ads.txt
- **Branch:** `chore/remove-adsense-ads-txt`
- **Goal:** Remove leftover AdSense declaration if AdSense is not used.
- **Files:** `public/ads.txt` (delete) — **only after** owner confirms AdSense is not monetizing the site.
- **Acceptance:** `/ads.txt` returns 404; no AdSense account depends on it.
- **Validate:** confirm with account owner; check AdSense dashboard.
- **Safe to deploy immediately:** No — requires owner confirmation first.

### Task C — Reconcile 17 legacy 404s
- **Branch:** `fix/legacy-404-redirects`
- **Goal:** Add 301s for legacy URLs still 404ing in GSC.
- **Files:** `public/_redirects`
- **Acceptance:** each exported 404 URL returns 301 to a valid target; no redirect loops.
- **Validate:** `curl -sI` each; re-run GSC validation on "Not found (404)".
- **Safe to deploy immediately:** Yes (once the list is in hand).

### Task D — Fix stale analytics docs
- **Branch:** `docs/analytics-gtm-single-loader`
- **Goal:** Make GTM the single documented GA4/Ads loader; remove Zaraz claims.
- **Files:** `docs/JRHOF_MASTER_STATUS.md:12`, `docs/DECISIONS.md:31,51`, `docs/launch/SEO_AND_AD_GRANTS_READINESS.md:58`.
- **Acceptance:** docs consistently state GA4 `G-VYQQ5E7ZHM` + Ads `AW-17438185594` load via `GTM-WGDF4SBN`; no Zaraz GA4 references.
- **Safe to deploy immediately:** Yes (docs only).

### Task E — Add `sponsor_inquiry` event (optional, before sponsor campaign)
- **Branch:** `feat/sponsor-inquiry-event`
- **Goal:** Distinct conversion for sponsor CTA (split from `contact_click`).
- **Files:** `src/pages/sponsor/index.astro` (add `trackingAttrs('sponsor_inquiry', {...})`), then map in GTM→GA4.
- **Acceptance:** clicking the sponsor CTA pushes `sponsor_inquiry` to dataLayer; visible in GA4 DebugView.
- **Safe to deploy immediately:** Yes (additive).

---

## 11. Google UI action checklist

| # | System | Exact UI path | Current (observed) | Recommended | Risk | When |
|---|---|---|---|---|---|---|
| 1 | GA4 | Admin → Events → Key events | `page_view`, `first_visit`, `user_engagement` marked Key | Un-mark all three | Low | **Now** |
| 2 | GA4 | Admin → Events → Key events | Real click events not Key | Mark `donate_click`, `donate_once_click`, `event_register_click`/`golf_register_click` Key (interim); keep `form_submit` | Low | **Now** |
| 3 | Google Ads | Goals → Conversions → Summary | 266% conv rate; suspect page_view-type action is Primary | Set only real outcomes as Primary; move noise to Secondary | Med (affects bidding) | **Now** |
| 4 | Google Ads | Campaigns → Donations – JRHOF | Eligible, 0 impressions | Diagnose approval/keywords; consider Maximize Clicks interim | Med | This week |
| 5 | GA4 | Admin → Data settings → Data retention | UNVERIFIED | 14 months | Low | This week |
| 6 | GA4 | Admin → Data settings → Data filters | UNVERIFIED | Internal traffic filter Active + internal IP | Low | This week |
| 7 | GA4 | Admin → Data streams → Configure tag → Unwanted referrals | UNVERIFIED | Exclude `stripe.com`, `eventbrite.com` | Low | This week |
| 8 | Search Console | Pages → Not found (404) → Export | 17 URLs | Feed to Codex Task C | Low | This week |
| 9 | Search Console | Settings → Ownership verification | 2 unused tokens | Review, then remove | Low | Later |
| 10 | Google Ads | Billing / Account settings | Grants-vs-paid UNVERIFIED | Confirm Ad Grants enrollment & compliance status | Med | This week |
| 11 | Cloudflare | Zaraz dashboard | UNVERIFIED (docs claim GA4 here) | Confirm no GA4/Ads/GTM tag in Zaraz (avoid duplicates) | Med | This week |
| 12 | Google Ads | Cancelled account `567-662-7574` | Cancelled | Confirm intentional; ensure not linked to GA4/Grants | Low | Later |

---

### Verification appendix (for UNVERIFIED items)
- **Ads collect 503 in this audit:** re-test in a browser with no ad/privacy blocker; expect `ccm/collect`/`g/collect` = 200/204.
- **CWV field data:** GSC → Experience → Core Web Vitals (may show "insufficient data" at current traffic); cross-check PageSpeed Insights for `jrhof.org/`.
- **Manual actions/security:** GSC → Security & Manual Actions (expect "No issues").
- **Ad Grants compliance detail (keywords, negatives, geo, ad count, sitelinks):** Google Ads → each campaign → Keywords / Ad groups / Assets; and Google for Nonprofits → Ad Grants status.
