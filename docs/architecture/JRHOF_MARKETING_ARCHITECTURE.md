# JRHOF Marketing & Measurement Architecture

**Version:** 1.2 — 2026-07-02
**Role:** Target-state blueprint for the entire Google marketing ecosystem (GA4, GTM, Google Ads / Ad Grants, Search Console, Business Profile), plus Clarity, Cloudflare, and Stripe as they affect measurement.
**Companions:**
- Roadmap & phased plan: `docs/roadmaps/JRHOF_DIGITAL_MARKETING_ROADMAP.md`
- Day-to-day operations: `docs/playbooks/JRHOF_GA4_GTM_ADS_OPERATIONS.md`
- Point-in-time audit: `docs/audits/JRHOF_SEO_GA4_ADS_AUDIT_2026-07-02.md`

Everything marked **CONFIRMED** was directly observed on 2026-07-02 (authenticated Google/Stripe UIs, live network traces, or repo files). Items marked **INFERRED** or **UNVERIFIED** say so explicitly.

The dashboard observations below are a dated audit baseline, not a promise of current account state. The durable repository rule is unchanged: `GTM-WGDF4SBN` is the only Google loader, and Zaraz must contain no GA4, Google Ads, GTM, or other Google measurement tool. Re-check account state through the operations playbook after any publisher or ownership change.

---

## 0. System of record — verified identifiers

| System | Identifier | Status |
|---|---|---|
| GTM container | `GTM-WGDF4SBN` (account "JRHOF" 6346792949 / container 247717483) | CONFIRMED at audit time — **Version 7 was live on 2026-07-02: 4 tags, 1 trigger, 2 variables** |
| GA4 | Account `373612649` "Joe Rossi Hall of Fame" → Property `511268663` "jrhof.org" → stream "JRHOF Website" (`G-VYQQ5E7ZHM`, stream id 14271983607) | CONFIRMED |
| Google Ads (active) | **JR AND ASSOCIATES INC — 850-823-3621** | CONFIRMED; Billing shows **"We don't bill you"** → Ad Grants (INFERRED from billing state + Search-only + $308.97/day ≈ $10k/mo budget pattern; confirm enrollment in Google for Nonprofits) |
| Google Ads (cancelled) | JR and Associates — 567-662-7574 | CONFIRMED cancelled; not linked to GA4 |
| Ads ↔ GA4 link | One link: 850-823-3621, Personalized Advertising Enabled, linked 2026-03-28 | CONFIRMED |
| GSC ↔ GA4 link | URL-prefix property `https://jrhof.org/` linked 2026-07-01 | CONFIRMED |
| Google Ads web tag | `AW-17438185594` (loaded via GTM) | CONFIRMED live; **UNVERIFIED that it belongs to 850-823-3621** — check Ads → Tools → Data manager/Google tag |
| Search Console | Domain property `sc-domain:jrhof.org` (primary) + URL-prefix `https://jrhof.org/` (exists for the GA4 link) | CONFIRMED |
| Microsoft Clarity | `v8l2xfpqpy`, loaded by `src/components/Clarity.astro` | CONFIRMED |
| Cloudflare Web Analytics | auto-injected beacon | CONFIRMED |
| Stripe (live) | 6 Payment Links (5 active, 1 inactive) — see §8.3 | CONFIRMED via Stripe API (read-only) |
| Google Business Profile | **None exists** ("Google Maps can't find Joe Rossi Umpires Hall of Fame") | CONFIRMED 2026-07-02 |

---

## 1. Design principles

1. **Completed outcomes over clicks.** A conversion is money received, a registration completed, or a qualified inquiry submitted. Clicks toward those outcomes are *intent signals* (secondary), never the thing we optimize bidding on once a completed signal exists.
2. **One loader per tool, one taxonomy for all tools.** GTM is the only Google loader. The site's `dataLayer` (via `jrhofTrack`) is the only event vocabulary. GA4 is the only conversion source for Google Ads. No parallel gtag, no Zaraz Google tags, no duplicate Clarity.
3. **Money systems are the source of truth.** Stripe (now) and D1 (later) are authoritative for revenue and registrations. GA4 is the behavioral/attribution layer and is *expected* to undercount (ad blockers — empirically observed in this audit). Board reporting reconciles both; it never treats GA4 as the ledger.
4. **Volunteer-operable.** Every design choice must survive a hand-off. Fewer tags with clear names beat clever automation. No server-side GTM, no CMP platform, no paid SaaS unless a phase explicitly justifies it.
5. **Preserve history.** Keep the existing GA4 property, GTM container, GSC properties, and event names that already have data. Rebuild *inside* them (new versions, new key-event flags) rather than replacing them. The only thing worth rebuilding from scratch is the Ads campaign set, whose 4 weeks of history is optimization noise.
6. **Ad Grants compliance is a standing constraint,** not a one-time checklist: Search-only, mission-relevant keywords, no single-word/generic keywords, QS hygiene, ≥5% CTR, meaningful conversion reporting.

---

## 2. Verified audit baseline — the three defects that defined the redesign

### Defect A — The measurement pipeline is severed at GTM (CONFIRMED, empirical)
The site emits a rich taxonomy (`donate_click`, `donate_once_click`, `golf_register_click`, `event_register_click`, `banquet_info_click`, `contact_click`, `gallery_open/close`, `email_click`, `phone_click`, `external_partner_click`) via `window.jrhofTrack` → `dataLayer.push` (`src/components/BaseLayout.astro:246-278`). The **live GTM Version 7 contains no triggers or tags for any of them** — only: Google tag (GA4 config), Google tag (AW-17438185594), Conversion Linker, and one GA4 event tag "Donate Click (Stripe)" that fires on a **link-click trigger** ("Just Links"), not on the dataLayer event, sending only `link_url`/`page_path`.
**Empirical proof:** clicking a gallery photo on `/events/golf/2025-umpires-cup-iii/` pushed `gallery_open` to the dataLayer and produced **zero** GA4 network attempts (only Clarity beacons).
**Consequence:** every custom event except link-derived `donate_click` is currently discarded. The custom events visible in GA4's last-28-day list arrived via an earlier transport (most likely the pre-cutover Zaraz-based setup recorded in the dated audit — INFERRED; Zaraz was not loading during the network trace). **Net: the site lost most event tracking at cutover.** GTM's own container-quality banner reads "Urgent — container issues are likely impacting your measurement."

### Defect B — Conversion definitions are inverted end-to-end (CONFIRMED)
GA4 key events: `page_view`, `first_visit`, `user_engagement`, `form_submit` (plus `donation_complete` and `conversion_event_purchase`, which have **never received data**). All 7 Google Ads conversion actions are GA4 imports, **all Primary, all flagged "Misconfigured"** by Google: `page_view` (14 conv), `first_visit` (9), `user_engagement` (9), `form_submit` (0), `purchase` (0), `PURCHASE` (0), `donation_complete` (0). Account shows **32 conversions on 12 clicks (266.67%)**. Both campaigns bid **Maximize Conversions** — i.e., the bidder is optimizing toward *sessions existing*, not outcomes.

### Defect C — The donation completion signal already exists and is unused (CONFIRMED)
Stripe Payment Links `plink_1SUxwiAi…` (one-time, `donate.stripe.com/00w5kC…y01`) and `plink_1TFyNhAi…` (monthly, `donate.stripe.com/14AfZg…y04`) **already redirect to `https://jrhof.org/donate/thank-you/` after successful payment.** A real `donation_complete` conversion is therefore implementable *today* with a GTM trigger — no Stripe engineering. (Raffle `…y02` and mulligans `…y03` links use hosted confirmation — completions not client-trackable until their redirect is added. A sixth active link `buy.stripe.com/eVq8wO…y05` is unreferenced in `src/config/site.ts` — reconcile.)

Secondary facts observed in the baseline audit: Ad Grants billing state; healthy GSC (sitemap Success, 0 robots/noindex/canonical errors; 68 indexed / 169 not, of which 140 thin-content deprioritized + 17 legacy 404s); `Donations – JRHOF` campaign Eligible with 0 impressions; no GBP; CSP omitted Google Ads endpoints; AdSense `ads.txt` leftover; `/donate/thank-you/` and `/donate/return/` were indexable and in the sitemap.

Repository follow-up completed on 2026-07-02: PR-1 noindexed and excluded the donation return/thank-you routes and added gated donation-completion tracking; PR-2 added the Stripe client-reference attribution bridge; PR #26 added the required Google Ads CSP endpoints and removed the gallery `window.gtag` fallback. The AdSense/`ads.txt` status remains unresolved and the file must remain until the owner confirms it is unused.

---

## 3. Target measurement flow

```
                        ┌────────────────────────────────────────────┐
                        │  jrhof.org (Astro, Cloudflare Workers)     │
                        │  dataLayer  ←  jrhofTrack(event, params)   │
                        └───────────────┬────────────────────────────┘
                                        │ (custom-event triggers, hostname-guarded)
                                ┌───────▼────────┐
                                │  GTM WGDF4SBN  │  ← ONLY Google loader
                                └───┬────────┬───┘
                     GA4 event tags │        │ Conversion Linker (+ AW tags Phase 6 only)
                            ┌───────▼──┐  ┌──▼───────────────┐
                            │   GA4    │  │ Google Ads       │
                            │ G-VYQQ…  │──► conversions =    │
                            │ key evts │  │ GA4 imports ONLY │
                            └───┬──────┘  └──────────────────┘
              BigQuery export   │   ▲ GSC link (queries)
                        ┌───────▼───┴────┐
                        │  Looker Studio │ ← board dashboard (behavioral layer)
                        └───────▲────────┘
                                │ reconciliation (monthly)
   Stripe Checkout / Links ─────┴──► Worker webhook ──► D1 (financial truth)
   (+ client_reference_id = GA client_id)      └──► CSV / Sheets / Drive exports
```

Clarity (`v8l2xfpqpy`, Astro component) and Cloudflare Web Analytics remain as independent, non-Google observers. Neither feeds conversions.

---

## 4. GA4 architecture

**Keep** account `373612649` / property `511268663` / stream `G-VYQQ5E7ZHM`. Do **not** create a new property (history preservation; the June data, however transport-flawed, is baseline). One property, one web stream — explicitly reject property-per-environment sprawl; non-production hostnames are excluded at the GTM layer (§5).

| Setting | Target | Why / note |
|---|---|---|
| Data retention | **14 months** (Admin → Data settings → Data retention) | Default 2 months destroys year-over-year explorations. UNVERIFIED current value — check first. |
| Reporting identity | Blended (default) | Low volume; no reason to restrict. |
| Google signals | Off | Privacy-conservative nonprofit posture; demographics not worth it at this volume. |
| Internal traffic | Define internal IPs (board/TMCO/webmaster), rule `traffic_type=internal`, filter **Testing → verify → Active** | Board members will otherwise be a visible % of 150-user weeks. |
| Developer traffic | Handled in GTM via hostname guard (§5), *not* GA4 filters | One mechanism, testable in Preview. |
| Unwanted referrals | `stripe.com`, `buy.stripe.com`, `donate.stripe.com`, `checkout.stripe.com`, `eventbrite.com` | Prevents returning donors being re-attributed to "referral: stripe.com". Eventbrite entry removable at Phase 5. |
| Attribution | Data-driven (default), Paid & organic channels; acquisition windows default (30d acq / 90d other) | DDA degrades gracefully at low volume; no reason to force last-click. |
| Custom dimensions (event scope) | `donation_type`, `event_slug`, `event_year`, `cta_location`, `link_context`, `sponsor_tier`, `gallery_name`, `file_name` | Register **only** these 8 now (50-dim quota headroom). Without registration the params collect but can't be reported on. |
| Key events | Exactly the taxonomy table in §6 — nothing else. `page_view`, `first_visit`, `user_engagement`, `scroll`, `session_start` are **never** key events. | Root fix for Defect B. |
| Ecommerce | Adopt GA4 `purchase` schema at Phase 4+ (value, currency, transaction_id, items[] with `item_category`: donation / golf_registration / banquet_seat / sponsorship) | Native revenue reporting; deduplication by transaction_id; clean Ads value import. Until then `donation_complete` carries no value (Payment Links hide amount client-side; value truth stays in Stripe). |
| BigQuery link | Enable daily export (free tier; volume is trivial) | Future-proofs board reporting; avoids GA4 API quotas/sampling in Looker Studio; enables D1↔GA4 reconciliation joins at Phase 5. |
| GSC link | Done (2026-07-01) — **publish** the Search Console report collection (Reports → Library → Search Console → Publish) | Linking alone doesn't surface the reports. |
| Audiences | §11 | — |

**Anti-recommendations (GA4):** no additional properties or streams; no Measurement Protocol before Phase 4 (client-side thank-you tracking is sufficient and carries attribution); no consent banner solely for GA4 while the audience is US-only — revisit only if policy/jurisdiction changes (current tags run consent-granted defaults, `gcd=13l3l3l3l1l1` observed).

---

## 5. GTM architecture

Keep container `GTM-WGDF4SBN`. The rebuild is **one new version** (v8) replacing the 4-tag skeleton. Everything below is buildable in an afternoon and testable in Preview before publish.

### 5.1 Naming & structure
- Tags: `GA4 | Event | <event_name>`, `GA4 | Config`, `AW | Conversion Linker`, `Google Tag | AW-17438185594`
- Triggers: `CE | <event_name>` (Custom Event), `PV | <path>` (Page View), `Guard | Non-prod hostname` (exception)
- Variables: `DLV | <param>` (Data Layer Version 2), `Const | GA4 ID`, `Const | AW ID`, `ESV | Shared params` (Google-tag event settings variable carrying `cta_location`, `page_path`)
- Folders: `Core`, `Outcomes`, `Intent`, `Engagement`.

### 5.2 Build spec

| # | Tag | Type | Trigger | Notes |
|---|---|---|---|---|
| 1 | `GA4 | Config` (exists, keep) | Google tag `G-VYQQ5E7ZHM` | Initialization – All Pages **+ exception `Guard | Non-prod hostname`** | Guard: Page Hostname does not equal `jrhof.org` → blocks workers.dev previews & localhost from prod data. |
| 2 | `Google Tag | AW-17438185594` (keep, pending ownership check) | Google tag | Init – All Pages + guard | Verify tag belongs to 850-823-3621 before Phase 6 use; harmless meanwhile (remarketing ping only). |
| 3 | `AW | Conversion Linker` (keep) | Conversion Linker | All Pages | Required for future gclid-based anything. |
| 4–14 | `GA4 | Event | <name>` — one per taxonomy row in §6 with source `dataLayer` | GA4 Event, event name = the dataLayer name, params via `DLV |` variables | `CE | <name>` custom-event trigger | **Explicit tags, not a `.*` regex pass-through.** Rationale: a catch-all forwards typos and future noise into GA4 forever; 11 explicit tags are self-documenting and individually pausable. |
| 15 | `GA4 | Event | donation_complete` | GA4 Event | `PV | /donate/thank-you/` **with condition: Page URL contains `cs=` OR Referrer contains `stripe.com`** | The Defect-C fix. The gate prevents false conversions from direct/organic hits on the thank-you URL (it is currently indexable & sitemap-listed until the Phase 3 PR lands). Marked key event in GA4 same day. |
| 16 | *(delete)* `Donate Click (Stripe)` link-click tag + `Donate Trigger` | — | — | Superseded by the dataLayer `donate_click` tag (#4) which carries full params. Deleting avoids double-counting `donate_click`. |

**Migration semantics:** `donate_click` event name is preserved (history continuous); its trigger source changes from link-click to dataLayer. All other taxonomy events regain flow after ~3 months of silence — annotate the gap in GA4 (Ops playbook §3).

### 5.3 Governance
- Publish only from a reviewed workspace with a version name `vN — <change summary>`; screenshot Preview evidence into the version notes.
- Two editors maximum (webmaster + one backup). No agency/third-party access without a named account.
- Container quality banner issues (currently 3, "Urgent") re-checked after v8 — expected to clear once tags fire.

---

## 6. Event taxonomy v1.0 (canonical)

Site emits via `jrhofTrack(name, params)` / `trackingAttrs()` (`src/config/site.ts:53`). Names are `object_action`, snake_case, ≤40 chars. **This table is the single vocabulary for code, GTM, GA4, and Ads.** Adding an event = PR updating this table + GTM tag + (if warranted) key-event flag.

| Event | Fires when | Params | GA4 key event? | → Ads (as GA4 import)? | Phase |
|---|---|---|---|---|---|
| `page_view` | Auto (Google tag) | — | **No** | **No** | Live |
| `donation_complete` | Thank-you page after Stripe redirect (gated, §5.2 #15); Phase 4: success page w/ `transaction_id`, `value` | `donation_type?`, later `value`, `currency`, `transaction_id` | **Yes — PRIMARY** | **Yes** | **Phase 2** |
| `registration_complete` | Native registration success (golf/banquet) | `event_slug`, `event_year`, `value`, `transaction_id` | **Yes — PRIMARY** | **Yes** | Phase 5 |
| `sponsor_inquiry` | Sponsor form/CTA on `/sponsor/` (new event, split from contact) | `sponsor_tier?`, `cta_location` | **Yes — PRIMARY** (sponsor campaigns) | Yes | Phase 3 |
| `form_submit` (contact) | Contact form submission | `form_id`, `page_path` | **Yes** | Yes | Live (EM) |
| `volunteer_interest` | Future volunteer CTA/form | `cta_location` | Yes (when live) | Yes | Phase 5+ |
| `donate_click` | Any donate-intent click (nav, footer, cards) | `link_text`, `destination_url`, `cta_location` | Interim yes → **demote when `donation_complete` has ≥30 days of data** | Interim yes → demote | Phase 2 |
| `donate_once_click` / `donate_monthly_click` / `banquet_support_click` | Donate-page Stripe CTAs | `donation_type`, `destination_url` | No (funnel diagnostics) | No | Phase 2 |
| `event_register_click` / `golf_register_click` | Registration CTA → Eventbrite (interim) | `event_slug`, `event_year`, `destination_url` | Interim yes → demote at Phase 5 | Interim yes → demote | Phase 2 |
| `banquet_info_click` | Banquet info CTA | `event_slug` | No | No | Phase 2 |
| `contact_click` | Contact links sitewide | `link_text`, `destination_url` | No | No | Phase 2 |
| `email_click` / `phone_click` | `mailto:` / `tel:` (auto-inferred in BaseLayout) | `destination_url` | No | No | Phase 2 |
| `external_partner_click` | CHSBUA / TMCO outbound | `partner`, `destination_url` | No | No | Phase 2 |
| `gallery_open` / `gallery_close` | Lightbox interactions | `gallery_name`, `event_slug`, `event_year`, `photo_index`, `photo_count` | No | No | Phase 2 |
| `file_download` | Enhanced measurement (flyers/PDFs) | auto (`file_name`…) | No | No | Live (EM) |
| `scroll`, `click`, `form_start`, `session_start`, `first_visit`, `user_engagement` | Enhanced measurement / auto | auto | **Never** | **Never** | Live |

Code hygiene complete: the gallery `window.gtag` fallback was removed in PR #26; gallery events now use only `jrhofTrack`/`dataLayer`.

---

## 7. Conversion model

**Lifecycle framing (Ads "goal" mapping):**
- **Purchases goal:** `donation_complete`, `registration_complete` (+ GA4 `purchase` once ecommerce lands). The only bidding target from the moment they flow.
- **Leads/Contacts goal:** `sponsor_inquiry`, `form_submit`, `volunteer_interest` — Primary while purchase volume is thin (a Grants account needs *some* conversion signal for Max Conversions to function); demoted to Secondary per the ladder below.
- **Intent proxies:** `donate_click`, `golf/event_register_click` — **temporary Primary** only during Phase 2 (before `donation_complete` accumulates), then Secondary forever.
- **Never conversions:** `page_view`, `first_visit`, `user_engagement`, `scroll`, engagement/gallery events.

**The demotion ladder (encode in ops calendar):**
1. Phase 1 (today): demote `page_view`/`first_visit`/`user_engagement` imports to Secondary — or delete the conversion actions outright (they're recreatable); Primary = `form_submit` + interim clicks.
2. Phase 2 + 30 days of `donation_complete` data: demote `donate_click` to Secondary. Primary = `donation_complete`, `form_submit`, `sponsor_inquiry`.
3. Phase 5: demote registration clicks; Primary = completed outcomes only.

**Counting & value:** `donation_complete`/`registration_complete` count *Every*, others *One per click/session*. Value: none until Phase 4 (Payment-Link amounts aren't client-visible); then actual Stripe value with `transaction_id` dedupe. Never assign fabricated static values to leads for bidding — it manufactures fake ROAS for the board.

---

## 8. Attribution model

### 8.1 Model & windows
GA4 data-driven attribution, paid-and-organic scope, default windows. Google Ads consumes **GA4-imported conversions only** — never a parallel AW-pixel for the same action (dedupe by architecture, not by settings). Direct AW tags enter only at Phase 6 (enhanced conversions), and then the GA4 import for that same action is demoted the same day.

### 8.2 Campaign tagging governance
- Auto-tagging (GCLID) stays on in Ads; **never** manually UTM-tag Ads final URLs.
- Manual UTMs only on owned/off-site channels: `utm_source` ∈ {`newsletter`, `facebook`, `chsbua`, `qr`, `print`}, `utm_medium` ∈ {`email`, `social`, `referral`, `offline`}, `utm_campaign` = `<initiative>-<year>` (e.g., `golf-2027`). Lowercase, hyphenated, logged in the ops playbook appendix.
- The existing `withDonationUtm()` decoration of *Stripe-hosted* URLs (`src/config/site.ts:42`) does **not** reach Stripe records or GA4 (the pageview happens on stripe.com) — replace per §8.3.

### 8.3 Bridging attribution to money (pre-D1)
Stripe Payment Links accept `?client_reference_id=`. Phase 3 PR: click handler appends `client_reference_id=<GA client_id>` (read from the `_ga` cookie) to all `*.stripe.com` links. Result: every Checkout Session in Stripe carries the GA4 client id → channel-to-revenue joins become possible in exports, and Phase 4/5 D1 rows inherit the same key. Additionally (owner action, 5 min): change the two donate Payment Links' redirect to `https://jrhof.org/donate/thank-you/?cs={CHECKOUT_SESSION_ID}` — gives the thank-you page a dedupe/gate token (§5.2 #15) — and add the same redirect pattern to raffle/mulligans links so their completions become trackable.

### 8.4 Post-native (Phase 4/5) capture
At Checkout Session creation, the Worker stores `client_id`, `session_id`, `gclid?`, `utm_*?`, `landing_page`, `referrer` in session metadata → webhook writes them to D1 alongside the payment. D1 becomes the attribution-complete financial ledger; GA4 remains the behavioral layer. CSV/Sheets exports include the channel columns so board revenue-by-channel comes from the ledger, not from GA4.

---

## 9. Google Ads / Ad Grants architecture

### 9.1 Account strategy
- One active account (850-823-3621) under Ad Grants. Confirm enrollment status in Google for Nonprofits (UNVERIFIED); confirm `AW-17438185594` ownership (§0).
- Cancelled 567-662-7574: leave cancelled; never resurrect (its history is irrelevant).
- A *paid* account is a Phase 6+ question, only if remarketing/YouTube for event promotion ever justifies real budget. Grants prohibits remarketing; that's the only capability gap that would motivate paid.

### 9.2 Why rebuild rather than optimize
Current structure — `Evergreen - Awareness` (144 impr/mo) and `Donations – JRHOF` (Eligible, **0 impressions**, $208.97/day allocated) — has misconfigured conversion goals (all 7), a name signaling a vanity objective, one campaign consuming budget cap while delivering nothing, and 4 weeks of bidding history trained on `page_view`. There is nothing worth preserving except account-level assets. Rebuild is cheaper than repair; historical reporting stays intact in the account regardless (pause, don't delete — recommendation only, owner executes).

### 9.3 Target campaign structure (all Search, all Grants-compliant)

| Campaign | Ad groups (≥2 each, ≥2 RSAs each) | Seed themes (validate in Keyword Planner + search terms) | Geo | Landing page | Bidding |
|---|---|---|---|---|---|
| `Grants | Brand & Archive` | Brand; Inductees; Umpiring history | "joe rossi hall of fame", "colorado umpires hall of fame", inductee-name phrases, "colorado high school baseball umpire history" | US (brand is relevant nationwide — alumni/family) | `/`, `/inductees/`, profile pages | Max Conversions once real key events flow; Maximize Clicks + $2 cap only as bootstrap |
| `Grants | Donations` | Donate — umpire legacy; Donate — CO youth baseball | "donate colorado baseball nonprofit", "support high school umpires", "colorado sports charity donation" | Colorado | `/donate/` | Max Conversions (target: `donation_complete`) |
| `Grants | Golf Tournament` *(seasonal: ~Jan–Jun)* | Register; Sponsor a hole | "charity golf tournament denver <year>", "colorado golf fundraiser", "golf tournament sponsorship denver" | Denver metro + Front Range | `/events/golf/<year>…/` | Max Conversions (interim: register clicks; Phase 5: `registration_complete`) |
| `Grants | Banquet & Community` *(seasonal)* | Banquet; Volunteer/community | "sports banquet colorado", "umpire association colorado", "become a baseball umpire colorado" (community-relevant per mission statement) | Colorado | `/events/induction-banquet/`, future `/volunteer/` | Max Conversions |

Shared scaffolding: one shared negative list (`jobs`, `salary`, `equipment`, `mlb tickets`, `video game`, name-collision negatives discovered via search terms); sitelinks ≥4 (Donate, Inductees, Golf, Contact); callouts (501(c)(3), EIN 33-1883765, "Since 1988" if accurate); structured snippets; logo + business name assets. Budget: reallocate the $308.97/day cap roughly 40% Brand & Archive / 30% Donations / 30% seasonal — actual delivery will be far below cap; the split just prevents one campaign starving others at auction time.

### 9.4 Grants compliance guardrails (standing)
No single-word or overly-generic keywords; pause QS ≤ 2 keywords monthly; maintain account CTR ≥ 5% (two consecutive months below = suspension risk — current 8.33% is fine on tiny volume); keep ≥1 meaningful conversion/month reported once Smart Bidding is on; mission-relevant geo; respond to program surveys. Full monthly checklist lives in the ops playbook.

### 9.5 AdSense conflict
`public/ads.txt` declares `pub-7839480824613721`. Serving AdSense on the destination site of a Grants account is a policy/optics risk and off-mission. Target state: **no AdSense**; delete `ads.txt` after the owner confirms no active AdSense dependency.

---

## 10. Search Console & SEO architecture

### 10.1 Console configuration (mostly done — keep)
Domain property = primary console; URL-prefix property exists to serve the GA4 link (both stay). Sitemap submitted & read (Success, 168 URLs). Actions that remain: fix the 17 legacy 404s (export → `public/_redirects`); investigate the 1 "Redirect error"; review the "2 unused verification tokens"; verify Manual actions/Security = clean (UNVERIFIED — 1-minute check); after content upgrades, request indexing for flagship inductee pages.

### 10.2 SEO strategy — the archive is the moat
150 inductee pages are the only durable, un-replicable search asset JRHOF owns. Google currently declines to index ~140 of them (thin templated content). Strategy, in priority order:
1. **Inductee enrichment program** (editorial, ongoing): expand profiles to 200–400 unique words (career span, associations, championships, anecdotes, photo with descriptive alt). Batch by notability; measure indexation per batch in GSC. This one program addresses indexation, community engagement, and Ads landing quality simultaneously.
2. **Schema depth:** add `Person` JSON-LD on inductee pages (`memberOf` → the NonprofitOrganization node; `award`: HOF induction + year), `Event` schema with `offers` on golf/banquet pages, `DonateAction`/`potentialAction` on the org node. The `@graph` foundation in `BaseLayout.astro:68` makes these additive components.
3. **Hub pages:** "Induction classes by year" index (e.g., `/inductees/class-of-1995/`) — adds mid-tail query surface and crawl paths; cheap to generate from `inductees.json`.
4. **Evergreen event URLs:** keep `/events/golf/<year>-…/` archives (already good); ensure the *current* year page is the internally-linked, ad-landed canonical.
5. **Media SEO (later):** descriptive filenames/alt for R2 gallery derivatives; optional image sitemap.
6. Robots: live robots.txt is Cloudflare-managed-content + repo file merged (two `User-agent: *` groups — harmless to Google but confusing to humans). Decide one owner; document the AI-crawler blocking stance (it currently contradicts the welcome-mat intent of `public/llms.txt` — an explicit board decision, either way is defensible).
7. Thank-you/return pages: `noindex` + sitemap-excluded (Phase 3 PR) — they're conversion instruments, not content.

Do **not** chase: FAQ schema (rich results restricted), blog cadence beyond volunteer capacity, link-building campaigns. Bing Webmaster Tools import is a free 10-minute P3.

### 10.3 Google Business Profile strategy
**Verified: no listing exists.** GBP eligibility requires in-person customer contact at a real location or service area. JRHOF is a program of JR and Associates with no staffed premises — a standard GBP would violate guidelines and risks suspension. Target state:
- **If** a physical, publicly-visitable display exists (trophy case at a venue, permanent exhibit): create a GBP for *that* location, category "Non-profit organization" / "Museum", website jrhof.org, donation link, event posts. Owner decision gate.
- **Otherwise (default): no GBP.** Invest the same effort in entity SEO — the schema.org graph (already strong), consistent NAP-less citations (CHSBUA link exists), and a Wikipedia-independent knowledge footprint. Brand queries already navigate to jrhof.org organically (40 clicks/90d).

---

## 11. Audience architecture (GA4)

Build in GA4 for analysis + future activation; note Grants **cannot** target remarketing lists — audiences serve reporting, comparisons, and any future paid account.

| Audience | Definition | Use |
|---|---|---|
| Donors | `donation_complete` ≥ 1 (390-day) | Board KPI, exclusion analysis |
| Recent donors | `donation_complete` in last 90d | Post-campaign reporting |
| Registrants <year> | `registration_complete` / interim `golf_register_click` with `event_year=<year>` | Event ROI reporting |
| Engaged prospects | ≥2 sessions AND viewed `/donate/` or `/sponsor/` AND no `donation_complete` | The cultivation pool; Phase 5 email seed |
| Archive researchers | ≥3 `page_view` on `/inductees/*` in a session | Content-value evidence for the board |
| Sponsor pipeline | `sponsor_inquiry` ≥1 | Sponsor funnel reporting |

Predictive audiences: ignore (volume will never qualify).

---

## 12. Dashboards & board KPIs

**Stack:** Looker Studio (free) reading GA4 (native connector now; BigQuery once linked) + Google Ads connector + a Stripe/D1 CSV (manual monthly now; automated Sheet at Phase 5). One page, monthly cadence, PDF auto-email to the board.

**Board one-pager (definitions are contractual — see playbook glossary):**
| KPI | Source of truth |
|---|---|
| Donations: count, gross $, avg gift, one-time vs monthly | **Stripe** (GA4 shown as "tracked share" only) |
| Registrations: golf players, banquet seats, revenue | Eventbrite/Stripe → D1 (Phase 5) |
| Sponsor pipeline: inquiries → conversations → closed $ | `sponsor_inquiry` + manual CRM column |
| Web reach: sessions, users, channel mix | GA4 |
| Organic: clicks, impressions, top queries | GSC |
| Ads (Grants): credit used, clicks, CTR, key-event conversions | Google Ads |
| Archive engagement: inductee pageviews, top profiles, gallery opens | GA4 |

**Reconciliation policy (stated on the dashboard):** GA4 will undercount Stripe by an expected 5–20% (blockers/ITP — the 503-blocked beacons observed in this very audit are the mechanism). Variance >25% for two consecutive months = tracking incident (playbook runbook R4). Never "fix" GA4 to match Stripe by double-tagging.

---

## 13. Post-Stripe-native measurement (target end-state, Phases 4–5)

1. **Checkout creation (Worker):** create Checkout Session server-side; attach `metadata`: `client_id` (from `_ga`), `session_id`, `gclid?`, `utm_*?`, `event_slug?`; set `success_url` = `/…/thank-you/?cs={CHECKOUT_SESSION_ID}`.
2. **Client conversion (primary signal):** thank-you page reads `cs=`, fires `purchase`/`donation_complete`/`registration_complete` with `transaction_id=cs`, real `value`/`currency` (retrieved via a tiny Worker endpoint or embedded at redirect). GA4 dedupes on transaction_id across refreshes.
3. **Webhook (financial truth):** `checkout.session.completed` → Worker verifies signature → writes D1 row (amount, product, attribution metadata, timestamps) → optional Measurement Protocol *backfill* event flagged `source=server` **only** for sessions whose client event never arrived (reconciliation-driven, not default — avoids double counting and keeps attribution clean).
4. **Ads:** GA4 `purchase` import becomes the sole Primary with value; interim proxies demoted (ladder §7). Enhanced conversions (hashed email from Stripe) — Phase 6, after a privacy sign-off.
5. **Eventbrite eliminated:** registration events stop being outbound clicks; `event_register_click` retires to Secondary diagnostics; CSV exports and board numbers come from D1.

---

## 14. Explicit anti-recommendations (decided, with reasons)

| Rejected | Why |
|---|---|
| Server-side GTM | Cost/complexity indefensible at this scale; volunteer-operability principle. |
| New GA4 property or "clean-slate" measurement ID | Destroys history for zero structural gain; every defect is fixable in-place. |
| Catch-all regex GTM pass-through tag | Forwards typos/noise forever; explicit tags are the documentation. |
| Static lead values for bidding | Manufactures fake ROAS; board reporting integrity outranks bidder convenience. |
| Consent-mode banner (today) | US-only audience, no EU targeting; revisit on any jurisdictional change. |
| AdSense on jrhof.org | Off-mission, Grants-risk; remove `ads.txt`. |
| GBP without a real location | Guideline violation risk; entity SEO instead (§10.3). |
| Optimizing Eventbrite handoffs | Temporary by decree; measurement effort goes to the thank-you-page signal and native checkout. |
