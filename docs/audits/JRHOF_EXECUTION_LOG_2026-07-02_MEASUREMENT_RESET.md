# JRHOF Measurement Reset — Execution & Validation Log

**Date:** 2026-07-02 · **Executed by:** Claude (Director of Digital Marketing Architecture session), authenticated as tj@jrhof.org
**Scope executed:** Roadmap Phase 1 (measurement/bidding signal reset) + Phase 2 (GTM v8 rebuild, GA4 registrations). Phases 3–5 designed, not implemented (approval-gated).
**Companions:** `JRHOF_MARKETING_ARCHITECTURE.md` (target state), `JRHOF_DIGITAL_MARKETING_ROADMAP.md` (plan), `JRHOF_SEO_GA4_ADS_AUDIT_2026-07-02.md` (baseline).
**Note:** This file is intentionally left uncommitted — review and commit alongside a `docs/CHANGELOG.md` entry (playbook §3).

---

## 1. Change log (everything actually changed today)

### GA4 (property 511268663 / stream G-VYQQ5E7ZHM)
| # | Change | Before | After | Rollback |
|---|---|---|---|---|
| 1 | Key events: `first_visit`, `page_view`, `user_engagement` un-starred | 6 key events incl. the 3 session-noise events | Key events = `donation_complete`, `form_submit`, `conversion_event_purchase` only | Re-star in Admin → Events (instant) |
| 2 | Event data retention | 2 months (default) | **14 months** (+ reset-on-activity stays ON) | Dropdown revert (forward-looking only) |
| 3 | Unwanted referrals list (was empty) | — | `stripe.com`, `buy.stripe.com`, `donate.stripe.com`, `checkout.stripe.com`, `eventbrite.com` (referral domain contains) | Remove rows |
| 4 | Internal traffic rule created | none | "Webmaster - TJ (added 2026-07-02)", `traffic_type=internal`, IP `216.160.167.165/32`. **Caveat: this IP is dynamic** — rule silently stops matching when the ISP rotates it (fail-safe: traffic re-enters reports, nothing excluded). See R9. | Delete rule |
| 5 | Internal Traffic data filter | already existed | **Left in Testing** — keep it there while the internal IP is dynamic (Active mode would intermittently not-exclude); `tt=internal` works as a reporting dimension meanwhile (validated §2.6) | n/a |
| 6 | Annotation created | — | "2026-07-02 Measurement reset (audit)" — key-event surgery + GTM v7→v8 discontinuity note, dated 07/02/2026 | Delete annotation |
| 7 | **Deleted rogue "Create event" rule** `donation_complete` (conditions: `event_name = page_view` AND `page_location contains /donate/thank-you`) | Rule silently minting `donation_complete` from ANY thank-you pageview (no cs gate, no dedupe) — source of the property's phantom donation_complete data and a guaranteed double-count against the GTM tag | No custom-event rules; no event modifications | Recreate via Events → Create event (2 min; conditions above) — **do not** recreate unless GTM path fails |
| 8 | Custom dimensions registered (event scope, ×8) | Only 2 legacy WordPress Site Kit dims | + `donation_type`, `event_slug`, `event_year`, `cta_location`, `link_context`, `sponsor_tier`, `gallery_name`, `file_name` (param = same name) | Archive dimensions |

### Google Ads (850-823-3621, Ad Grants)
| # | Change | Before | After | Rollback |
|---|---|---|---|---|
| 9 | `jrhof.org (web) page_view` conversion action | Primary (14 conv/28d — the 266% pollution) | **Secondary** | Detail → Settings → Action optimization → Primary |
| 10 | `jrhof.org (web) first_visit` | Primary (9 conv) | **Secondary** | same |
| 11 | `jrhof.org (web) user_engagement` | Primary (9 conv) | **Secondary** | same |
| 12 | `PURCHASE` (GA4 event `conversion_event_purchase`, duplicate of `purchase`) | Primary (0 conv) | **Secondary** (removal needs owner approval — see §6) | same |
| — | Kept **Primary**: `purchase`, `donation_complete`, `form_submit` (the real-outcome set; first two dormant until data flows) | | | |
| — | **Not changed:** campaigns, bidding (both still Maximize Conversions — see recommendation R1 in §6), budgets, keywords | | | |

### GTM (GTM-WGDF4SBN)
| # | Change | Detail | Rollback |
|---|---|---|---|
| 13 | **Published Version 8 — "v8 - taxonomy restore (2026-07-02)"** (07/02/2026 1:45 PM). 19 tags / 18 triggers / 29 variables. Built in workspace `v8-taxonomy-restore` via container-JSON import + 2 manual operator fixes | **Added:** 16 `GA4 \| Event \| <name>` tags (donate_click, donate_once_click, donate_monthly_click, banquet_support_click, event_register_click, golf_register_click, banquet_info_click, contact_click, email_click, phone_click, external_partner_click, inductee_profile_click, gallery_open, gallery_close, donation_complete, sponsor_inquiry) on `CE \|` custom-event triggers (each gated `Page Hostname equals jrhof.org`), 16 `DLV \|` dataLayer variables, `Guard \| Non-prod hostname` (Initialization, `Page Hostname does not equal jrhof.org`) added as **blocking exception on both Google tags**, `PV \| donate thank-you (Stripe referrer, no cs)` interim pageview trigger (Path contains /donate/thank-you/ AND Referrer contains stripe.com AND Page URL **does not contain** cs= AND host = jrhof.org) as second trigger on the donation_complete tag. **Removed:** legacy link-click tag "Donate Click (Stripe)" + "Donate Trigger" (double-count prevention, per spec §5.2 #16). **Kept:** GA4 config, AW Google tag, Conversion Linker, 2 orphan legacy variables (CTA Type, JS – Stripe Link Type — unreferenced, left for history) | GTM → Versions → **v7 → Publish** (60-second total restore) |

Notes on #13: `donation_complete` uses the **CE trigger** as primary (the thank-you page code pushes it only when `cs=` present, with per-transaction sessionStorage dedupe — PR-1, merged). The PV trigger covers the interim where Stripe Payment Links still redirect without `{CHECKOUT_SESSION_ID}` (owner action O2 below). The two-trigger design cannot double-fire: PV requires *absence* of `cs=`, CE requires its presence.
`sponsor_inquiry` tag is live-but-dormant until PR-5 ships the code emit. `inductee_profile_click` is a production event **not yet in the taxonomy table** — needs a docs PR (see §6).

---

## 2. Validation log (live production, published v8, clean tab, network-layer evidence)

Environment note: this workstation's DNS-level blocker returns 503 for analytics beacons — **attempts prove emission** (ops playbook R4 standard); payloads inspected pre-block. GA4 Realtime/DebugView could not receive today's test hits from this machine for that reason; real (unblocked) visitors flow normally.

1. **Exactly one `page_view` per page** ✓ — single `g/collect …en=page_view` per navigation on `/`, `/donate/`, golf 2025 page, thank-you (plus the AW `ccm/collect` ads ping — different product, expected; CSP clean after PR #26).
2. **`donate_click` fires once with params** ✓ — `en=donate_click&ep.link_text=Donate&ep.destination_url=/donate/` on nav Donate click; exactly one hit; page_view of destination followed separately.
3. **`gallery_open` fires** ✓ — `en=gallery_open&ep.gallery_name=…&ep.event_slug=2025-umpires-cup-iii&epn.event_year=2025&epn.photo_index=1&epn.photo_count=244&ep.viewport_orientation=landscape` (the audit's zero-beacon reproduction case, now firing).
4. **`donation_complete` gate** ✓ — `?cs=test_validation_003`: exactly one `en=donation_complete&ep.transaction_id=test_validation_003`. Reload: page_view + scroll only, **no** donation_complete (sessionStorage dedupe). Earlier double-fire root-caused to the rogue GA4 rule (§1.7); after deletion propagated, single-fire confirmed.
5. **`sponsor_inquiry`** — tag/trigger present in v8; cannot fire until PR-5 emits the event (by design). `contact_click` validated by identical mechanism (same delegated listener, same tag/trigger pattern as donate_click); not individually exercised.
6. **Internal traffic tagging** ✓ — all test hits carry `tt=internal` (rule works from IP 216.160.167.165; filter safely in Testing).
7. **Non-prod hostname guard** — conditions verified in container (does-not-equal fixed from import artifact; see §3); **live negative test on a workers.dev preview URL still pending** (no preview deployment was at hand). Risk is low: CE triggers independently require host = jrhof.org.
8. **Container quality banner** — was "Urgent (3 issues)"; expected to clear within ~48h of v8 firing (re-check).
9. **GA4 key events / Ads goals** — GA4 key-events list = the 3 real outcomes only (UI-verified). Ads Goals table shows page_view/first_visit/user_engagement/PURCHASE as Secondary, "Included in account-level goals: No" (UI-verified). Conversions column impact visible within 24h.

**Known issue found & fixed during validation:** container-import JSON silently drops top-level `negate` on filter conditions → the guard imported as "equals" (blocking Google tags in prod) and the PV trigger's cs-exclusion imported inverted. Both caught in Tag Assistant preview / trigger review and fixed in the UI before publish. Lesson recorded for future imports: express negation via the UI or verify operators post-import.

---

## 3. Rollback plan (fastest-first)

| Layer | Action | Time |
|---|---|---|
| GTM (any v8 misbehavior) | Versions → v7 → Publish. Restores the exact pre-reset container (note: v7 = broken event pipeline; only roll back for emergencies like double page_views — none observed) | 1 min |
| Ads conversions | Each demoted action → Settings → Action optimization → Primary | 2 min each |
| GA4 key events | Re-star events in Admin → Events | 1 min |
| GA4 retention / referrals / internal traffic / annotation | Revert dropdown / delete rows / delete rule / delete annotation | ≤2 min each |
| GA4 rogue create-event rule | Recreate (conditions in §1.7) — **not recommended**; it double-counts | 2 min |
| Custom dimensions | Archive (names stay reserved ~48h) | — |

---

## 4. Owner approvals needed before further changes

| ID | Decision | Recommendation |
|---|---|---|
| A1 | **Ad Grants campaign rebuild** (§5 plan): pause `Evergreen - Awareness` + `Donations – JRHOF`, launch 4 new campaigns | Approve after 7–14 days of clean conversion data |
| A2 | Interim bidding switch on existing campaigns: Maximize Conversions → **Maximize Clicks** until real conversions accumulate (roadmap P1.5) — deliberately NOT changed today (bidding was out of today's scope) | Approve now; `Donations – JRHOF` has burned a month at 0 impressions on conversion-starved smart bidding |
| A3 | **Remove** (not just demote) conversion actions `PURCHASE` (duplicate) and, once donation_complete accrues 30d, the page-view-class Secondaries | Approve at 30-day review |
| A4 | Stripe Payment Links: change donate one-time + monthly redirect to `/donate/thank-you/?cs={CHECKOUT_SESSION_ID}`; add same to raffle/mulligans; identify/deactivate orphan link `buy.stripe.com/eVq8wO…y05`; add metadata to all links (owner, Stripe Dashboard, ~10 min — P2.2) | Do this week; until then donation_complete relies on the interim Stripe-referrer trigger (no transaction_id) |
| A5 | `public/ads.txt` (AdSense pub-7839480824613721) deletion | Confirm AdSense unused → PR |
| A6 | Google for Nonprofits: confirm Ad Grants enrollment status; confirm `AW-17438185594` is the tag of account 850-823-3621 (Data manager shows a "JR AND ASSOCIATES INC" Google tag; exact-ID drill-down pending) | 10-min owner check |
| A7 | Taxonomy v1.1 doc update: add `inductee_profile_click` (+params `inductee_name`), `viewport_orientation`, `event_name` to architecture §6; decide whether to register `inductee_name` as a 9th dimension (recommended — archive-engagement KPI) | Docs PR |
| A8 | Archive the 2 legacy "WordPress Site Kit" custom dimensions; review GSC "2 unused verification tokens"; cancelled Ads account 567-662-7574 stays dead | Housekeeping batch |
| A9 | BigQuery daily export link + publishing the Search Console report collection (needs UI steps under owner login preferences) | This month |

---

## 5. Ad Grants campaign rebuild plan (design only — DO NOT IMPLEMENT without A1)

Rebuild rationale (per architecture §9.2): both campaigns trained a month on poisoned conversions; names encode vanity goals; `Donations – JRHOF` consumed the budget cap at 0 impressions. **Pause, never delete** — history stays queryable.

Shared scaffolding (build first):
- Shared negative list `Shared | Negatives | Core`: jobs, salary, hiring, equipment, gear, rules quiz, video game, MLB tickets, fantasy, betting, + name-collision negatives from search-terms review.
- Assets: ≥4 sitelinks (Donate, Inductees, Golf, Contact), callouts ("501(c)(3) nonprofit", "EIN 33-1883765", "Preserving umpire history"), structured snippets, logo/business name.
- All campaigns: Search only, auto-tagging on, no UTM on final URLs, conversion goals = account-level (Purchases/Contacts) — never page-view-class.

| Campaign | Goal | Landing page | Geo | Ad groups (≥2 RSAs each) | Keyword themes | Negatives (extra) | Conversion goals | Bidding | Compliance risk | Priority | Existing campaign disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `Grants \| Brand & Archive` | Awareness→engagement of the archive; donor discovery | `/`, `/inductees/`, inductee profiles | US | 1 Brand ("joe rossi hall of fame", "jrhof") · 2 Inductees (inductee-name phrases from `inductees.json` notables) · 3 Umpire history ("colorado high school baseball umpire history", "umpires hall of fame colorado") | brand, inductee names, CO umpire history | generic "hall of fame" alone (single-word ban) | donation_complete, form_submit (observe inductee_profile_click as Secondary) | Maximize Clicks $2 cap bootstrap → Max Conversions at ≥15 conv/30d | Low; watch QS on name terms | **P1 — launch first** | `Evergreen - Awareness` → **pause** at launch |
| `Grants \| Donations` | Completed donations | `/donate/` | Colorado | 1 Donate–umpire legacy ("support high school umpires", "donate umpire nonprofit") · 2 CO youth-baseball charity ("colorado baseball charity donation", "youth sports nonprofit donate colorado") | donation-intent + CO qualifiers | free, volunteer (own campaign), grants FOR nonprofits | donation_complete (Primary) | Max Conversions once donation_complete ≥1/week; else Maximize Clicks | Medium: donation keywords are competitive; keep mission-relevant to avoid QS floor | **P1** | `Donations – JRHOF` → **pause** at launch |
| `Grants \| Golf Tournament` *(seasonal ~Jan–Jun)* | Registrations (interim: golf_register_click; Phase 5: registration_complete) | current-year golf page | Denver metro + Front Range | 1 Register ("charity golf tournament denver 2027", "colorado golf fundraiser") · 2 Sponsor a hole ("golf tournament sponsorship denver") | charity golf, fundraiser golf, hole sponsor | pro tournaments, tee times, courses, lessons | golf_register_click interim-Primary → demote at Phase 5 | Maximize Clicks during ramp; Max Conversions when clicks-convert | Low | P2 — build ~Dec 2026, enable Jan 2027 | n/a (new) |
| `Grants \| Banquet & Community` *(seasonal ~Oct–Feb)* | Banquet seats + volunteer/community pipeline | `/events/induction-banquet/`, future `/volunteer/` | Colorado | 1 Banquet ("sports hall of fame banquet colorado") · 2 Become an umpire / community ("become a baseball umpire colorado", "umpire association colorado") | banquet, umpire recruitment/education | equipment, pay/salary | event_register_click / banquet_info_click interim; volunteer_interest when live; form_submit | Maximize Clicks → Max Conversions | Medium: recruitment terms must tie to mission statement (education/community support) — they do | P3 — build Oct 2026 | n/a (new) |

Budget split of $308.97/day cap: 40% Brand & Archive / 30% Donations / 30% active seasonal (delivery will be far below cap; split prevents starvation). Launch gate: **only after** donation_complete + form_submit are visibly accruing in Ads (validates the import path end-to-end). First-month watch: CTR ≥5% account-wide (weekly), search-terms → negatives, QS ≤2 keywords paused monthly.

---

## 6. Recommendations register (non-blocking)

R1 = A2 above (interim Maximize Clicks). R2: create the 6 architecture §11 audiences (Donors, Recent donors, Registrants-year, Engaged prospects, Archive researchers, Sponsor pipeline) — next GA4 session, 20 min. R3: after 7 days of v8 data, spot-check Events report for param population (dims registered today are not retroactive). R4: live-test the non-prod guard on the next workers.dev preview deploy. R5: monthly conversion-truth check per playbook QA 4.3 — first run 2026-08-01; include "verify internal IP still current" while R9 is pending. R6: docs PRs — taxonomy v1.1 (A7), CHANGELOG.md entry for today, PLATFORM stale-docs batch (PR-6). R7: GSC 404 export → PR-3 redirects (unchanged from roadmap). R8: Zaraz confirm-empty screenshot for the changelog (P2.5, owner or next session). **R9: replace IP-based internal tagging with cookie-based** — the webmaster IP is dynamic (owner-confirmed 2026-07-02). Pattern: GTM tag on `?internal=1` pageview sets a 1st-party cookie (~400-day expiry); Google-tag event settings send `traffic_type=internal` when the cookie variable is present; each board member/volunteer visits `jrhof.org/?internal=1` once per browser. IP-independent, covers phones/home networks. Bundle into the next GTM version (with the PR-5 sponsor_inquiry wiring) — don't publish a version for it alone. Until R9 ships, keep the data filter in Testing (see §1.5).

---

## 7. Phase 4 (SEO / landing pages) & Phase 5 (reporting) designs

Unchanged from the architecture doc — the designs there remain correct after today's work; execution keys:
- **Donation page:** add trust/impact block (what $50/$100 preserves), keep single clear Stripe CTA pair; after A4, thank-you page carries transaction id end-to-end.
- **Sponsor page:** PR-5 `sponsor_inquiry` event + tier table with named CTA per tier (`sponsor_tier` param now reportable).
- **Golf/banquet pages:** keep evergreen year-URL archive pattern; current-year page is the ad-landed canonical; add `Event` schema w/ offers (PR-7).
- **Inductee archive:** enrichment program batches (200–400 words, `Person` schema, descriptive alts) — measure indexation per batch in GSC (140 not-indexed baseline); class-of-year hub pages (PR-9).
- **Volunteer page (future):** required before `Grants | Banquet & Community` ad group 2 gets a dedicated LP; emits `volunteer_interest`.
- **Educational content:** "How to become a CO HS baseball umpire" + "History of CHSAA umpiring" cornerstone pages — feed Brand & Archive + Community campaigns.
- **Reporting (Phase 5):** board one-pager per playbook §7/§9 — Stripe = money truth, GA4 = behavior, GSC = organic, Ads = grants utilization; reconciliation line "GA4 tracked N% of Stripe donations (expect 75–95%)"; Looker Studio once BigQuery link (A9) lands. First board pack achievable for July close with donation_complete now live.

---

## 8. What was explicitly NOT done (and why)

- No campaign/bidding/keyword/budget changes (approval-gated — A1/A2).
- No deletions of campaigns, conversion actions, or historical data (demote-only; sole deletions: the double-counting GA4 create-event rule §1.7 and the double-counting legacy GTM donate tag §1.13, both explicitly covered by the double-count mandate; both trivially recreatable).
- No repository code changes; no Stripe Dashboard changes (inspection only, via docs); no GBP created; no audiences yet (R2); no BigQuery link (A9 — needs owner GCP context).
