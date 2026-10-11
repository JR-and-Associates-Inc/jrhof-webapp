# JRHOF GA4 / GTM / Ads Operations Playbook

**Version:** 2.0 — October 11, 2026 repository reconciliation.
**Audience:** named organization operators. Read [measurement architecture](../architecture/JRHOF_MARKETING_ARCHITECTURE.md), [ANALYTICS.md](../ANALYTICS.md) and [PROJECT_STATE.md](../PROJECT_STATE.md) first.

This is a current operating checklist, not a fresh Google dashboard audit. July and October 3 version/campaign/conversion reports are dated evidence. Do not replay their changes without current readback and owner authorization.

## 1. Accounts and access

Retain GTM `GTM-WGDF4SBN`, GA4 property `511268663` / stream `G-VYQQ5E7ZHM`, existing Ads account `850-823-3621`, and Search Console ownership/history. Check the relationship of `AW-17438185594` to the active account in the current dashboard. Clarity `v8l2xfpqpy` is optional through its Astro component; Cloudflare Web Analytics is separate dashboard-managed injection.

Use named logins and minimum required privileges, with a designated backup and organization-controlled recovery. Review access each January and on volunteer departures. Do not assume a group address is a shared administrator login. Record memberships and credentials privately.

## 2. Naming and change management

- Events/parameters: snake_case from architecture §6 and the code allowlist.
- GTM: `GA4 | Event | <name>`, `CE | <name>`, `DLV | <param>`, `Guard | <purpose>`; reviewed version notes with date and evidence.
- Owned outreach: lowercase descriptive UTM labels without personal information. Keep Google Ads automatic tagging; do not add manual UTMs to Ads final URLs.
- New event: code emission first, reviewed GTM mapping second, outcome/import definition third; verify each separately.
- Preserve history. Roll back tags through a prior container version; pause/demote campaigns or goals instead of deleting their history.
- Record external configuration changes with a date, system, named owner and evidence in the private runbook. Never claim a planned GTM version was published.

## 3. QA before relying on reports

### Public pages

1. Check `/`, `/donate/`, an inductee page and a public event page: one GTM loader, no second direct gtag/GA/Ads or Zaraz Google loader.
2. Check one tracked CTA and one gallery interaction: correct event/params in dataLayer and the intended GTM tag once.
3. Confirm no CSP errors blocking required destinations. A blocked request proves attempted emission only; confirm accepted delivery in DebugView/Realtime.
4. Confirm optional Clarity/beacon load only once. Do not inject a second observer to make reports appear.
5. Check production hostname guards and test traffic exclusion. Private board pages must load no marketing tags.

### Donations

- Confirm each approved Payment Link’s actual redirect includes `/donate/thank-you/?cs={CHECKOUT_SESSION_ID}`.
- A live-pattern ID emits `donation_complete` once per browser session; test/malformed IDs and ordinary direct visits do not. Browser behavior is not server payment proof. Do not fabricate an ID and describe that as an end-to-end payment test.
- Use a separately authorized live donation/refund only when needed; confirm payment record, return event, GA4 delivery and Ads mapping. Account latency means an immediate Realtime event alone is not Ads attribution proof.
- Current donation event has no amount; do not invent a monetary value.

### Registration feature

- Use fictional guest details and Stripe test mode. Worker tests use fake Stripe, not real payments.
- Confirm paid verification, `registration_complete_test`, eight guest rows, actual amount/currency, signed webhook and refund/attendance behavior.
- Test events must not fire a production Ads conversion tag. Production `registration_complete` mapping needs a deliberate live launch and approved end-to-end verification.
- Check campaign/QR labels on the created order and exports. Auto-tagging and stored GA client reference do not alone prove completed-payment advertising attribution.
- If evaluating Zeffy, use its [pilot acceptance checklist](../operations/ZEFFY_EVALUATION.md); current Stripe return code does not cover it automatically.

## 4. Cadences

- Weekly: delivery sanity, search-term/policy review and unusual changes.
- Monthly: inspect actual Primary goals, completed outcomes, current Ad Grants compliance, search/indexing issues and payment-versus-tracked counts. Recheck official policies rather than treating old thresholds or budgets as permanent.
- Quarterly: access, ownership, filters/retention, approved seasonal campaign schedule and consent/privacy behavior.
- Annually and after ownership changes: full signed-in account audit, recovery/backup review and updated dated evidence. Repository checks cannot establish dashboard permissions.

## 5. Incident runbooks

**Duplicate views/events:** compare loaders and GTM firing; remove the duplicate through reviewed change. Do not hide duplicates with filters.

**Inflated conversions:** inspect auto-event imports, intent goals and duplicate GA4/direct Ads tags. Keep page-view-class events out of Primary outcomes. Preserve history by demoting rather than deleting.

**No advertising delivery:** read exact account/ad/keyword/policy status and change history. Diagnose before changing bidding, budgets or campaigns; old campaign metrics are not current evidence.

**Tracking flatline:** inspect dataLayer, hostname guards, GTM version, CSP and accepted Google delivery. A gallery event in dataLayer without a request indicates mapping/transport investigation, not automatic need for more loaders.

**Payments and analytics differ:** reconcile identical time windows/types, failed/unpaid/test orders, return visits, blockers, duplicates and refunds. Stripe remains the financial record. Do not enable Measurement Protocol backfill or enhanced conversions without a separately approved attribution/privacy/deduplication design.

**Ad Grants warning:** read the specific current policy notice, prepare a minimal repair with owner approval and retain evidence for re-review. Do not make promises about eligibility based only on a working payment form.

## 6. Board reporting

Operational attendance/meals come from the registration feature’s Stripe-backed board and guest CSVs. Golf still uses its approved external service. Money comes from payment records; behavior from GA4; organic visibility from Search Console; Ads results from the active account. Zeffy records would require a tested separate integration or its own administration.

No Looker Studio one-pager, D1 ledger, automatic Sheets/Drive sync or Chat alerts are currently implemented by the feature. If preparing a manual report, record the date/window, source and tracked share without claiming a universal expected percentage. Refunds and net/gross definitions must be explicit. Exports contain personal information; limit access and follow the board’s retention policy.

## 7. UTM registry

The feature’s share tool offers newsletter/email, board outreach, CHSBUA/partner referral, print/QR and social presets. Campaign is `banquet-2027`; content names the invitation, without names/emails/phone numbers. `CHANNELS` in `src/lib/registration-attribution.ts` is the preset source of truth, used by `src/pages/board/[eventId]/share.astro`. The five standard labels are capped at 80-character lowercase values by validation.

Older Stripe-hosted `jrhof.org` / `website` decoration is not reliable event attribution. The GA client-reference bridge and feature UTM metadata are distinct mechanisms. Zeffy currently documents native UTM support only for donation forms, not ticketing.

## 8. Standing prohibitions

No second Google loader, Zaraz Google tools, AdSense artifacts, arbitrary event pass-through, invented lead values, guest PII in measurement, test orders in production Ads goals, shared logins, or unsupported contact-delivery claims. Analytics is never the money/attendance ledger. No paid campaigns, external messages, production changes or dashboard configuration changes without the relevant owner’s authorization.
