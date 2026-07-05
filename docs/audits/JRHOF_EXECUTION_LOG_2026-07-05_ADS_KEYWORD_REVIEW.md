# JRHOF Execution Log — 2026-07-05 — Ad Grants Keyword & Negative Review (Phase P2.5)

**Operator:** Claude (browser session as tj@jrhof.org), on TJ's instruction
**Scope:** Review the live Ad Grants keyword architecture built 2026-07-04, then make the safe corrections directly in the account — pause poor-fit/generic-broad keywords, rename generic ad groups, add tightened mission-relevant phrase/exact keywords, and expand the shared negative list. Implementation task, not audit-only.
**Account:** Google Ads **850-823-3621** (Ad Grants). Cancelled account 567-662-7574 untouched.
**Predecessor:** `docs/audits/JRHOF_EXECUTION_LOG_2026-07-04_ADS_LAUNCH.md`

---

## 0. Note on the "exported reports"

The Search keyword report and Negative keyword details reports referenced in the brief were not present on disk (repo, Downloads, Desktop, and scratchpad all checked). Rather than work from a stale export, the live keyword and negative-list state was read **directly from the account** in-session and is transcribed below. This is the authoritative source for everything that follows.

## 1. Live state found (before changes)

All three Grants campaigns are **Enabled** and Search-only; the fourth (`Grants | Golf | Seasonal 2026`) is still **unbuilt**. Every keyword carried 0 impressions (campaigns launched 2026-07-04, mostly "Low search volume"). Legacy campaigns (`Evergreen - Awareness`, `Donations – JRHOF`) remain **Paused**, untouched.

**19 enabled keywords, all in an ad group literally named "Ad group 1" in each campaign:**

| Campaign | Keyword | Match | Verdict |
|---|---|---|---|
| Brand & Archive | `[joe rossi umpires hall of fame]` | Exact | keep |
| Brand & Archive | `"jr and associates hall of fame"` | Phrase | keep |
| Brand & Archive | `"joe rossi hall of fame"` | Phrase | keep |
| Brand & Archive | `[joe rossi hall of fame]` | Exact | keep |
| Brand & Archive | `"joe rossi umpires hall of fame"` | Phrase | keep |
| Donations | `"support umpire hall of fame"` | Phrase | keep |
| Donations | `"donate baseball history nonprofit"` | Phrase | keep |
| Donations | `"sports history nonprofit donation"` | Phrase | keep |
| Donations | `"donate to hall of fame nonprofit"` | Phrase | keep |
| Donations | `"donate to umpire hall of fame"` | Phrase | keep |
| Banquet & Community | `hall of fame banquet` | **Broad** | **PAUSE** — generic broad |
| Banquet & Community | `indiana basketball hall of fame banquet` | **Broad** | **PAUSE** — other HOF |
| Banquet & Community | `nascar hall of fame banquet` | **Broad** | **PAUSE** — other HOF |
| Banquet & Community | `springfield sports hall of fame banquet` | **Broad** | **PAUSE** — other HOF |
| Banquet & Community | `"hall of fame banquet"` | Phrase | **PAUSE** — generic |
| Banquet & Community | `"sports hall of fame event"` | Phrase | **PAUSE** — generic, other HOF |
| Banquet & Community | `"induction banquet colorado"` | Phrase | keep |
| Banquet & Community | `"baseball awards banquet"` | Phrase | keep |
| Banquet & Community | `"umpire hall of fame banquet"` | Phrase | keep |

**Key finding:** the 2026-07-04 launch log recorded the Banquet keywords as five phrase terms, but the live account actually held **four broad-match keywords** (including three other-hall-of-fame junk terms — NASCAR, Indiana basketball, Springfield sports) plus a generic `"hall of fame banquet"` phrase pair. This is exactly the pollution the brief flagged. All three ad groups were also still named the wizard default "Ad group 1".

Shared negative list `Shared | Negatives | Core` held **25** broad-match terms and was correctly attached to all 3 active Grants campaigns (Campaign level).

## 2. Changes made in Google Ads (CONFIRMED in-product)

### 2a. Keywords paused (6) — pause, not remove; history intact, fully reversible
In `Grants | Banquet & Community`:
- `hall of fame banquet` (Broad)
- `indiana basketball hall of fame banquet` (Broad)
- `nascar hall of fame banquet` (Broad)
- `springfield sports hall of fame banquet` (Broad)
- `"hall of fame banquet"` (Phrase)
- `"sports hall of fame event"` (Phrase)

Confirmed by the "6 keywords paused" toast; no identity re-verification fired.

### 2b. Ad groups renamed (3) — descriptive, tight themes
- `Grants | Brand & Archive`: "Ad group 1" → **"Brand - Joe Rossi Umpire HOF"**
- `Grants | Donations`: "Ad group 1" → **"Donate - Umpire History Nonprofit"**
- `Grants | Banquet & Community`: "Ad group 1" → **"Banquet - Umpire Recognition"**

### 2c. Keywords added (26) — all phrase/exact, mission-relevant, no single-word, no generic broad

**Brand - Joe Rossi Umpire HOF (+7):**
`"umpire hall of fame"`, `"baseball umpire hall of fame"`, `"colorado umpire hall of fame"`, `"baseball umpire recognition"`, `"umpire inductees"`, `"baseball officials hall of fame"`, `[umpire hall of fame]`

**Donate - Umpire History Nonprofit (+11):**
`"support baseball nonprofit"`, `"donate to baseball nonprofit"`, `"support youth baseball nonprofit"`, `"baseball community nonprofit"`, `"honor baseball officials"`, `"support sports history nonprofit"`, `"donate to sports history nonprofit"`, `"support colorado baseball nonprofit"`, `[support baseball nonprofit]`, `[donate to baseball nonprofit]`, `[baseball community nonprofit]`

**Banquet - Umpire Recognition (+8):**
`"umpire awards banquet"`, `"baseball hall of fame banquet"`, `"colorado sports banquet"`, `"umpire recognition event"`, `"baseball recognition event"`, `[umpire awards banquet]`, `[baseball awards banquet]`, `[umpire recognition event]`

The Google Ads "your campaign is using Smart Bidding — change keywords to broad match" prompt was **declined** on every add (broad match would breach the no-generic-broad guardrail).

**Result: 39 enabled keywords** (19 − 6 paused + 26 added), verified "1 – 39 of 39" in the account.

### 2d. Match-type changes
No existing keyword had its match type edited in place. The generic broad terms were paused (2a) rather than converted; the tightened replacements were added fresh as phrase/exact (2c). Net effect: the Banquet ad group no longer depends on any broad-match keyword.

### 2e. Negative keywords added (25) to `Shared | Negatives | Core` (now 50; still applied to all 3 campaigns)
`jersey`, `hats`, `merchandise`, `store`, `uniform`, `rulebook`, `rules`, `training`, `certification`, `clinic`, `exam`, `referee training`, `umpire school`, `fantasy`, `ticketmaster`, `tourism`, `museum`, `nascar`, `basketball`, `wrestling`, `wwe`, `rock and roll`, `music hall of fame`, `indiana`, `springfield`

(The list already contained: jobs, salary, salaries, hiring, resume, career, how much do umpires make, umpire pay, umpire salary, equipment, gear, uniforms, umpire mask, chest protector, referee gear, mlb tickets, nba, nfl, soccer, football, free, template, video game, mlb the show, roblox.)

## 3. Negatives intentionally NOT added, and why
- **`game`** — too broad; a bare-word broad negative would block legitimate mission-adjacent queries like "baseball game umpire" / "game officials". Kept the specific `video game` (already present) and added `fantasy`.
- **`tickets`** — would block the JRHOF banquet's own valid intent ("induction banquet tickets colorado"). Kept the specific `mlb tickets` (already present) and added `ticketmaster` (JRHOF does not sell via Ticketmaster).
- **`college football` / bare `nfl`/`nba`/`football`/`soccer`** — `football`, `nfl`, `nba`, `soccer` already in the list; `college football` is redundant because any such query already contains `football`.

### Campaign-level vs shared decisions
`indiana`, `springfield`, `nascar`, `basketball`, `wrestling`, `wwe`, `rock and roll`, `music hall of fame` were added at the **shared** level (not campaign-level) after confirming they can never appear in a legitimate JRHOF query — no live keyword or brand term contains those tokens, so blanket application carries no risk of blocking valid traffic. Per the brief's guardrail, anything that *could* have blocked valid traffic (`game`, `tickets`) was excluded from the shared list entirely rather than pushed down to campaign level.

## 4. Reversal of a prior deliberate exclusion (documented)
The 2026-07-04 log deliberately kept `rules` / `training` / `certification` **out** of the shared list to protect a hypothetical "become an umpire" community angle. That angle was **never built** — there is no live keyword anywhere in the account targeting umpire training/certification/rules intent. Given the brief's explicit request and the absence of any traffic to protect, these (plus `rulebook`, `clinic`, `exam`, `referee training`, `umpire school`) were added to the shared list this session. If a community "become an umpire" ad group is ever built, detach those negatives from that campaign (campaign-level override) rather than removing them from the shared list.

## 5. Items reviewed and intentionally left unchanged
- **Conversion tracking / GA4 key events / GTM** — not touched; no defect surfaced during keyword work (guardrail).
- **Bidding, budgets, geo, campaign types** — unchanged; all remain Search-only, Maximize Clicks, $2 CPC cap.
- **Final URLs** — unchanged; verified live 200: `/`, `/donate/`, `/events/induction-banquet/2027-hall-of-fame-induction-banquet/`, `/inductees/`, `/about/`.
- **Responsive search ads** — not edited. No ads point to Stripe.
- **Legacy paused campaigns** and the failed 2026-07-03 bulk Sheet — left alone (re-applying the Sheet would duplicate live campaigns; see 07-04 log §2).
- **Kept Donations/Brand originals** — the five original Donations phrase terms and five Brand brand-terms are mission-relevant and were retained.

## 6. Compliance check (post-change)
1. No single-word keywords enabled — ✓ (all ≥2 words, phrase/exact).
2. No generic broad keywords enabled — ✓ (the four broad terms are paused; every add is phrase/exact).
3. Keywords mission-relevant — ✓ (umpire / baseball-officials / JRHOF-nonprofit / banquet-recognition themes).
4. Landing pages active 200 on jrhof.org — ✓ (curled this session).
5. No ads point to Stripe — ✓ (ads untouched; final URLs are jrhof.org pages).
6. No duplicate campaigns created — ✓ (edited the three live campaigns in place; created nothing).
7. No page-view-class conversions Primary — ✓ (not touched; held from 07-02 reset).
8. CTR risk acceptable — new campaigns still in learning; the tightened, higher-intent set should improve relevance vs. the paused generic broad.
9. QS 1–2 keywords paused/flagged — no QS data yet (0 impressions); first monthly sweep will flag.
10. All active campaigns Search-only and Ad Grants compliant — ✓.

## 7. Manual follow-up required from TJ
1. **Second RSA on `Grants | Brand & Archive`** (it still has one) — Grants best practice is ≥2 ads per ad group; carryover from the 07-04 log.
2. **Second ad group per campaign** remains a best-practice gap; the renamed single ad groups are now tightly themed, but a research/community second ad group each would round out structure.
3. **`Grants | Golf | Seasonal 2026`** still unbuilt — build via the wizard (not the Sheet) with sponsor/community/event-awareness intent for the ~January seasonal ramp; the 2026 Umpire's Cup has passed.
4. **Fix `Grants | Brand & Archive` budget** to the planned $120/day (published at $145.90).
5. Watch **search terms** weekly for the first 2–3 weeks and add campaign-level negatives as real queries reveal name-collision terms not covered by the shared list.
6. Carryover owner items from 07-03/07-04 logs still open (AW-17438185594 ownership spot-check, Enhanced-conversions keep/off decision, Zaraz dashboard confirmation, Stripe `?cs=` redirect).

## 8. Session notes / gotchas
- The "Create keywords" (+) picker on the Keywords page occasionally needs a second click to open; always confirm the "Select an ad group" dialog is visible before typing. Its search box matches **campaign** name/ID, not ad-group name.
- "Donations" matches two campaigns in the picker (the live `Grants | Donations` and the paused legacy `Donations – JRHOF`) — search the full `Grants | Donations` to disambiguate and avoid touching the legacy campaign.
- No "Confirm it's you" re-verification fired this session (all edits were keyword/label/negative mutations, not budget/bidding changes).
