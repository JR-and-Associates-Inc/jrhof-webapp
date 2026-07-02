# JRHOF Digital Marketing Roadmap

**Version:** 1.0 — 2026-07-02
**Blueprint:** `docs/architecture/JRHOF_MARKETING_ARCHITECTURE.md` (the "why" and target state)
**Operations:** `docs/playbooks/JRHOF_GA4_GTM_ADS_OPERATIONS.md` (the recurring "how")

Phases are additive and strictly ordered by dependency, not by calendar. Each task lists: current → ideal, why current is suboptimal, risk of change, benefit, steps, rollback, validation. Google-UI work and repo work are separated so Codex/Claude can execute repo tasks as small PRs while the account owner executes UI tasks.

**Dependency spine:**
`P1 (stop bad bidding signal)` → `P2 (restore event flow + real donation conversion)` → `P3 (repo hardening that makes P2 trustworthy)` → `P4 (native Stripe donations w/ value)` → `P5 (native registrations, Eventbrite退場, board ledger)` → `P6 (refinement)`.

---

## Phase 1 — Safe immediately (Google UI only, ~45 minutes total, zero deploy)

### P1.1 Demote non-outcome GA4 key events
- **Current (CONFIRMED):** `page_view`, `first_visit`, `user_engagement` marked key events (Admin → Events → Key events).
- **Ideal:** Unstarred. Key events = `form_submit`, `donation_complete`, `conversion_event_purchase` (dormant until P2 wiring; harmless).
- **Why suboptimal:** They flow into Ads as conversions (266.67% conv rate) and corrupt Maximize Conversions bidding; they also make GA4 "Key events" reporting meaningless.
- **Risk:** None to data collection (events keep collecting; only the flag changes). Ads loses its *fake* conversion volume — bidding may briefly throttle delivery, which is currently delivering almost nothing anyway.
- **Steps:** GA4 → Admin → Events → Key events → toggle star off on the three events.
- **Rollback:** Re-star (instant).
- **Validation:** Next day, Ads → Goals → Summary shows those actions no longer accruing; GA4 Reports → Engagement → Key events shows only real ones.

### P1.2 Demote/remove the polluted Ads conversion actions
- **Current (CONFIRMED):** 7 conversion actions, all GA4 imports, **all Primary, all "Misconfigured"**: page_view (14), first_visit (9), user_engagement (9), form_submit (0), purchase (0), PURCHASE (0), donation_complete (0).
- **Ideal:** `page_view`, `first_visit`, `user_engagement` → **removed** (preferred; recreatable) or Secondary. `form_submit` stays Primary. `donation_complete` + `purchase` stay Primary (dormant). Duplicate `PURCHASE` removed.
- **Why:** This is the direct corruption of the bid strategy and of every "Conversions" column the board might see.
- **Risk:** Low. Removing a conversion action does not delete GA4 data. Campaigns on Max Conversions will have ~zero conversion signal until P2 — acceptable; they can be left as-is or switched to Maximize Clicks for the interim (owner's call; recommendation: switch, see P1.5).
- **Steps:** Ads → Goals → Conversions → Summary → each action → "Change goal/action optimization" → Secondary, or Remove. Screenshot before/after.
- **Rollback:** Re-import from GA4 (Goals → New conversion action → Import → GA4).
- **Validation:** Goals Summary shows no Primary page-view-class actions; campaign "Conversions" column stops accruing them (allow 24h).

### P1.3 GA4 hygiene trio (retention / internal traffic / referral exclusions)
- **Current:** UNVERIFIED (not opened during audit) — assume defaults: 2-month retention, no internal-IP rule, no referral exclusions.
- **Ideal:** Retention 14 months; internal-traffic rule for board/TMCO IPs (Testing → Active after verification); unwanted referrals: `stripe.com`, `buy.stripe.com`, `donate.stripe.com`, `checkout.stripe.com`, `eventbrite.com`.
- **Why:** 2-month retention silently deletes explorable history; internal traffic is a real % at 150-user weeks; Stripe returnees otherwise re-attribute donations to "referral / stripe.com".
- **Risk:** None meaningful (retention is forward-looking; filters only affect new data; referral exclusion only affects channel labeling).
- **Steps:** Admin → Data settings → Data retention → 14 months + reset-on-activity ON. Admin → Data streams → JRHOF Website → Configure tag settings → Define internal traffic + List unwanted referrals. Admin → Data filters → set internal filter Testing; after seeing `traffic_type=internal` on own visits, switch Active.
- **Rollback:** Each is a dropdown revert.
- **Validation:** Realtime with own IP shows filtered-out once Active; a test Stripe round-trip attributes to original channel, not referral.

### P1.4 Search Console housekeeping
- **Current (CONFIRMED):** 17 "Not found (404)"; 1 "Redirect error"; 2 unused verification tokens; Manual actions/Security **UNVERIFIED**.
- **Ideal:** 404 list exported (feeds PR-3); redirect error diagnosed; Security & Manual Actions confirmed "No issues"; tokens reviewed.
- **Steps:** GSC → Pages → export both error tables; → Security & Manual Actions (screenshot); Settings → verification tokens review (remove only ones nobody recognizes, after asking).
- **Risk/Rollback:** None / n-a (read + housekeeping).
- **Validation:** PR-3 acceptance covers the 404s; GSC validation flows started after deploy.

### P1.5 Interim bidding sanity + annotate everything
- **Current:** Both campaigns Maximize Conversions on poisoned signal; `Donations – JRHOF` Eligible, **0 impressions**, $208.97/day.
- **Ideal (interim, until P2 conversions flow):** Both campaigns → Maximize Clicks (Grants $2 CPC cap applies — fine); `Donations – JRHOF` delivery diagnosed (likely: ultra-narrow keywords + conversion-starved smart bidding; check Ads → Campaign → Insights & "Why isn't my ad showing" on its keywords).
- **Why:** Max Conversions with zero valid conversions = the system guesses; Maximize Clicks at least buys real Grants traffic while P2 lands.
- **Risk:** Low; reversible per campaign. CTR discipline still applies.
- **Rollback:** Switch back to Max Conversions (do this deliberately at P2+30d with real key events).
- **Validation:** `Donations – JRHOF` impressions > 0 within a week; account CTR stays ≥5%.
- **Also:** Add GA4 annotation (Admin → Annotations): "2026-07-02 audit: key-event surgery; GTM v7 was dropping custom events since cutover" — future analysts must see the discontinuity. (GA4 annotations feature — if absent in UI, log in the ops changelog instead.)

**Phase 1 exit criteria:** Ads Goals Summary contains zero page-view-class Primary actions; GA4 key events = real outcomes only; retention 14mo; annotations written.

---

## Phase 2 — Google configuration builds (GTM v8 + GA4 registrations + Ads rebuild; ~1 focused day)

### P2.1 GTM v8 — restore the event pipeline (THE critical build)
- **Current (CONFIRMED, empirical):** Live v7 = 4 tags; all custom dataLayer events dropped (gallery-click test produced zero GA4 beacon attempts).
- **Ideal:** Build spec §5.2 of the architecture doc: 11 `GA4 | Event | *` tags on `CE |` custom-event triggers with `DLV |` param variables; non-prod hostname guard exception on both Google tags; **`donation_complete` tag on thank-you pageview gated by `cs=` param or stripe.com referrer**; legacy "Donate Click (Stripe)" link-click tag deleted (prevents double `donate_click`).
- **Why:** Without it, every architecture decision downstream is theater — no events, no conversions, no reporting.
- **Risk:** Medium (a bad publish could double-fire page_view). Mitigated by Preview + the validation script below.
- **Steps:** Build in a workspace named `v8-taxonomy-restore` → GTM Preview against jrhof.org: verify (a) exactly one page_view per navigation, (b) each taxonomy event fires its tag with params, (c) no tags fire on a workers.dev preview URL → Publish with version notes + screenshots.
- **Rollback:** GTM Versions → v7 → Publish (60 seconds, total restore of prior state).
- **Validation:** DebugView shows `donate_click` w/ params, `gallery_open`, `contact_click`; network shows `g/collect?en=<event>` attempts on a clean browser; next-day GA4 Realtime/Events lists the custom events again; GTM container-quality banner clears.

### P2.2 Stripe Payment Link completion upgrades (owner, 10 min, Stripe Dashboard)
- **Current (CONFIRMED):** Donate one-time + monthly links redirect to bare `/donate/thank-you/`; raffle (`…y02`) + mulligans (`…y03`) use hosted confirmation (untrackable); one active unreferenced link (`buy.stripe.com/eVq8wO…y05`).
- **Ideal:** All active links redirect to a jrhof.org thank-you URL carrying `?cs={CHECKOUT_SESSION_ID}` (donate links → `/donate/thank-you/?cs={CHECKOUT_SESSION_ID}`; raffle/mulligans → same or a golf-specific thank-you later). Unreferenced link identified (likely banquet support for `PUBLIC_STRIPE_BANQUET_SUPPORT_URL`) or deactivated.
- **Why:** `{CHECKOUT_SESSION_ID}` turns the thank-you page into a gated, dedupable conversion instrument; hosted-confirmation links are conversion black holes.
- **Risk:** None to payments (redirect happens post-payment). Donors see the site again instead of Stripe's receipt page — ensure thank-you copy mentions the email receipt.
- **Rollback:** Revert redirect setting per link.
- **Validation:** $1 live test donation → lands on `/donate/thank-you/?cs=cs_live_…` → DebugView shows `donation_complete` once; refresh does not double-fire (P3 PR adds the dedupe polish; interim GTM trigger fires per-page-load — acceptable at current volume, noted in changelog).

### P2.3 GA4 registrations: custom dimensions, key events, audiences, links
- **Current:** No custom dimensions registered (params invisible in reports); audiences default-only; BigQuery unlinked.
- **Ideal:** Register the 8 event-scoped dims (§4); mark `donation_complete` key event; create the 6 audiences (§11); link BigQuery daily export; publish the Search Console report collection.
- **Risk:** None; all additive. Dimension registration is not retroactive — do it the same day as P2.1 so params are reportable from day one.
- **Validation:** Events report shows `cta_location` etc. as secondary dimensions within 24–48h; BigQuery dataset receives `events_intraday_*`.

### P2.4 Google Ads rebuild on the §9.3 structure
- **Current:** Two campaigns (one delivering nothing), no evidence of deliberate keyword/negative/asset architecture (ad-group level UNVERIFIED beyond names).
- **Ideal:** Four-campaign structure (`Brand & Archive`, `Donations`, seasonal `Golf`, `Banquet & Community`), shared negative list, ≥2 ad groups × ≥2 RSAs each, ≥4 sitelinks, callouts incl. EIN, geo per table; existing campaigns **paused** (not deleted — history preserved).
- **Why:** Rebuild beats repair: names, goals, and learning history are all trained on noise; `Donations – JRHOF` has burned a month at 0 impressions.
- **Risk:** Medium-low: new campaigns re-enter learning; Grants CTR floor must be watched during ramp (weekly for the first month).
- **Rollback:** Un-pause old campaigns (they were at least CTR-compliant).
- **Validation:** All campaigns serving within 7 days (impressions > 0); search-terms report mission-relevant; CTR ≥5% after two weeks; conversions = real key events only. At P2+30 days: flip to Max Conversions per the demotion ladder (§7 architecture).

### P2.5 Verify the two loose ends
`AW-17438185594` ownership (Ads → Tools → Data manager → Google tag: confirm it lists 850-823-3621) and Cloudflare Zaraz state (dash → jrhof.org zone → Zaraz: confirm **no** GA4/Google tool configured; screenshot for the changelog — this closes the "how did June events arrive" question and guarantees no duplicate loader returns).

**Phase 2 exit criteria:** DebugView shows the full taxonomy with params from production; `donation_complete` fired by a real test donation; Ads conversions column = real events only; rebuilt campaigns serving; Zaraz confirmed inert.

---

## Phase 3 — Repository changes (small PRs, each independently shippable)

> Branch prefix convention: `mkt/…`. All are safe to deploy immediately after review unless noted. Acceptance criteria are the PR checklist.

### PR-1 `mkt/thank-you-conversion-hardening`
- **Goal:** Make `/donate/thank-you/` (and `/donate/return/`) proper conversion instruments.
- **Files:** `src/pages/donate/thank-you/index.astro`, `src/pages/donate/return/index.astro`, `astro.config.mjs` (sitemap filter).
- **Changes:** pass `noindex` prop (BaseLayout already supports it, `BaseLayout.astro:128`); extend sitemap `filter` to exclude both paths; on thank-you, read `cs` query param and `jrhofTrack('donation_complete', { transaction_id: cs })` **once** with a sessionStorage guard (dedupes refreshes; GTM tag then keys off the dataLayer event instead of raw pageview — tighten the GTM trigger in the same week).
- **Acceptance:** `curl -s https://jrhof.org/donate/thank-you/ | grep robots` shows noindex; URL absent from `dist/sitemap-0.xml`; with `?cs=test` the event pushes exactly once per session (manual test + DebugView).
- **Safe to deploy:** Yes.

### PR-2 `mkt/stripe-client-reference-id`
- **Goal:** Attribution bridge — every Stripe checkout carries the GA4 client id.
- **Files:** `src/components/BaseLayout.astro` (delegated click handler).
- **Changes:** in the existing click listener, when `href` matches `(buy|donate|checkout)\.stripe\.com`, append `client_reference_id=<client_id from _ga cookie>` (format `GAx.y.<client_id>` → take the last two dot-segments). Graceful no-op if cookie absent.
- **Acceptance:** clicking "Give once" opens Stripe URL containing `client_reference_id=`; a test payment's Checkout Session shows it (Stripe Dashboard → payment → session details); no console errors when `_ga` missing (test in private window).
- **Safe to deploy:** Yes.

### PR-3 `mkt/legacy-404-redirects`
- **Goal:** Close the 17 GSC 404s + the 1 redirect error.
- **Files:** `public/_redirects`.
- **Input:** P1.4 export. **Acceptance:** every exported URL `curl -sI` → single 301 hop to a 200 page; no loops; GSC validation started.
- **Safe to deploy:** Yes.

### PR-4 `mkt/csp-google-ads-endpoints`
- **Goal:** Unblock direct Ads pixels (remarketing ping today, enhanced conversions at P6).
- **Files:** `public/_headers:7`.
- **Changes:** add to `connect-src` and `img-src`: `https://www.google.com https://googleads.g.doubleclick.net https://td.doubleclick.net https://www.googleadservices.com`.
- **Acceptance:** clean-browser (no blocker) console shows zero CSP "Refused" for `ccm/collect`/doubleclick on `/` and `/donate/`; Tag Assistant shows AW tag OK; existing GA4/Clarity unaffected.
- **Safe to deploy:** Yes (additive), verify in preview first.

### PR-5 `mkt/sponsor-inquiry-event`
- **Goal:** Dedicated sponsor conversion (split from `contact_click`).
- **Files:** `src/pages/sponsor/index.astro` (+ taxonomy table in architecture doc §6 already reserves it).
- **Changes:** primary sponsor CTA gets `trackingAttrs('sponsor_inquiry', { cta_location: 'sponsor_page', sponsor_tier: <if tiered> })`. GTM tag + GA4 key-event flag follow (Google-UI side).
- **Acceptance:** click pushes `sponsor_inquiry` to dataLayer (DebugView after GTM tag).
- **Safe to deploy:** Yes.

### PR-6 `mkt/docs-truth-reconciliation`
- **Goal:** Kill the Zaraz/GTM contradiction and the AdSense leftover; record this architecture as canonical.
- **Files:** `docs/JRHOF_MASTER_STATUS.md:12`, `docs/DECISIONS.md:31,51`, `docs/launch/SEO_AND_AD_GRANTS_READINESS.md:58`, `docs/ANALYTICS.md` (link to architecture doc), `public/ads.txt` (**delete only after owner confirms AdSense unused** — otherwise separate PR).
- **Acceptance:** `grep -ri zaraz docs/ | grep -i ga4` returns only historical/changelog mentions; ads.txt decision recorded in DECISIONS.md.
- **Safe to deploy:** Docs yes; ads.txt deletion gated on owner confirmation.

### PR-7 `mkt/person-event-schema`
- **Goal:** SEO schema depth for the archive + events.
- **Files:** `src/pages/inductees/[slug].astro` (Person node via BaseLayout `structuredData` prop), `src/pages/events/golf/2026-…/index.astro` + banquet page (Event node w/ offers), `src/components/BaseLayout.astro` (add `potentialAction: DonateAction` to org node — 3 lines).
- **Acceptance:** Rich Results Test passes on one inductee page + golf 2026 page; no schema errors in GSC after a week.
- **Safe to deploy:** Yes.

### PR-8 `mkt/gallery-gtag-cleanup` (janitorial, batch with any above)
- **Files:** `src/components/GalleryGrid.astro:248` — remove dead `window.gtag` fallback branch.
- **Acceptance:** gallery events still push via `jrhofTrack`; grep for `gtag` in `src/` returns nothing.

### PR-9 `mkt/inductee-class-hubs` (can trail)
- **Goal:** `/inductees/class-of-<year>/` hub pages generated from `src/data/inductees.json`.
- **Acceptance:** hubs listed in sitemap, linked from `/inductees/`, each links its members; spot-check 3 years.
- **Safe to deploy:** Yes.

**Phase 3 exit criteria:** thank-you pages noindexed + gated; client_reference_id flowing; 404s cleared; CSP clean; sponsor event live; docs single-voiced.

---

## Phase 4 — Native Stripe donations (Worker + Checkout Sessions)

Prereq: separate approval per `docs/DECISIONS.md` (payment architecture change). Measurement requirements to build **into** that project from day one:
1. Worker creates Checkout Sessions with `metadata`: `client_id`, `session_id`, `gclid?`, `utm_*?`, `landing_page`; `success_url=/donate/thank-you/?cs={CHECKOUT_SESSION_ID}`.
2. Thank-you flow upgrades to full `purchase`-schema event: `transaction_id`, real `value`, `currency`, `items[{item_category:'donation'}]` (amount via tiny Worker lookup of the session).
3. Webhook `checkout.session.completed` → D1 ledger row incl. attribution metadata. MP backfill only per reconciliation runbook (architecture §13.3).
4. GA4: mark `purchase` Primary-in-Ads with value; demote `donation_complete`-without-value and all interim click proxies (demotion ladder step 2 completes).
5. Monthly reconciliation query: Stripe count/$ vs GA4 purchase count/$ (playbook §5).
**Exit:** one month where board donation numbers come from D1/Stripe with GA4 tracked-share ≥75%, and Ads optimizes on valued purchases.

## Phase 5 — Native registration platform (D1) & Eventbrite elimination

Measurement additions to the registration build: `registration_complete` w/ value + `event_slug`/`event_year`; sponsor checkout fires `purchase` with `item_category:'sponsorship'`; volunteer flow fires `volunteer_interest`; D1 exports (CSV/Sheets) become the board ledger; registration click-proxies retire to Secondary; referral exclusion for eventbrite.com removed; seasonal Ads campaigns point at native landing pages with real conversion goals. Board dashboard v2: revenue-by-channel from D1 attribution columns.
**Exit:** a full golf-tournament cycle (promotion → registration → event) measured end-to-end natively; Eventbrite contract ended.

## Phase 6 — Long-term optimization

Enhanced conversions (hashed email from Stripe → Ads, after privacy sign-off); conversion value rules if monthly giving warrants LTV weighting; seasonal campaign automation via scripts/rules (pause/enable by calendar); annual full audit (repeat the 2026-07-02 methodology); Bing WMT + Clarity↔Bing synergy; paid Ads account **only if** a concrete remarketing/YouTube case for event promotion is approved; content program scale-up per inductee-enrichment results.

---

## Consolidated priority queue (what to do, in order, starting today)

**Today (Google UI, owner):** P1.1 → P1.2 → P1.3 → P1.5 annotations. *(~45 min; ends the poisoned-bidding era.)*
**This week:** P2.1 GTM v8 (the big one) → P2.2 Stripe redirects (+$1 test) → P2.3 GA4 registrations → PR-1, PR-2, PR-3, PR-4 → P1.4/P2.5 verifications.
**Next 2–4 weeks:** P2.4 Ads rebuild → PR-5, PR-6, PR-7, PR-8 → first Looker board one-pager → 30-day demotion-ladder step.
**Before next event campaign:** PR-9 hubs, inductee enrichment batch 1, seasonal Golf campaign build.
**On approval:** Phase 4, then Phase 5 per registration-architecture memory (D1 + hosted Checkout).
