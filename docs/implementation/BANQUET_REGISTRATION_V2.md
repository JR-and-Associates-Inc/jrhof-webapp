# 2027 Banquet Registration V2 Controls

**Status (2026-07-22): feature branch only; production registration and payment are closed.**

The production `main` branch remains a static Astro site. The public 2027 event-information page is a separate nontransactional change set. This branch contains an unapproved Stripe test-mode Checkout, Cloudflare Worker, proposed D1 schema, verified webhooks, a preview-only Cloudflare Access CSV download, and a secure CLI fallback. No production route, D1 binding, Stripe resource, live key, price, meal description, refund term, or registration opening is authorized here.

## Experience structure

The public event page remains an inductee-centered invitation and never embeds the long form. On the exact feature preview only, its primary registration-review action opens a focused, noindex route:

`/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/`

That route renders the form only when the preview gate is explicitly enabled. Without the gate it fails closed with an unavailable message and no form. An approved production launch would use a clear event-page registration action leading to the dedicated flow; it must not hide the form in an accordion or modal, and it must preserve an obvious path back to event information.

## Launch gates

All items require an identified owner and recorded approval before any production registration build or infrastructure change:

- Board approves ticket price, capacity, registration open/close dates, refund policy/version, meal names and descriptions, donation treatment, and attendee-data retention.
- Every available meal has a stable ID, approved name, non-empty description, availability state, and any approved accommodation note. `assertProductionLaunchReady()` rejects missing descriptions.
- Board approves the Terms, Privacy, accuracy, and refund acknowledgements. No consent box may be preselected.
- Legal/privacy review approves collection of purchaser details, attendee names, dietary notes, seating requests, payment status, and retention/deletion periods.
- Production resources are separate from preview: D1 database, Worker/routes, Access application, Access group/allowlist, Stripe webhook endpoint, test/live secrets, alerts, backups, and rollback owner.
- Server-authoritative price, capacity, event status, deadline, meal availability, webhook signature verification, replay protection, and payment reconciliation all pass tests against the release candidate.
- Production UI is closed by default and requires an explicit approved launch flag plus `configuration_status=production_approved`, `registration_open=1`, approved refund-policy version, and complete meal descriptions.
- Board approves the dedicated registration route, event-page call to action, closed/sold-out/canceled states, and the point at which the noindex directive is removed.
- Cloudflare Access protects both CSV routes before they receive production data. An unauthorized request fails before any database read.
- Board approves who can export, where files may be stored, how long they are kept, and who performs deletion.
- TJ authorizes production deployment after reviewing the exact diff, test evidence, monitoring, and rollback steps.

## Preview procedure

1. Copy `.dev.vars.example` to ignored `.dev.vars` and use only `sk_test_`/`whsec_` values.
2. Apply `migrations/proposed` only to a disposable local D1 database.
3. Build with `BANQUET_REGISTRATION_PREVIEW=true` and an explicitly supplied illustrative preview price. That value is not an approved price.
4. Run Wrangler with `wrangler.banquet-preview.jsonc`; never use production `wrangler.jsonc` for the feature.
5. Configure Access as described in `CLOUDFLARE_ACCESS_EXPORT.md` before reviewing exports.
6. Use Stripe test cards only. Confirm paid state from the verified webhook/D1 record—not from the browser success URL.
7. Run `npm run check`, `npm run build`, `npm run validate`, `npm test`, and `git diff --check`.

The remote preview config is historical test infrastructure and is not authorization to deploy it again. Do not apply migration `0004` remotely or deploy this branch without explicit approval.

## Emergency disable and rollback

For a future approved production launch, the first response to a registration incident is to close the server event flag (`registration_open=0`) and disable the public launch flag. Then disable the Worker route or roll back to the last static production Worker version. Do not delete D1 or Stripe records during containment. Revoke/rotate affected secrets, preserve privacy-safe audit evidence, and notify the designated owner.

The original feature-branch starting point is preserved by the annotated tag `banquet-registration-checkout-start-2026-07-22` at `870dd4ec7f4ff65d4b1f3c4123f86dd7aa493b53`. The branch history was reconciled only with ordinary merge commits; it was never force-pushed or rewritten. Rollback of development work can use the tag without altering the current branch.

## Data-handling decision register

| Decision | Current preview behavior | Production decision required |
|---|---|---|
| Purchaser contact | Stored in preview D1; excluded from logs | Purpose, access list, correction process, retention, deletion owner |
| Attendee name | Stored in preview D1 and protected exports | Purpose, access list, retention, deletion owner |
| Dietary note | Optional plain text, 300 characters; guidance limits it to relevant accommodation details | Whether to collect, staff visibility, retention, secure deletion |
| Seating request | Optional plain text, 300 characters; open-seating notice shown first | Operational owner and deletion timing |
| Stripe identifiers | Stored only for reconciliation; omitted from board CSV | Retention and access controls |
| Webhook payload | SHA-256 digest only; raw payload not persisted | Incident retention and monitoring policy |
| Export audit | Subject digest, type, scope, count, timestamp; no email/IP/PII | Retention and review owner |
| CSV files | Manual download; no-store response; operator must store/delete safely | Approved storage destination, access list, retention period |
| Google Sheets | Not implemented | Workspace destination, access list, retention, retry behavior, responsible operator |

## Explicitly deferred

There is no Google Sheets webhook or service account. There is no production registration route, automatic confirmation, tax determination, live Stripe charge, production D1 migration, or approved refund workflow. Browser redirects and analytics events must never be treated as proof of payment; any future primary banquet conversion must originate from server-confirmed paid state with a safe deduplication reference.
