# JRHOF Marketing & Measurement Architecture

**Version:** 2.0 — October 11, 2026 repository reconciliation.
**Scope:** current measurement design and repository behavior, with Google dashboard state verified separately. See [../PROJECT_STATE.md](../PROJECT_STATE.md), [../ANALYTICS.md](../ANALYTICS.md) and the [operations playbook](../playbooks/JRHOF_GA4_GTM_ADS_OPERATIONS.md).

The July 2/July 22 architecture was a dated audit and phased proposal. Its GTM versions, conversion counts, impressions, indexing metrics, inferred enrollment and proposed D1 ledger are not current-state evidence. The complete old document remains in Git history. October 3 Claude marketing reports are also dated observations/proposals; their published tag and campaign settings require a fresh account readback.

## 1. Systems and scope

| System | Identifier / responsibility | Verification limit |
|---|---|---|
| Website | Astro public pages at `jrhof.org`, Cloudflare Workers Static Assets | Main is production source; feature has additional registration Worker |
| GTM | `GTM-WGDF4SBN` | Sole Google loader in public `BaseLayout.astro`; published tags are dashboard state |
| GA4 | Existing property `511268663`, stream `G-VYQQ5E7ZHM` | Preserve history; verify current links, settings, key events and actual delivery |
| Google Ads / Ad Grants | Existing account `850-823-3621`, tag identifier `AW-17438185594` | Verify tag ownership, grant status, goals and campaigns in the current account |
| Search Console | `jrhof.org` properties | Verify ownership, submissions, indexing and security notices live |
| Clarity | `v8l2xfpqpy`, optional public build-time setting | One Astro loader; a previous enabled state is dated evidence |
| Cloudflare Web Analytics | Dashboard-managed observer | Verify injection/activity before claiming active |
| Stripe | Donation Payment Links; feature Checkout Sessions/PaymentIntents | Financial record; registration reads Stripe directly, no D1 |
| Eventbrite | Approved golf registration link | External registration reporting remains separate until a tested migration |
| Board | Feature Google-protected `/board/` and event tools | Operational registration reporting; no Google/Clarity marketing tags |
| Zeffy | Alternative under evaluation | Not connected; see [evaluation](../operations/ZEFFY_EVALUATION.md) |

Do not recreate GA4 properties, GTM containers or accounts merely to repair measurement. Keep credentials, role assignments, detailed account exports and sensitive evidence in the organization’s private runbook.

## 2. Principles

1. Completed donations and registrations are outcomes; navigation and checkout clicks are diagnostics. Do not report a click as money received.
2. GTM is the sole Google loader; `jrhofTrack`/`dataLayer` is the repository event bridge. No parallel gtag or Zaraz Google tags, and no duplicate Clarity loader.
3. Stripe is the current financial source; GA4 is the observed behavioral/attribution layer. Blockers and session/consent behavior can cause undercounting. Do not fabricate a universal expected variance or adjust events to force the reports to match.
4. Public names and event labels may be measured; purchaser/guest names, contacts and dietary notes must not enter marketing events. Private board pages load no analytics.
5. Dashboard proposals, code emission and confirmed external delivery are separate states. A tag publish or a request attempt is not proof of data arriving in reports.
6. New integrations need a named owner, privacy/retention decisions, verification and rollback. No Measurement Protocol backfill or enhanced-conversion setup without a separate approved design and deduplication/attribution tests.

## 3. Implemented measurement flow

```text
Public page -> jrhofTrack/dataLayer -> reviewed GTM tags -> GA4
                                                     -> approved Ads goals
Donation Payment Link -> browser return with live session ID -> donation_complete
Feature Checkout -> Worker checks Stripe paid status -> registration_complete(_test)
Feature board -> reads Stripe directly -> guests/counts/CSV/kitchen sheet
```

No D1 ledger, BigQuery reporting system, Looker Studio board one-pager or automatic Google Chat alerts are implemented by the registration feature. Those can be evaluated separately. API/webhook availability does not make a new payment provider automatically compatible with Google attribution.

## 4. Completion and attribution contracts

### Donations (main and feature)

Approved Stripe donation Payment Links should return to `https://jrhof.org/donate/thank-you/?cs={CHECKOUT_SESSION_ID}`. The browser accepts a syntactically valid `cs_live_…` ID and emits `donation_complete` with `transaction_id`, once per browser session. Test IDs, malformed IDs and ordinary direct visits emit nothing. This path does not retrieve the session from Stripe or verify paid status server-side, and it carries no value. ADR-016 records the accepted marketing-measurement tradeoff. Do not use it as financial proof or claim arbitrary browser events are deduplicated forever across devices.

The public layout appends the `_ga` client ID as `client_reference_id` to Stripe links when a valid cookie is available. That is implemented attribution context; it does not prove the account currently performs a channel-to-payment join or that Ads automatically reads it.

### Registration (unmerged feature only)

The confirmation API retrieves the Checkout Session with the matching runtime credential and verifies `payment_status: paid`. The browser then emits `registration_complete` or `registration_complete_test` with `transaction_id`, `value`, `currency`, `event_slug`, `event_year`, deduplicated per browser session. The API returns no purchaser/guest contacts. Signed Stripe webhooks reread Stripe status and supply diagnostic audit logs; they do not send Google conversion events or write a second ledger.

The form passes a valid GA client reference when available. The five standard UTM fields are validated as bounded campaign labels, persisted per event in browser session storage and stored on Checkout Session/PaymentIntent. Guest edits preserve them. The code does not claim a D1 ledger containing GCLID, referrer or GA session ID. Campaign labels can be self-reported and are not proof of referral.

### Zeffy (proposal)

Zeffy’s documented GA integration tracks visits/sources, not interactions or completed-payment conversions. Native UTM tracking is currently documented only for donation forms, not event tickets. A custom thank-you redirect and completed-payment webhook are useful pieces, but matching payments to browser/ad identity, values and deduplication remains a pilot requirement. Existing Stripe conversion scripts must not be assumed to work for Zeffy.

## 5. Google configuration and governance

These are targets to check, not a claim that they are already published:

- Explicit custom-event tags with documented parameters; no arbitrary regex pass-through.
- One canonical payment outcome per goal; no parallel GA4 import and direct Ads conversion for the same payment.
- Production completion triggers guard `Page Hostname = jrhof.org`; test events never import into production Ads goals. Verify production exclusion with Tag Assistant rather than assuming an event suffix enforces it.
- Keep page views, first visits, engagement, scrolls and routine intent clicks Secondary or unmarked as outcomes. An actual contact submission/call may have a separately approved lead goal; the current contact page is email links, not a delivered form backend.
- Preserve campaign and conversion history; pause/demote instead of deleting.
- Verify the existing GA4 property’s retention, attribution, referral exclusions and internal traffic filters before changing them. Do not activate a filter until its effect has been tested.
- Keep Ads auto-tagging; owned outreach links may use UTMs. Ads should land on substantive public `jrhof.org` content, not private board pages or an automatic redirect to a payment provider.
- Campaign structure, geography, budgets and seasonal dates require current account evidence and owner approval. Older three/four-campaign proposals are not a current deployment declaration.
- Check current official [Ad Grants website policy](https://support.google.com/nonprofits/answer/1657899?hl=en) and [conversion tracking requirements](https://support.google.com/nonprofits/answer/9841491?hl=en) before a launch.
- No AdSense artifacts or unsupported legal/entity claims. Inductee enrichment uses approved source facts, not invented biographies or fixed word-count filler.

## 6. Event taxonomy (repository contract)

`trackingAttrs()` generates `data-ga-event` / `data-ga-params`. The actual attribute allowlists live in `scripts/audit-launch-readiness.mjs`; explicit JavaScript events are documented below as well. Update code, this table and reviewed GTM mappings together when changing the vocabulary. “Emitted” never means “currently published in GTM.”

| Event | Repository trigger / parameters | Measurement role |
|---|---|---|
| `donation_complete` | Live-pattern Stripe session ID on thank-you return; `transaction_id` | Intended donation outcome, no amount/server verification |
| `registration_complete` | Feature paid-verified confirmation; `transaction_id`, `value`, `currency`, `event_slug`, `event_year` | Intended registration outcome; production mapping awaits release/configuration |
| `registration_complete_test` | Feature test-mode paid confirmation, same params | Rehearsal diagnostic; never production Ads conversion |
| `begin_checkout` | Feature departure for hosted Checkout | Diagnostic; not registration completion |
| `donate_click` | Public donate intent links | Diagnostic |
| `donate_once_click`, `donate_monthly_click`, `banquet_support_click` | Donation-page payment links | Diagnostic |
| `event_register_click`, `golf_register_click` | Real registration CTA; never unrelated internal navigation | Diagnostic; external handoff is not paid registration |
| `banquet_info_click` | Banquet information link | Diagnostic |
| `contact_click`, `email_click`, `phone_click` | Contact navigation or mailto/tel links | Contact intent, not proof of delivered inquiry |
| `external_partner_click` | Approved partner outbound links | Diagnostic |
| `inductee_profile_click` | Archive/profile card links | Diagnostic |
| `inductee_search` | Debounced archive search; `search_term`, `result_count` | Diagnostic; review free-text privacy before forwarding |
| `gallery_open`, `gallery_close`, `gallery_next`, `gallery_previous`, `gallery_share`, `gallery_fullscreen` | Gallery bridge; public gallery/event/photo context plus share/fullscreen state | Diagnostic |
| `page_view`, `first_visit`, `user_engagement`, `scroll`, `session_start` | Google automatic/enhanced measurement if configured | Never completed-payment outcomes |
| `file_download`, `form_start`, `form_submit`, `click` | Google enhanced measurement if configured; not native successful payment signals | Diagnostics; auto form detection is not delivered contact proof |
| `sponsor_inquiry`, `volunteer_interest` | Proposed future delivered inquiry workflow; not implemented | Do not advertise as current emitted outcomes |

Allowed HTML attribute parameters: `link_text`, `destination_url`, `link_context`, `cta_location`, `donation_type`, `event_name`, `partner`, `inductee_name`. JavaScript completion/gallery/search events use their explicitly reviewed contracts rather than the HTML attribute parameter allowlist. Do not add purchaser/guest PII.

## 7. Reporting and verification

Stripe and approved external event reports supply money/attendance. The private feature board reads Stripe directly. GA4 supplies observed reach/behavior, Search Console supplies organic visibility, and Ads supplies advertising results. Keep operational guest exports out of public marketing tools.

Before relying on payment attribution, prove the actual path: ad/source visit -> checkout -> successful payment -> correct confirmation -> exactly one intended Google outcome, with correct transaction/value where available. Exclude abandoned, test, malformed/direct return visits and duplicates. Reconcile successful payment counts and refunds separately; never infer that a refund erases an existing Google conversion automatically.

GTM Preview, GA4 DebugView/Realtime, Ads goal inspection and payment records are complementary evidence. Blocked network attempts prove only attempted emission. Permission errors or an inaccessible setting mean unknown, not secure or absent.
