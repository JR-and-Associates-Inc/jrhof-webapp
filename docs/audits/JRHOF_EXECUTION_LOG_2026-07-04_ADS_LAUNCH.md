# JRHOF Execution Log — 2026-07-04 — Ad Grants Campaigns Go Live (Phase P2.4 cont.)

**Operator:** Claude (browser session as tj@jrhof.org), with TJ present to clear Google identity re-verification
**Scope:** Take the four-campaign plan live via the campaign wizard (the 2026-07-03 bulk-Sheet upload had failed to apply); pause the legacy campaigns; add the shared negatives list and account-level assets; build the next event campaign (2027 Induction Banquet).
**Account:** Google Ads **850-823-3621** (Ad Grants). Cancelled account 567-662-7574 untouched.
**Predecessor:** `docs/audits/JRHOF_EXECUTION_LOG_2026-07-03_ADS_REBUILD.md`

---

## 1. What went live this session (CONFIRMED in-product)

### Campaigns now ENABLED (all Search-only, Maximize Clicks, $2.00 CPC cap, Colorado except Brand)
| Campaign | ID | Budget/day | Geo | Ad groups × ads | Landing |
|---|---|---|---|---|---|
| Grants \| Brand & Archive | 24006288649 | $145.90 | US | 1 × 1 RSA | `/` |
| Grants \| Donations | 24006355657 | $90.00 | Colorado (Presence) | 1 × **2 RSAs** | `/donate/` |
| Grants \| Banquet & Community | 23996985261 | $30.00 | Colorado (Presence) | 1 × **2 RSAs** | `/events/induction-banquet/2027-hall-of-fame-induction-banquet/` |

- **Brand & Archive** published in the prior session (the identity check ultimately cleared); confirmed live/"Bid strategy learning" this session at the wizard's recommended $145.90/day (not the planned $120 — the identity gate interrupted before the budget edit).
- **Donations** built and published this session. Bidding = **Maximize Clicks $2 cap deliberately** (not Max Conversions) — the old Donations campaign sat at 0 impressions for a month on conversion-starved Max Conversions; Max Clicks guarantees delivery now, switch to Max Conversions at +30 days of real `donation_complete` data (demotion ladder). Account-default goals attached (Purchases=`donation_complete`, Contacts=`form_submit`). Ad group "Donate to Umpire History": 5 phrase keywords + 2 RSAs (paths `donate` / `give`). AI Max OFF (search-term matching = "your keywords/match types only"; Final URL expansion inert — clicks stay on `/donate/`).
- **Banquet & Community** built and published this session, focused on the next event (2027 Induction Banquet, Feb 6 2027). Ad group "Hall of Fame Banquet": 5 phrase keywords (`hall of fame banquet`, `umpire hall of fame banquet`, `induction banquet colorado`, `sports hall of fame event`, `baseball awards banquet`) + 2 RSAs with Feb-6-2027 save-the-date / new-inductee copy, both landing on the specific 2027 banquet page. $30/day is a modest awareness-phase budget (projected delivery ~$14/day); **ramp toward ~$50/day in January 2027** as the event nears and registration opens.

### Legacy campaigns PAUSED (not deleted — rule 1; fully reversible)
- `Evergreen - Awareness` ($100/day) → Paused
- `Donations – JRHOF` ($208.97/day) → Paused
- `JRHOF – Awareness – Search – Website Traffic` ($45/day stray leftover) → was already Paused
- Nothing deleted; all history intact. Active-campaign account budget is now $145.90+$90+$30 = **$265.90/day** (Grants credit, not real spend).

### Shared negative keyword list
- Created **`Shared | Negatives | Core`** — 25 broad-match negatives: `jobs`, `salary`, `salaries`, `hiring`, `resume`, `career`, `how much do umpires make`, `umpire pay`, `umpire salary`, `equipment`, `gear`, `uniforms`, `umpire mask`, `chest protector`, `referee gear`, `mlb tickets`, `nba`, `nfl`, `soccer`, `football`, `free`, `template`, `video game`, `mlb the show`, `roblox`.
- **Applied to all 3 active Grants campaigns** (confirmed "3 campaigns using this list").
- **Deliberately excluded** `training` / `certification` / `rules` from the core list — they overlap with the community-engagement "become a baseball umpire" angle the Banquet & Community campaign will carry, so they should not be a blanket account negative. Add per-campaign later if search terms warrant.

### Account-level assets (apply to every campaign, incl. all 3 live Grants ones)
- **6 sitelinks** (Account level, under review): Donate → `/donate/`; Meet the Inductees → `/inductees/`; Induction Banquet → `/events/induction-banquet/`; Golf Tournament → `/events/golf/2026-umpires-cup-iv/`; About JRHOF → `/about/`; Contact Us → `/contact/` (each with 2 description lines).
- **5 callouts** (Account level, under review): `501(c)(3) Nonprofit`, `Preserving Umpire History`, `Honoring Baseball Umpires`, `Community Supported`, `Colorado Umpire Legacy`.
- Verified flowing: the Banquet ad-build screen showed "6 account-level sitelinks" attached. Note: the old campaign-level sitelinks on the now-paused campaigns were left as-is (paused, harmless).

## 2. Sheet upload — verified never applied

The 2026-07-03 Google Sheet bulk upload **failed and never reached the account**. Bulk-action history shows one record: "Preview finished with errors — Failed: File not found. Make sure the file has been shared with the Google Ads email address displayed on screen." (the sheet was never shared with the `…@partnercontent.gserviceaccount.com` service account). Everything live was therefore built by hand via the wizard.

**Consequence for that sheet:** three of its four campaigns — `Grants | Brand & Archive`, `Grants | Donations`, and `Grants | Banquet & Community` — now exist as live wizard-built campaigns, so re-applying the sheet (in whole or in part) would **duplicate** them. **`Grants | Golf | Seasonal 2026` is the only campaign in the sheet not yet built**, but do not bulk-apply even the Golf rows — build Golf via the wizard for consistency with the other three. Treat the sheet as a reference/plan artifact only, never an apply source.

## 3. Compliance posture (Grants)

- Search-only ✓; no remarketing ✓; no UTMs on final URLs ✓; phrase/exact only, no single-word keywords ✓; meaningful conversions = GA4 imports only ✓; account-level sitelinks (≥4) + callouts present ✓; Core negatives applied ✓.
- **Open compliance gap:** each live campaign currently has **1 ad group** (Grants best practice is ≥2 ad groups/campaign). Donations and Banquet each have 2 RSAs (meets ≥2 ads/ad group); Brand & Archive has 1 RSA. Round out with a 2nd ad group per campaign and a 2nd RSA on Brand & Archive at the next pass — not a launch blocker, checked over time.
- Watch account CTR weekly through the ramp (new campaigns reset learning).

## 4. Still to do (next passes)

1. **Grants | Golf | Seasonal 2026** — the 4th campaign, not yet built (seasonal; heaviest before the summer Umpire's Cup). Build via wizard when the seasonal calendar warrants.
2. **Second ad group per campaign** (Donations: Support Youth & Community Umpires, Baseball Community Giving; Banquet: Umpire Awards & Recognition, Community Events; Brand: Joe Rossi, Umpire Hall of Fame, Inductees Archive) + a 2nd RSA on Brand & Archive — for full Grants structure.
3. **Fix Brand & Archive budget** to the planned $120/day (it published at $145.90).
4. **Banquet budget ramp** to ~$50/day in January 2027.
5. Carryover owner items from the 07-03 log still open: AW-17438185594 ownership spot-check, Zaraz dashboard confirmation, Stripe `?cs={CHECKOUT_SESSION_ID}` redirect, Enhanced-conversions keep/off decision, BigQuery link + GSC report publish.
6. At P2+30 days of real conversions: switch Donations (first) to Maximize Conversions per the demotion ladder.

## 5. Session gotchas

- Google's "Confirm it's you" re-verification fires on campaign-mutation attempts in an automated session and needs the owner present; it appeared at the Donations budget step (TJ cleared it) and did not re-fire for the Banquet publish (cached for the session).
- In the new-campaign wizard, a stray click on the campaign-type cards silently switches Search→Performance Max and resets the campaign name; re-select Search and rename.
- The review-page "AI Max asset optimization: Text customization and Final URL expansion turned on" line is a **display artifact** — with AI Max toggled off these are inert; the authoritative signal is "Search term matching: Using only your keywords and match types."
- Publishing a campaign redirects to a Google-tag setup page; it auto-skips to the campaign overview — do **not** create a new tag there (would duplicate the GTM/GA4 loader).
