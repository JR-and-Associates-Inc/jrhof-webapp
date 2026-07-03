# JRHOF Execution Log — 2026-07-03 — Ad Grants Campaign Rebuild (Phase P2.4)

**Operator:** Claude (browser session as tj@jrhof.org), on TJ's instruction
**Scope:** Verify the 2026-07-02 measurement reset held; rebuild the Ad Grants campaign structure per `docs/architecture/JRHOF_MARKETING_ARCHITECTURE.md` §9.3 and the owner's 2026-07-03 directive
**Account:** Google Ads **850-823-3621** (Ad Grants). Cancelled account 567-662-7574 untouched.

---

## 1. Verified state (read-only checks, all CONFIRMED this session)

### GA4 (property 511268663)
- Key events are exactly: `conversion_event_purchase` (dormant), `donation_complete` (**receiving stream data** — GTM v8 works), `form_submit` (active). `purchase` present but unstarred. No page-view-class key events. **The 2026-07-02 reset held. No changes were needed or made.**
- Recent-events list shows the taxonomy flowing: `donate_click`, `donate_once_click`, `donation_complete`, `event_register_click`, `golf_register_click`, `banquet_info_click`, `contact_click`, `gallery_open`, `gallery_close` all active in the last 28 days.

### Google Ads conversions
- 7 GA4-import actions: Primary = `purchase`, `donation_complete`, `form_submit` (all "in account-level goals"); Secondary = `PURCHase` duplicate, `page_view`, `first_visit`, `user_engagement`. History preserved; nothing deleted.
- Last-7-days conversions: **0.00 across all actions** — the page-view-class pollution has stopped accruing entirely.
- "Misconfigured" badges = "no conversions recorded in last 7 days" (volume artifact, clears on first ad-attributed conversion), not a config defect.
- **Ad Grants enrollment CONFIRMED**: the new-campaign wizard states "Select campaign types are not available for Google Ad Grants" and offers only Performance Max + Search.
- Conversion settings show **Enhanced conversions ON** ("Managed through Google Tag Manager. Recording Enhanced Conversions") — architecture gates this behind a Phase 6 privacy sign-off. **Owner review needed** (see §4).

### GTM (GTM-WGDF4SBN)
- Live version = **v9**, an empty republish of v8 ("This container version has no changes", published 2026-07-02 4:57 PM). Live content = the v8 taxonomy restore: 19 tags / 18 triggers, all 16 `CE |` triggers hostname-gated `Page Hostname equals jrhof.org`, interim `PV | donate thank-you (Stripe referrer, no cs)` gate present, full `DLV |` set. v9 has **no version name** — naming convention gap only, content identical to v8.
- Container-quality banner still "Urgent — 3 issues", but all advisory: tag detected on additional domains (workers.dev previews — already excluded from prod data by the hostname guard), "some pages not tagged" heuristic, and "add another administrator" (playbook does recommend a second admin).

### Live site emission test (network layer)
- One `gtm.js`, one GA4 config, one AW config, exactly **one** `page_view` per navigation to both `analytics.google.com/g/collect` and `www.google.com/ccm/collect` (CSP fix from PR #26 confirmed working — `ccm/collect` now attempts). Beacons carry `tt=internal` from TJ's internal-traffic rule.
- `gallery_open` pushes to dataLayer with full params (`event_slug`, `event_year`, `gallery_name`, `photo_index`, `photo_count`, `viewport_orientation`) on the 2025 golf page.
- **No Zaraz**: zero `/cdn-cgi/zaraz/*` requests on the live site (only speculation-rules + Cloudflare RUM beacon). Dashboard-level confirmation still pending (needs Cloudflare login).

### Old campaigns
- `Evergreen - Awareness` ($100/day) and `Donations – JRHOF` ($208.97/day): both Enabled/Eligible, **0 impressions in the last 7 days** — Maximize Conversions stalled completely after the fake conversion signal was removed (runbook R3's predicted failure mode). The account is currently delivering nothing.

## 2. What was built this session

1. **Google Sheet `JRHOF Grants Rebuild 2026-07-03`** (in TJ's Drive, linked in the Ads bulk-upload panel): complete Editor-format build sheet — **4 campaigns / 13 ad groups / 64 phrase+exact keywords / 26 RSAs**, per the four-campaign structure (`Grants | Brand & Archive` $120/day, `Grants | Donations` $90/day, `Grants | Golf | Seasonal 2026` $40/day, `Grants | Banquet & Community` $50/day; all Search-only, Maximize Clicks). All headlines ≤30 chars, descriptions ≤90, no single-word or generic keywords. Landing pages verified live (200): `/`, `/about/`, `/inductees/`, `/donate/`, `/events/`, `/events/golf/2026-umpires-cup-iv/`, `/events/induction-banquet/`, `/sponsor/`. **Note:** the owner-suggested `/events/golf/` and `/events/banquet/` are 404s — substituted with the real routes.
   - Bulk **Preview failed with "File not found"** because the sheet must be shared with the Ads service account `209673488-100000002-account@partnercontent.gserviceaccount.com` — a Drive sharing-permission change reserved for the owner.
2. **Campaign draft** `Grants | Brand & Archive` (draftId 10202740183): Search, US, English, no search partners, no Display, Maximize Clicks with $2.00 max-CPC cap, AI Max off, Brand ad group (5 brand keywords exact+phrase) + 1 RSA (final URL `https://jrhof.org/`, path `hall-of-fame`, 7 headlines, 4 descriptions, Ad strength "Average"). **Unpublished** — Google raised a "Confirm it's you" identity re-verification at the budget step, which only the owner can complete.

Post-event context baked into golf/banquet ad copy: the 2026 Umpire's Cup (Jun 27) and 2026 banquet have already happened, so both event campaigns launch in recap/sponsor/awareness mode; the registration push belongs to the ~January seasonal ramp.

## 3. Owner actions to finish (in order)

1. **Verify identity in Google Ads** (the "Confirm it's you" prompt, tj@jrhof.org).
2. **Share the Sheet** `JRHOF Grants Rebuild 2026-07-03` (Viewer is sufficient) with `209673488-100000002-account@partnercontent.gserviceaccount.com`, then Tools → Bulk actions → Uploads → the sheet is already linked → **Preview** → fix any flagged rows → **Apply**. This creates all 4 campaigns, 13 ad groups, 64 keywords, 26 RSAs in one pass.
   - Then **discard** the wizard draft (Campaigns → Drafts) to avoid double-building Brand & Archive; or, if preferred, finish the draft instead and use the sheet only for the remaining 3 campaigns + extra ad groups (bulk upload matches campaigns by name and adds missing children).
3. **Per-campaign settings pass** (not expressible in the sheet): set bidding to Maximize Clicks with **$2.00 max CPC** on all four; locations — Brand & Archive: United States; Donations + Banquet & Community: Colorado; Golf: Colorado (Denver metro + Front Range if preferred); confirm search partners + Display are off (wizard defaults were already off).
4. **Shared negative list** `Shared | Negatives | Core` (Tools → Shared library → Exclusion lists → Negative keyword lists), apply to all 4 campaigns: `jobs`, `salary`, `hiring`, `training`, `certification`, `rules`, `equipment`, `gear`, `mlb jobs`, `mlb tickets`, `free`, `template`, `pdf`, `video game`, `salary umpire`, plus name-collision negatives as search terms reveal them.
5. **Account-level assets** (Assets page): ≥4 sitelinks (Donate → /donate/, Inductees → /inductees/, Golf Tournament → /events/golf/2026-umpires-cup-iv/, Banquet → /events/induction-banquet/, About → /about/, Contact → /contact/); callouts (`501(c)(3) Nonprofit`, `Preserving Umpire History`, `Honoring Baseball Officials`, `Community Supported`, `Colorado Umpire Legacy`); structured snippet Programs: Hall of Fame, Golf Tournament, Banquet, Inductee Archive.
6. **Pause** `Evergreen - Awareness` and `Donations – JRHOF` once the new campaigns are Eligible (pause, never delete).
7. **Enhanced conversions**: decide keep/off (Goals → Settings) — it predates the Phase 6 privacy sign-off.
8. **AW-17438185594 ownership** (2 min): Ads → Tools → Data manager shows a locked account-owned Google tag; confirm via Tag Assistant or the conversion-tag setup screen that its ID is AW-17438185594. Circumstantial evidence is strong (tag added to GTM 2026-03-28, same day as the GA4↔850-823-3621 link; only this account active).
9. **Cloudflare Zaraz** (1 min): dash.cloudflare.com → jrhof.org zone → Zaraz → confirm no Google tools configured (live-traffic check already clean).
10. **GTM housekeeping** (optional): name v9 ("v9 — empty republish of v8") in version notes; add a second container admin.

## 4. Compliance posture (Grants)

- Search-only ✓ (wizard enforces); no remarketing ✓; no UTMs on final URLs ✓ (none in sheet); phrase/exact only, no single-word keywords ✓; ≥2 ad groups & ≥2 RSAs per ad group ✓ (once sheet applied); meaningful conversions = GA4 imports only ✓.
- Watch account CTR weekly during ramp (old campaigns' 8.33% was on 12 clicks; the new structure resets learning). Pause QS 1–2 keywords at the first monthly sweep.
- After 30 days of real `donation_complete`/`form_submit` conversions flowing, evaluate switching Donations (first) to Maximize Conversions per the §7 demotion ladder.

## 5. Session gotchas (for future operators)

- Google Ads bulk upload from Google Sheets requires the sheet to be shared with the account-specific `partnercontent.gserviceaccount.com` address shown in the Uploads panel; the Drive picker alone does not grant access.
- The new-campaign wizard supports only ONE ad group inline; additional ad groups must be added post-publish (or via bulk upload).
- Google Sheets: typed Tab characters do not advance cells; workaround = type rows into column A with a `~` field separator, then `=SPLIT(A1,"~",TRUE,FALSE)` (remove_empty_text=FALSE preserves empty columns) and paste-special values.
- Google's "Confirm it's you" re-verification triggers on campaign-mutation attempts in fresh automated sessions and requires owner presence.
