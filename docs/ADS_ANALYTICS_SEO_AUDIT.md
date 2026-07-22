# JRHOF Ads / Analytics / SEO Audit — 2026-07-12 (remediation executed 2026-07-13)

> **Superseded payment-signal guidance (2026-07-22):** This is a point-in-time audit. Its recommendation to treat a return-page event as `donation_complete` is withdrawn. A return URL, `cs` parameter, or Stripe referrer is not proof of payment. Current code emits only observational `donation_return`; a Primary payment conversion must be based on signature-verified server-confirmed paid status. The current rule in `docs/ANALYTICS.md` controls.

> **Remediation status (2026-07-13):** The authorized account-side fixes were executed and verified in an authenticated Chrome session (tj@jrhof.org) — see §17. Auto-apply is fully OFF (0 of 21 types), the empty Engagement/Page-view goals are detached from all campaigns, all three Grants campaigns are back on Maximize Clicks / $2.00 cap, and the 2026 golf flyer now serves from `media.jrhof.org` (repo repointed). Still open: the Stripe `?cs={CHECKOUT_SESSION_ID}` redirect (blocked on a Stripe dashboard login — no credentials are handled by automation) and the Ads "Basic setup" banner, which refreshes on Google's daily recommendation cycle.

**Scope:** Full source-code, production-site, GTM, GA4, Google Ads / Ad Grants, Stripe conversion-tracking, and technical SEO audit, with safe repository fixes applied on branch `audit/ads-analytics-seo-validation-2026-07`.
**Method:** Repository inspection at `main` (9548633), read-only HTTP + browser inspection of https://jrhof.org, and **read-only authenticated inspection** (as tj@jrhof.org) of Google Ads 850-823-3621, GA4 property 511268663, and GTM container GTM-WGDF4SBN. No account settings, campaigns, GTM versions, GA4 settings, Stripe settings, DNS, or deployments were changed.
**Companions:** `docs/architecture/JRHOF_MARKETING_ARCHITECTURE.md` (target state), `docs/playbooks/JRHOF_GA4_GTM_ADS_OPERATIONS.md` (operations), prior execution logs under `docs/audits/`.

---

## 1. Executive summary

The site itself is in excellent technical shape: GTM is installed once and correctly, GA4 flows through GTM only, Clarity has exactly one loader, CSP is tight and error-free, structured data is valid, canonicalization/redirects/sitemap/robots are correct, and the donation-completion event is gated and deduplicated.

The problems are on the **Google Ads account side**, and both are now fully explained with in-product evidence:

1. **Auto-apply recommendations are enabled (21 types, including bidding).** On **Jul 8, 2026 11:41 AM**, "Recommendations Auto-Apply" changed all three Grants campaigns from the deliberately chosen *Maximize Clicks / $2.00 cap* to **Maximize Conversions (Target CPA $4.19)** — silently reverting the owner's Jul 6 fix (Change history, "Changes can't be undone"). Conversion-starved Target CPA does not bid, so **all three campaigns have delivered 0 impressions and $0.00** for weeks. This is why `Grants | Donations` shows *Eligible (Limited) — Bid strategy learning*.
2. **The "Your targeted goal is missing a primary conversion action" warning** comes from the account-default goal set: campaigns target account-default goals, which include **Engagement** and **Page view** goals that contain **0 primary conversion actions** (their actions were correctly demoted to Secondary in the 2026-07-02 reset). The fix is to **remove those two empty goals from the campaigns' goal set** — *not* to promote page-view/engagement actions back to Primary.

Repository-side, the audit found and fixed one class of real defect: **five internal-navigation links were borrowing funnel event names** (`event_register_click`, `gallery_open`), which would have polluted registration-intent and gallery metrics (and Ads, once those imports matter). Validation tooling was extended so the measurement contract is now enforced in CI.

## 2. Verified architecture (Phase 1–2, all observed)

| Layer | Verified state |
|---|---|
| GTM | `GTM-WGDF4SBN` inserted exactly once by `src/components/BaseLayout.astro` (standard head snippet + noscript iframe immediately after `<body>`). Live production HTML: 1 loader, 1 noscript, per page (all sampled pages). |
| GA4 | `G-VYQQ5E7ZHM` loaded only via GTM. No hard-coded gtag.js/GA4/AW snippets anywhere in the repo or production HTML. Exactly one `page_view` per navigation (network-verified). |
| Google Ads tag | `AW-17438185594` Google tag via GTM only; Conversion Linker on All Pages; conversions are **GA4 imports only** (no parallel AW event tags — no duplication by design). |
| Clarity | `v8l2xfpqpy` hard-coded via `src/components/Clarity.astro`, gated on `PUBLIC_CLARITY_PROJECT_ID` at build time. **Exactly one loader in production HTML; the GTM container contains no Clarity tag.** Note: this is a deliberate, documented deviation from "Clarity through GTM" — `docs/ANALYTICS.md` mandates one loader, either mechanism, never both. |
| Zaraz | Absent (0 references in HTML; no `/cdn-cgi/zaraz/*` requests). Must stay empty of Google tools. |
| Cloudflare Web Analytics | Auto-injected `static.cloudflareinsights.com/beacon.min.js` observed in a live browser session (edge-injected; not always visible to curl). Independent observer; no GA4 duplication. |
| Data layer | `window.jrhofTrack()` → `dataLayer.push` initialized in BaseLayout; declarative `data-ga-event`/`data-ga-params` attributes via `trackingAttrs()` (`src/config/site.ts`); `jrhof:analytics-event` CustomEvent bridge for non-Google diagnostics. |
| Environments | GTM GA4/AW config tags carry the `Guard \| Non-prod hostname` exception and all 16 CE triggers are gated `Page Hostname = jrhof.org` → workers.dev/preview/localhost cannot contaminate production data (verified in container). |
| CSP | `public/_headers` allows exactly the required Google/DoubleClick/Clarity/Cloudflare-insights origins; Stripe/Eventbrite limited to `form-action`/`frame-src`. Zero console errors and zero CSP violations in live browsing, including through gallery/lightbox interaction. |
| Attribution bridge | Click handler appends `client_reference_id=<GA client id>` to all `*.stripe.com` links (PR-2), so Stripe Checkout Sessions carry the GA4 client id. |

## 3. Production-site findings (Phase 2)

All verified live on 2026-07-12:

- **Status/canonicalization:** `http→https` 301, `www→apex` 301 (single hop), trailing-slash 307 via Workers `auto-trailing-slash` (acceptable; canonicals normalize). Legacy `_redirects` map works (`/joe-rossi/` → `/inductees/joe-rossi/` 301, `/privacy` → `/privacy-policy/` 301, `/security.txt` → `/.well-known/security.txt` 301). Clean 404 for unknown paths.
- **Metadata:** canonical, unique titles/descriptions, full OG/Twitter set, shared 1200×630 `social-card-v2.png` contract intact on every sampled page.
- **robots/sitemap:** live robots.txt byte-identical to the repo file (no Cloudflare-managed additions); sitemap-index → sitemap-0 with 169 URLs, all `https://jrhof.org/`, thank-you/return excluded.
- **`/donate/thank-you/`:** 200, `noindex, follow`, crawl-accessible, analytics execute normally (not robots-blocked — noindex is the correct mechanism here).
- **JSON-LD:** parses on every page; `Organization/NonprofitOrganization` (+EIN), `WebSite`, `WebPage`, `BreadcrumbList` on all pages; `Person` on inductee pages with **R2 portrait URLs** (`media.jrhof.org/...`); `Event` schema with correct `eventStatus` (`EventCompleted` for past events, `EventScheduled` for the 2027 banquet), venue, dates, organizer `@id`; **no `offers`** while registration is closed (correct — no ticket implication).
- **Analytics network behavior:** 1 `gtm.js`, GA4 + AW configs, exactly one `page_view` to `analytics.google.com/g/collect` and one to `google.com/ccm/collect`; Clarity loader + beacons; gallery lightbox pushes `gallery_open`/`gallery_close` with full params (`event_slug`, `event_year`, `gallery_name`, `photo_index`, `photo_count`, `viewport_orientation`) followed by a GA4 collect request. This session's beacons carried `tt=internal` (owner IP rule working).
- **workers.dev:** `jrhof-webapp.jr-and-associates-inc.workers.dev`, `jrhof-webapp.tmco-consulting.workers.dev`, and `jrhof-banquet-registration-remote-preview.jr-and-associates-inc.workers.dev` all publicly serve full site copies. Mitigations: cross-domain canonicals point at jrhof.org and the GTM hostname guard blocks analytics. Gap vs the documented "non-indexable" preview policy: no robots protection — addressed by the new host-scoped `X-Robots-Tag: noindex` rules in `public/_headers` (active on next deploy) and flagged for a Cloudflare Access decision on the banquet preview worker.
- **Media:** all gallery/portrait media on `media.jrhof.org` (R2). One remaining exception: the 2026 golf flyer PDF is still served from the fragile legacy `cdn.jrhof.org` origin (stale TMCO zone) and **does not yet exist** at the same key on `media.jrhof.org` (verified 404 + R2 key check). See §13 Cloudflare actions.

## 4. Source-code findings and fixes applied (Phases 3, 8)

**Defect (fixed): internal navigation borrowed funnel event names.** Five spots emitted registration/gallery funnel events for plain internal navigation:

| Location | Was | Now |
|---|---|---|
| `src/pages/index.astro` (latest-events "Read More", golf) | `event_register_click` | banquet keeps `banquet_info_click`; golf details untracked |
| `src/pages/index.astro` ("View Events Archive") | `event_register_click` | untracked |
| `src/pages/donate/thank-you/index.astro` ("Attend an Event") | `event_register_click` | untracked |
| `src/components/EventArchiveCard.astro` (golf "View event details") | `event_register_click` | banquet keeps `banquet_info_click`; golf untracked (real Register link keeps `event_register_click`) |
| `src/pages/events/index.astro` (gallery page cards) | `gallery_open` | untracked (`gallery_open` reserved for real lightbox opens) |

Rationale: the taxonomy (architecture §6) defines `event_register_click` as a real registration CTA (interim Ads conversion candidate) and `gallery_open` as a lightbox interaction. Internal-nav pollution corrupts funnel analysis and, if those imports are ever promoted, would manufacture fake registration-intent conversions. A semantics rule was added to architecture §6.

**Event-model inventory (verified against GTM v10):** all 16 tagged events flow (donate_click, donate_once/monthly_click, banquet_support_click, banquet_info_click, contact_click, email_click, phone_click, external_partner_click, event_register_click, golf_register_click, gallery_open/close, inductee_profile_click, sponsor_inquiry, donation_complete). Emitted but **untagged in GTM** (silently dropped): `inductee_search` (+`search_term`, `result_count`) and `gallery_next/previous/share/fullscreen` — now documented in the taxonomy; add GTM tags only with a reporting need. The prompt's `begin_checkout`/`view_donation_page` names are covered semantically by `donate_*_click` + `page_view` on `/donate/`; renaming is not recommended (history continuity).

**PII:** no names, emails, phones, Stripe/payment-intent IDs anywhere in the data layer. `transaction_id` = Stripe checkout-session id (opaque, non-PII, used for dedupe only — appropriate). `search_term` is user-typed but is standard search analytics; no PII fields exist to leak. The new CI taxonomy/param allowlist prevents regressions.

**No forms exist on the site** — `form_submit` (GA4 key event, Ads Contact-goal Primary) cannot currently fire from jrhof.org. Harmless but worth knowing when reading zeroed Contact metrics; it becomes real when a sponsor/contact form ships.

## 5. GTM findings (Phase 4 — read-only, authenticated)

- Live version: **v10** (published 2026-07-06 by tj@jrhof.org; content = v8 taxonomy restore + a Conversion Linker edit; **v9 and v10 have no version names** — naming-convention gap only).
- 19 tags / 18 triggers / 18 variables. GA4 config + AW Google tag on Initialization–All Pages with the `Guard | Non-prod hostname` exception; Conversion Linker All Pages; 16 explicit `GA4 | Event |` tags on `CE |` triggers.
- `GA4 | Event | donation_complete` dual trigger confirmed: `CE | donation_complete` (code path, `cs=` + sessionStorage dedupe) **plus** interim `PV | donate thank-you (Stripe referrer, no cs)`.
- **No Clarity tag** (single-loader rule holds), no debug tags, no duplicate/stale tags, Workspace Changes: 0, container quality banner now **"Good"** (was "Urgent" pre-v8).

## 6. GA4 findings (Phase 5 — read-only, authenticated)

- Key events are exactly: `donation_complete` ★ (receiving stream data), `form_submit` ★, `conversion_event_purchase` ★ (dormant), `purchase` (unstarred). **No page_view/first_visit/user_engagement/scroll key events** — the 2026-07-02 reset has held.
- Last 7 days: **0 key events** (no donations tracked this week; consistent with zero paid traffic and low season). Last 30 days: Direct 310 / Organic 60 / **Paid Search 8** sessions — paid collapsed with the campaign stall.
- Internal-traffic rule works (`tt=internal` observed live); the filter deliberately stays **Testing** because the owner IP is dynamic (planned fix: cookie-based `?internal=1` tagging, R9).
- Not re-verified this session (unchanged per earlier logs, unverified today): retention 14 mo, unwanted referrals (stripe/eventbrite), 8 custom dimensions.

## 7. Google Ads findings (Phase 6 — read-only, authenticated, with evidence)

- **Goals (Goals → Summary):** account-default goals attached to campaigns: **Purchase** (2 primary: `donation_complete`, `purchase`; `PURCHASE` secondary), **Contact** (1 primary: `form_submit`), **Engagement** (0 primary), **Page view** (0 primary). Banner: *"2 goals cannot be used for optimization because they do not have any primary conversion actions."* → **This is the exact source of "Your targeted goal is missing a primary conversion action."** All actions are GA4 imports; "Misconfigured" badges = "no recent conversions" volume artifact, not config errors.
- **Auto-apply (Recommendations → Auto-apply settings):** ON for **21 recommendation types** — "Maintain your ads" 7/7 and **"Grow your business" 14/14** (includes bidding changes); 7 recommendations auto-applied 6/29–7/5.
- **Change history (Bidding filter):** Jul 6 10:57–11:00 AM — tj@jrhof.org manually set 3 campaigns to Maximize Clicks. **Jul 8 11:41:28 AM — "Recommendations Auto-Apply": `Grants | Donations` "Bid limit was $2.00… bid strategy type changed from 'Maximize clicks' to 'Maximize conversions'… Target CPA is $4.19"** (same for Brand & Archive and Banquet & Community). Also a Jul 5 12:44 AM auto-apply Target CPA event. Google's automation is in a loop with the owner's corrections.
- **Campaigns:** 3 enabled (Banquet & Community $30/day, Brand & Archive $145.90/day, Donations $90/day), all Search-only, all currently **Maximize Conversions (Target CPA)**, all status **"Bid strategy learning"** (surfaces as *Eligible (Limited)*), **0 impressions / $0.00 cost in the last 30 days** on enabled campaigns. `Grants | Golf | Seasonal` still unbuilt. Auto-tagging/GCLID: ads land on jrhof.org pages directly (no redirects, no UTMs on final URLs) — GCLID preserved.
- **Verdict:** *Eligible (Limited)* is caused by **conversion-starved Smart Bidding** (no policy issue, ads approved, keywords are LSV-constrained but nonzero). The account is not spending any grant money. Remediation in §13 — and it must start with disabling auto-apply, or any bidding fix will be silently reverted again.

## 8. Stripe conversion-tracking findings (Phase 3)

- **Current flow:** donate/monthly Payment Links redirect to `/donate/thank-you/`. The page fires `donation_complete` **only** when a `cs` (checkout session) query parameter is present, with per-session `sessionStorage` dedupe keyed by `cs` (refresh/back-safe). GTM adds an interim page-view trigger (Stripe referrer + no `cs`) so completions aren't lost until the redirect parameter lands. GA4/Ads receive `transaction_id` for dedupe. No value/currency is sent — Payment Links don't expose amounts client-side and inventing values is prohibited.
- **Honest assessment:** this is a **client-side, redirect-based signal, not server-verified payment truth**. A visitor who fabricates `?cs=x` can mint a GA4 `donation_complete`; Ads impact is limited to ad-attributed sessions, and noindex + sitemap exclusion make organic drive-by hits unlikely. As an interim signal for a low-volume nonprofit it is reasonable and correctly implemented; it must not be represented as verified revenue. Stripe remains the financial source of truth (board-reporting reconciliation policy already documents this).
- **Target architecture (already designed, endorsed):** hosted Stripe Checkout + Worker webhook (`checkout.session.completed`, signature-verified) + D1 ledger; thank-you page fires `purchase`/`donation_complete` with `transaction_id=cs` and real value; Measurement Protocol backfill only for reconciliation-identified gaps. This ships with the banquet-registration work (`feature/banquet-registration-checkout`). Do **not** build a fake "verified" signal before then.
- **Outstanding Stripe owner action (A4, still open):** add `?cs={CHECKOUT_SESSION_ID}` to the success URLs of the one-time and monthly donate Payment Links (and raffle/mulligans when their redirects are added); reconcile the orphan active link `buy.stripe.com/eVq8wO…y05`; add metadata to all links.

## 9. Technical SEO findings (Phase 7)

Strong overall; no critical defects. Verified: crawlable/indexable public pages; correct sitemap set (now CI-enforced as exactly built-pages minus 404/noindex routes); consistent apex+https+trailing-slash URLs; unique titles/descriptions; single `h1` per page (CI-enforced); breadcrumbs in markup + schema; alt text everywhere (CI-enforced); explicit image dimensions; R2 media with immutable caching and `/_astro/*` immutable caching; no mixed content; no render-blocking third-party CSS/fonts (system font stack); inline-script + async-loader analytics pattern poses no hydration/CWV risk on this static site; 404 page correct; `security.txt` (expires 2027-06-30) and `llms.txt` accurate; robots.txt repo-owned.

Notes / accepted trade-offs: Workers 307 trailing-slash redirects (platform behavior, canonicals compensate); `Host:` line in robots.txt is non-standard but harmless; ~140 thin inductee bios remain the main organic-growth constraint (the enrichment program in architecture §10.2 is the highest-leverage SEO work); `class-of-<year>` hub pages and `Person.memberOf`/`award` schema depth remain good backlog items; gallery images use generic alt text on lightbox thumbnails (acceptable; media SEO is a later phase).

## 10. Security/privacy findings

- Tight CSP (documented `'unsafe-inline'` trade-off for GTM/Astro), HSTS w/ preload, nosniff, DENY framing, restrictive Permissions-Policy — all verified live.
- No PII in the data layer or analytics beacons (verified live payloads + code audit + new CI allowlist). Consent posture (no banner, granted defaults, US-only audience) matches the documented decision; privacy policy names the actual active tools (GA4 via GTM, Clarity, Cloudflare Web Analytics — all confirmed present).
- Public preview copies (workers.dev ×3) are public-data-only today; noindex headers added (next deploy). The **banquet-registration preview worker** is publicly reachable — keep it data-free until gated with Cloudflare Access (owner action; do not disturb the feature branch).

## 11. Fixes applied in this branch

| File | Change |
|---|---|
| `src/pages/index.astro` | Removed `event_register_click` from internal nav (archive button; golf "Read More" now untracked; banquet keeps `banquet_info_click`) |
| `src/pages/events/index.astro` | Removed `gallery_open` from gallery-page nav cards |
| `src/pages/donate/thank-you/index.astro` | Removed `event_register_click` from "Attend an Event" |
| `src/components/EventArchiveCard.astro` | Golf detail links no longer emit `event_register_click`; real Register CTA unchanged |
| `public/_headers` | Host-scoped `X-Robots-Tag: noindex` for both `jrhof-webapp` workers.dev hosts (verified via `wrangler dev` that non-matching hosts are unaffected; activates on next deploy) |
| `scripts/audit-launch-readiness.mjs` | New CI checks: exactly one GTM loader + noscript + only GTM-WGDF4SBN; no hard-coded gtag.js; no Zaraz; `data-ga-event`/`data-ga-params` taxonomy + parameter allowlists (PII guard); noindex contract (donation routes required, others forbidden, 404 allowed); sitemap set == indexable built pages (both directions); JSON-LD parses on every page; donation_complete `cs=`-gating + sessionStorage dedupe markers present; workers.dev noindex rules present and X-Robots-Tag never under a production matcher |
| `docs/architecture/JRHOF_MARKETING_ARCHITECTURE.md` | Taxonomy: added `inductee_profile_click` (tagged, live), `inductee_search` + `gallery_next/previous/share/fullscreen` (emitted, deliberately untagged); added the funnel-event semantics rule |
| `docs/JRHOF_MASTER_STATUS.md` | Corrected stale claims: Clarity **is** live (env-driven, single loader, no GTM tag); Cloudflare Web Analytics beacon confirmed edge-injected |
| `.env.example` | Clarity comment now reflects production reality and warns that env-less builds silently drop Clarity |
| `docs/CHANGELOG.md` | Entry for this audit |

Prepared but **not** executed (permission-gated, production storage): R2 upload of the 2026 golf flyer — see §13 Cloudflare.

## 12. Validation evidence (Phase 10)

All run on this branch, 2026-07-12:

- `npm run check` — **0 errors, 0 warnings** (after fixing a JSX comment placement introduced during the edit).
- `PUBLIC_CLARITY_PROJECT_ID=v8l2xfpqpy PUBLIC_SITE_URL=https://jrhof.org npm run build` — **172 pages built**, sitemap created.
- `npm run validate` (foundation + extended launch-readiness) — **pass**: 150 inductees, internal links, and the full new analytics/SEO contract across 172 pages. (The new noindex check caught 404.html on first run — expected; the allowance was added deliberately.)
- `wrangler dev` header check — CSP served, **no X-Robots-Tag leak** on a non-matching host; `/donate/thank-you/` noindex present.
- Built-output greps — zero `data-ga-event="gallery_open"` attributes; zero `event_register_click` attributes (none should render while no registration is open).
- Live-site checks per §3 (curl + browser network/console).

## 13. Remaining manual actions (exact steps)

### Google Ads (owner: tj@jrhof.org — do these in order)
1. **Disable auto-apply bidding recommendations** *(do this first; otherwise step 3 will be reverted again)*: Campaigns → Recommendations → **Auto-apply settings** → Manage → under **"Grow your business" deselect all 14** (at minimum everything under Bidding & budgets and "Use optimized targeting"); review the 7 "Maintain your ads" types (removing conflicting negatives / adding broad match are the risky ones for a curated Grants account — recommend deselecting "Remove conflicting negative keywords" too, keeping ad-rotation/RSA-improvement if desired). Screenshot the final state for the changelog.
2. **Clear the goal warning without junk conversions**: Goals → Conversions → Summary → on **Engagement** and **Page view** goal cards choose **Edit goal → remove from account-default use** (leave the underlying actions Secondary; do **not** promote page_view/first_visit/user_engagement). Result: campaigns target only Purchase (donation_complete, purchase) + Contact (form_submit); the "targeted goal is missing a primary conversion action" warning clears.
3. **Restore delivery**: set all three campaigns back to **Maximize Clicks, $2.00 max CPC** (Campaign → Settings → Bidding). Expect impressions within 1–4 days; if still zero after ~4 days investigate ad approval / low-search-volume keywords, not bidding.
4. **Monitor** weekly: search terms → negatives; account CTR ≥ 5%; delivery per campaign (runbook R3).
5. **Graduate later**: after ~30 days of real `donation_complete`/`form_submit` conversions, move `Grants | Donations` (only) to Maximize Conversions per the demotion ladder (architecture §7). Do not set a Target CPA initially.
6. Carryovers still open: AW-17438185594 ownership spot-check; Enhanced-conversions keep/off decision (predates the Phase-6 privacy sign-off); 2nd RSA on Brand & Archive; 2nd ad group per campaign; build `Grants | Golf | Seasonal` (~Jan 2027); Brand & Archive budget $145.90 → planned $120/day.

### GTM (publish-gated; bundle into one version)
- Optional, with a reporting need only: add `GA4 | Event | inductee_search` (DLVs: `search_term`, `result_count`) and/or gallery sub-event tags — hostname-gated CE triggers like the other 16.
- Housekeeping: name versions 9 and 10 retroactively; add a second container admin; keep Clarity out of GTM permanently.
- When Stripe A4 lands: keep both donation_complete triggers for ~30 days, then consider retiring the interim referrer PV trigger to close the spoof/dedupe gap.
- R9 (with next version): cookie-based internal tagging (`?internal=1` → 1st-party cookie → `traffic_type=internal`).

### GA4 (settings-gated)
- Add an annotation: "2026-07-08 Ads auto-apply flipped bidding; 2026-07-12 audit" (change-management rule).
- Keep the internal-traffic filter in **Testing** until R9 ships (owner IP is dynamic); then Active.
- Still pending from July plans: BigQuery daily export link; publish the Search Console report collection; six audiences (architecture §11).
- Do not star anything beyond the current key events; `purchase` gets starred when real ecommerce lands (Phase 4/5).

### Stripe (owner)
- **A4:** set the one-time and monthly donate Payment Links' success URL to `https://jrhof.org/donate/thank-you/?cs={CHECKOUT_SESSION_ID}`; add the same pattern to raffle/mulligans links when trackable completions are wanted. Add metadata to all six links; deactivate or document the orphan link `buy.stripe.com/eVq8wO…y05`.

### Cloudflare (owner / next infra pass)
- **Flyer migration (one command + repo follow-up):** the audited copy is staged at the session scratchpad (`flyer2026.pdf`, sha256 `ef0cb064…68a4b`); run:
  `wrangler r2 object put "jrhof-media-public/events/golf-tournament/2026/golf_tournament_flyer_2026.pdf" --file <flyer2026.pdf> --content-type application/pdf --cache-control "public, max-age=31536000, immutable" --remote` (JR account), verify 200 at `https://media.jrhof.org/events/golf-tournament/2026/golf_tournament_flyer_2026.pdf`, then update the URL in `src/data/events.ts:127` and redeploy. This unblocks retiring `cdn.jrhof.org`/the TMCO stale zone (existing plan).
- After the next deploy: confirm `X-Robots-Tag: noindex` on both `jrhof-webapp.*.workers.dev` hosts and its **absence** on jrhof.org (`curl -I`).
- Gate `jrhof-banquet-registration-remote-preview` with Cloudflare Access before any real data enters it (coordinate with the feature branch owner; nothing was touched in this audit).
- Carryover: Zaraz dashboard confirmation (traffic already proves no Zaraz loads); TMCO duplicate worker/zone retirement; edge cache rule for media.jrhof.org.

## 14. Rollback guidance

- Repo: `git checkout main` (branch `audit/ads-analytics-seo-validation-2026-07` is unmerged; nothing pushed or deployed). Individual fixes are independent — reverting any single file restores prior behavior. The `_headers` rules are inert until deployed; removing the two host blocks reverts them.
- Ads: bidding rollback = re-set Maximize Clicks/$2 (change history documents every prior state); goal-set rollback = re-add Engagement/Page view goals to account-default (actions were never deleted).
- GTM: republish the prior version (v10 → v9/v8 equivalent content).

## 15. Prioritized backlog

**Critical before optimizing Ads:** disable auto-apply (13.1) → remove empty default goals (13.2) → restore Maximize Clicks (13.3) → Stripe `?cs=` redirect (A4).
**High:** merge this branch + deploy (activates workers.dev noindex + taxonomy fixes in prod HTML); flyer R2 migration + `events.ts` repoint; GA4 annotation; weekly search-terms cadence during re-ramp.
**Medium:** inductee bio enrichment batches (the organic moat); GTM housekeeping version (naming, R9 cookie tagging, optional inductee_search tag); BigQuery link + GSC collection publish; Cloudflare Access on the banquet preview worker; second ad groups/RSAs; retire interim donation_complete referrer trigger post-A4.
**Nice to have:** class-of-year hub pages; `Person.memberOf`/`award` schema; image sitemap/media SEO; Bing Webmaster Tools import; gallery sub-event GTM tags.

## 16. Go / no-go assessment

| Track | Verdict | Why |
|---|---|---|
| Organic SEO | **GO** | Technically sound end-to-end; growth is a content problem (bio enrichment), not a technical one. |
| Google Ad Grants traffic | **NO-GO until §13.1–13.3** | Account is delivering zero; auto-apply will revert any fix made before it is disabled. After the three steps: GO. |
| Donation conversion optimization (Max Conversions) | **NO-GO today** | `donation_complete` works but has ~zero volume; Smart Bidding is signal-starved (proven by the stall). Bootstrap with Maximize Clicks; graduate Donations after ~30 days of real conversions. |
| Banquet conversion optimization | **NO-GO until registration ships** | `registration_complete`/webhook-verified `purchase` arrives with the D1/Checkout work (target: live ~Dec 2026 for the Feb 2027 banquet). Interim `banquet_info_click` is diagnostics only. |

## 17. Remediation execution log — 2026-07-13 (Chrome UI, tj@jrhof.org session; no API was available for these surfaces)

| # | Action | Before | After | Verification |
|---|---|---|---|---|
| 1 | **Auto-apply disabled** (Recommendations → Auto-apply settings) | "Maintain your ads" 7/7 + "Grow your business" 14/14 selected; History: "Auto-apply is on for 21 recommendation types" (tCPA type auto-applied 6×, last 7/8) | **0 of 7 and 0 of 14 selected; History: "Auto-apply is on for 0 recommendation types", all 21 rows Off** | Hard reload + History tab re-read. UI quirk: the Manage tab's save-confirmation dialog does not render visibly in this account; the change only persists after the dialog's Save is confirmed (we invoked the rendered dialog's own Save; state survived reload). Recommendations still appear for manual review — nothing can self-apply. |
| 2 | **Engagement goal detached** (Goals → Summary → Edit goal → "Make this an account-default goal" off) | Account-default, 4 of 4 campaigns, 0 primary actions | **0 of 4 campaigns, not account-default; action stayed Secondary ("No change")** | Preview showed "4 modified / No change"; summary card re-read after save |
| 3 | **Page view goal detached** (same path) | Account-default, 4 of 4 campaigns, 0 primary actions | **0 of 4 campaigns, not account-default; actions stayed Secondary** | Same |
| 4 | **Bidding reset — Grants \| Donations** | Maximize conversions, tCPA $4.19 (auto-applied 7/8), $90/day | **Maximize clicks, max CPC $2.00**, $90/day, goals "Account-default: Contacts, Purchases", Enabled | Bidding panel re-opened after save: checkbox on, $2.00 in field |
| 5 | **Bidding reset — Grants \| Brand & Archive** | Maximize conversions, tCPA $4.19, $145.90/day | **Maximize clicks, max CPC $2.00**, $145.90/day, AI Max off, US geo unchanged | Settings summary after save |
| 6 | **Bidding reset — Grants \| Banquet & Community** | Maximize conversions, tCPA $4.19, $30/day | **Maximize clicks, max CPC $2.00**, $30/day, Colorado geo unchanged | Settings summary after save |
| 7 | **R2 flyer migration** (wrangler, JR account) | Object absent from `jrhof-media-public` (404 on media.jrhof.org); repo pointed at fragile `cdn.jrhof.org` | Object at `events/golf-tournament/2026/golf_tournament_flyer_2026.pdf`; media.jrhof.org serves 200, `application/pdf`, `public, max-age=31536000, immutable`, **SHA-256 identical to the audited cdn copy** (`ef0cb064…68a4b`); `src/data/events.ts` repointed; CI guard added (`cdn.jrhof.org` forbidden in built HTML) | `curl -I` + full-download checksum comparison |

Campaign-list state after #4–6: all three campaigns Enabled, Bid strategy "Maximize clicks", statuses "Bid strategy learning" (normal transition; delivery expected within 1–4 days). No budgets, locations, keywords, negatives, ads, or audiences were touched. Nothing was deleted anywhere.

**Not executed:** Stripe success-URL update (§13 Stripe) — dashboard.stripe.com had no active session in the automated browser, no Stripe CLI/key exists on the machine, and credential entry is out of bounds for automation. One operator step (sign in), then set both donate links' after-payment redirect to `https://jrhof.org/donate/thank-you/?cs={CHECKOUT_SESSION_ID}` (Payment Links → link → Edit → After payment → redirect). Until then the GTM interim Stripe-referrer trigger keeps capturing completions.

**Warning-banner status:** the account-level "Add a primary conversion action to your conversion goals (2 goals…)" card still displayed immediately after the goal changes. It is a recommendation card on a daily refresh cycle; the underlying condition is gone (no campaign targets a primary-less goal — each campaign's goal list now reads exactly "Contacts, Purchases"). Re-check after 24–48 h; if it persists beyond that, dismiss it via the card's ⋮ menu — the functional fix is already in place.

**Rollback:** re-enable auto-apply types via the same Manage tab (not recommended); re-attach goals via Edit goal → toggle on; bidding per campaign via Change bid strategy (prior state: Maximize conversions, tCPA $4.19 — preserved here and in Change history); flyer: `wrangler r2 object delete jrhof-media-public/events/golf-tournament/2026/golf_tournament_flyer_2026.pdf --remote` + revert `events.ts` (cdn URL remains live).
