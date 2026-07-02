# JRHOF GA4 / GTM / Ads Operations Playbook

**Version:** 1.1 — 2026-07-02
**Audience:** whoever operates measurement next (webmaster, volunteer, contractor). Assumes the target state in `docs/architecture/JRHOF_MARKETING_ARCHITECTURE.md`.
**Prime directive:** the taxonomy table (architecture §6) is law. If an event, tag, or conversion isn't in that table, it doesn't ship.

Account state is time-sensitive. Before acting on a version number or campaign status recorded in the July 2 audit, read the current dashboard. The standing architecture does not change: `GTM-WGDF4SBN` is the only Google loader, and Zaraz contains no Google measurement tools.

---

## 1. Accounts, access, identifiers

| System | Identifier | Access rule |
|---|---|---|
| GTM | `GTM-WGDF4SBN` (acct 6346792949 / container 247717483) | Max 2 publishers, named accounts only |
| GA4 | acct `373612649` / property `511268663` / stream `G-VYQQ5E7ZHM` | Admin: 2; Analyst for board members |
| Google Ads | 850-823-3621 (Ad Grants; cancelled sibling 567-662-7574 stays dead) | Admin: 2 |
| GSC | `sc-domain:jrhof.org` (primary) + `https://jrhof.org/` (serves GA4 link) | Owner: 2 |
| Clarity | `v8l2xfpqpy` via `src/components/Clarity.astro` — never also via GTM | — |
| Stripe | live Payment Links per architecture §8.3; redirects carry `{CHECKOUT_SESSION_ID}` | Finance owner |
| Web tag | `AW-17438185594` (ownership verification logged in changelog before P6 use) | — |

Access reviews every January and whenever a volunteer departs. No shared logins; no credentials in the repo (per existing policy).

## 2. Naming conventions (enforced at review)

- **dataLayer events:** `object_action` snake_case (`donate_click`, `registration_complete`). Params snake_case from the approved set (architecture §6).
- **GTM:** tags `GA4 | Event | <name>`; triggers `CE | <name>` / `PV | <path>` / `Guard | <purpose>`; variables `DLV | <param>` / `Const | <id>`. Version names `v<N> — <summary>`.
- **Ads:** campaigns `Grants | <Outcome> [| Seasonal <year>]`; shared negative list `Shared | Negatives | Core`.
- **UTMs (owned channels only, never on Ads final URLs):** lowercase-hyphenated; `utm_campaign=<initiative>-<year>`; registry kept in §8.
- **Looker Studio:** `JRHOF Board — <YYYY-MM>` (monthly copy) + `JRHOF Ops — live`.

## 3. Change management

1. **Any measurement change** = GTM workspace + Preview evidence + version notes; **and** a line in `docs/CHANGELOG.md` (date, system, what, why, who).
2. **GA4 annotations** (or changelog if unavailable): every key-event change, filter activation, Ads goal change, campaign launch. The 2026-07-02 discontinuity ("GTM v7 dropped custom events since cutover; v8 restored") must stay documented — June/early-July event data is not comparable.
3. **Two-system rule:** a change touching code *and* GTM (e.g., new event) ships code first, GTM tag second, key-event flag third — each independently verifiable.
4. **Rollbacks:** GTM = republish prior version; GA4 flags = toggle; Ads = pause new/unpause old. Never delete campaigns, conversion actions with history, or GA4 events to "clean up" — pause/demote instead.

## 4. QA checklists

### 4.1 After every site deploy touching layout/links (5 min)
- Load `/` in a clean browser: exactly **one** `gtm.js`, one `gtag/js?id=G-VYQQ5E7ZHM`, one `g/collect …en=page_view` attempt per navigation.
- Click one tracked CTA; see its `g/collect?en=<event>` attempt (a blocked/503 attempt still proves emission).
- Console: zero CSP "Refused" lines mentioning google/clarity domains.

### 4.2 After any GTM publish (15 min)
- Preview mode on `/`, `/donate/`, one inductee page, one golf page: each taxonomy event fires its tag once with populated params; no tag fires twice; no tags fire on a `workers.dev` preview host.
- DebugView: params visible (`cta_location`, `event_slug`…), no `(not set)` floods.
- Tag Assistant: GA4 + AW + Conversion Linker green.

### 4.3 Monthly conversion-truth check (10 min)
- Ads → Goals → Summary: **zero** page-view-class actions in Primary; "Misconfigured" count = 0; conversions last 30d ≈ GA4 key events (±20%).
- GA4 → Key events report: only approved outcomes accruing.
- Test `?cs=test` thank-you visit fires `donation_complete` exactly once per session.

## 5. Operating cadences

**Weekly (10 min):** GA4 Realtime sanity; Ads search-terms skim → add negatives; delivery check (every enabled campaign has impressions; if a campaign hits 0 for 7 days → runbook R3).
**Monthly (60 min):** build board one-pager (§7); QA 4.3; Grants compliance sweep (CTR ≥5% account-wide two-month watch, QS ≤2 keywords paused, no single-word keywords slipped in, ≥1 real conversion recorded); GSC Pages delta (new 404s → redirect PR; indexation trend of enriched inductee batches); Stripe↔GA4 reconciliation once Phase 4 lands (tracked share = GA4 purchases ÷ Stripe charges; alert <75%).
**Quarterly:** access review lite; retention/attribution settings unchanged; audiences accruing; demotion-ladder step due? (architecture §7); seasonal campaign calendar (enable Golf campaign ~Jan, pause post-event).
**Annually (January):** repeat the full audit methodology of `docs/audits/JRHOF_SEO_GA4_ADS_AUDIT_2026-07-02.md`; rotate this playbook's version; Grants program survey/compliance attestation; confirm that no AdSense artifact has been reintroduced. JRHOF does not use AdSense; Google Ad Grants and Google Ads documentation is separate and remains in scope.

## 6. Incident runbooks

**R1 — Duplicate page_views (double loader).** Symptom: sessions≈users but 2× views, or two `g/collect en=page_view` per navigation. Order of suspects: a second loader added outside GTM (Zaraz re-enabled, hardcoded gtag in a PR, Clarity via GTM), a second GA4 config tag in GTM. Fix: remove the non-GTM loader; never "fix" by filtering. Verify via network trace. Historical note: Zaraz was the pre-cutover loader — it must stay empty of Google tools.

**R2 — Conversion pollution returns (conv rate >100% or Ads "Misconfigured").** Someone re-imported GA4 auto-events or re-starred them. Fix per roadmap P1.1/P1.2; find the change in Ads Change history + GA4 change history; add changelog entry. This is the signature failure mode of this account — check it monthly (QA 4.3).

**R3 — Campaign at 0 impressions ≥7 days.** Check in order: policy/approval status per ad; keyword status + "Ad preview & diagnosis"; bid strategy starved (Max Conversions with no conversion signal → temporary Maximize Clicks); Grants CTR compliance state; budget allocation vs sibling campaigns. Precedent: `Donations – JRHOF` spent June Eligible-but-silent on poisoned Max Conversions.

**R4 — Tracking loss after deploy (the cutover failure mode).** Symptom: GA4 events flatline while traffic continues (Cloudflare/Clarity still show visits). Empirical test: click a gallery photo; if no `g/collect?en=gallery_open` **attempt** appears in DevTools network, emission is broken. Suspects: GTM version regression (republish v-latest), `jrhofTrack` removed/renamed in BaseLayout, CSP change blocking googletagmanager.com. This exact failure ran silently from cutover until 2026-07-02 — treat flatlines as P0, not curiosities.

**R5 — GA4↔Stripe variance >25% two consecutive months (post-P4).** Verify thank-you redirect intact on every live Payment Link; `cs=` param present; sessionStorage dedupe not over-suppressing; blockers trend (compare Clarity session counts). If client-side is structurally suppressed, enable the MP backfill path for missing sessions only (architecture §13.3) — never blanket-double-send.

**R6 — Grants account warning/suspension notice.** Don't self-remediate blind: pull the specific policy (CTR, keyword quality, mission relevance), fix minimally, document, request re-review. Keep the compliance sweep evidence (§5 monthly) as the paper trail.

## 7. Board reporting SOP (monthly, ~30 min once template exists)

1. Sources: Stripe dashboard (or D1 export post-P5) for money; GA4 for behavior; GSC for organic; Ads for Grants usage.
2. Fill the KPI table (definitions §9 — do not improvise formulas; if a definition must change, change it here first and annotate the dashboard).
3. State the reconciliation line verbatim: *"GA4 tracked N% of Stripe-recorded donations this month (expected 75–95%)."*
4. One narrative paragraph max: what moved, why we think so, single recommended action.
5. Export PDF → board folder (Drive/SharePoint per org standard); archive the month's numbers in the ledger sheet.

## 8. UTM registry (append-only)

| utm_source / medium | Use | First used |
|---|---|---|
| `jrhof.org` / `website` | **Deprecated** — was decoration on Stripe-hosted URLs; superseded by `client_reference_id` bridge (PR-2) | pre-2026-07 |
| `newsletter` / `email` | Org email sends | reserve |
| `chsbua` / `referral` | Partner links if ever campaign-tagged | reserve |
| `qr` / `offline` | Event-day signage, flyers | reserve |
| `facebook` / `social` | Community posts | reserve |

## 9. KPI glossary (contractual definitions)

| KPI | Definition | Source of truth |
|---|---|---|
| Donations (count/$) | Succeeded Stripe payments with donate submit-type (later: D1 ledger rows type=donation), calendar month, gross | Stripe/D1 |
| Avg gift | Gross ÷ count, same window | Stripe/D1 |
| Tracked share | GA4 `donation_complete`(/`purchase`) count ÷ Stripe count | derived |
| Registrations | Completed paid registrations per event (Eventbrite report until P5; then D1) | Eventbrite→D1 |
| Sponsor pipeline | `sponsor_inquiry` events; closed $ maintained manually beside it | GA4 + manual |
| Sessions / users / channel mix | GA4 default channel grouping, calendar month | GA4 |
| Organic clicks | GSC Performance web clicks, calendar month | GSC |
| Grants utilization | Ads cost (grant credit) ÷ ~$10k cap | Ads |
| Ads conversions | Primary conversion actions only (never Secondary) | Ads |
| Archive engagement | Views of `/inductees/*` + `gallery_open` count | GA4 |

## 10. Standing prohibitions (from the architecture — enforce at review)

Never: mark `page_view`/`first_visit`/`user_engagement`/`scroll`/`session_start` as key events or Ads conversions; run a second Google loader beside GTM; UTM-tag Ads final URLs; add AdSense artifacts; create remarketing campaigns in the Grants account; add a catch-all regex event tag; assign invented monetary values to lead events; delete historical campaigns/conversion actions (pause/demote only); enable Zaraz Google tools. JRHOF does not use AdSense; Google Ad Grants and Google Ads remain separate.
