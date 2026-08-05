# 2027 Banquet Registration V2 Controls

**Status (2026-08-05): board-preview candidate deployed on isolated Workers with Stripe test mode and Cloudflare Access; Chicken and Steak are confirmed choices; production registration and payment are closed.**

The production `main` branch remains a static Astro site. This branch contains an unapproved Stripe test-mode Checkout, Cloudflare Worker, proposed D1 schema, verified webhooks, a server-authoritative guest form, a preview-only Cloudflare Access board dashboard and CSV downloads, first-touch UTM reporting, a campaign-link/QR builder, and a secure CLI fallback. No production route, D1 binding, Stripe resource, live key, price, meal description, refund term, or registration opening is authorized here.

## Experience structure

The public event page remains an inductee-centered invitation and never embeds the long form. On the exact feature preview only, its primary registration-review action opens a focused, noindex route:

`/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/`

That route renders the form only when the preview gate is explicitly enabled. Without the gate it fails closed with an unavailable message and no form. An approved production launch would use a clear event-page registration action leading to the dedicated flow; it must not hide the form in an accordion or modal, and it must preserve an obvious path back to event information.

The static page does not carry its own price or meal list. It first reads `GET /api/banquet/config`; the Worker returns only test-mode event configuration and current availability from D1. Checkout remains disabled if that response is missing, malformed, closed, scheduled, sold out, zero-priced, or not explicitly marked `preview_unapproved`. The same D1 values are re-read and revalidated when the form is submitted.

Approved board viewers use `/board/banquet/` on the dedicated `jrhof-banquet-registration-board-preview` Worker. Cloudflare Access Free protects the entire board origin with one-time PIN and an exact three-address allowlist. The public registration Worker redirects board routes there, while Stripe's signed test webhook remains reachable only on the separate public Worker. The dashboard endpoint verifies the signed Access JWT and the same exact Worker-side email allowlist before reading D1, returns aggregate operational data only, and writes a privacy-safe access audit. Names, contact details, dietary notes, seating notes, and Stripe IDs remain confined to the separately audited CSV endpoints.

The registration route records only the first five standard UTM fields for the browser session. The board campaign builder creates a tagged link and local QR image on demand. No person-level advertising identifier is stored in D1, and no contact or attendee data is sent to analytics. Short `jrhof.org/go/...` redirects are deferred until final production destinations and campaign names are approved.

## Launch gates

All items require an identified owner and recorded approval before any production registration build or infrastructure change:

- Board approves ticket price, capacity, registration open/close dates, refund policy/version, Chicken and Steak preparation/descriptions, donation treatment, and attendee-data retention.
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
2. Apply `migrations/proposed` locally by default. An authorized remote rehearsal may apply them only through a preview config to `jrhof-banquet-registration-preview`, never through production `wrangler.jsonc`.
3. Build with `BANQUET_REGISTRATION_PREVIEW=true`. Price, menu, capacity, attendee limit, registration window, and refund-policy status come only from the preview D1 fixture.
4. Run Wrangler with `wrangler.banquet-preview.jsonc`; never use production `wrangler.jsonc` for the feature.
5. For the deployed remote rehearsal, use both `wrangler.banquet-remote-preview.jsonc` and `wrangler.banquet-board-preview.jsonc`; configure whole-origin Access as described in `CLOUDFLARE_ACCESS_EXPORT.md` before reviewing board data.
6. Use Stripe test cards only. Confirm paid state from the verified webhook/D1 record—not from the browser success URL.
7. Run `npm run check`, `npm run build`, `npm run validate`, `npm test`, and `git diff --check`.

The two remote preview configs are isolated test infrastructure, not standing authorization for production. On 2026-08-05, authenticated preflight and deployment confirmed both Workers have no production route or custom domain, use only the isolated preview D1 database, and reject live Stripe keys. The public Worker handles guest registration and signed Stripe test webhooks; the Access-protected Worker handles board review. Production remains a separate approval and deployment phase.

## Server-confirmed test funnel

The browser return is observational until the same-origin preview Worker reads a D1 reservation that the verified Stripe webhook transitioned to the exact paid/reconciled state. The feature stores only its opaque registration reference in same-tab session storage before redirecting to Stripe and never places a Checkout Session ID in the return URL or analytics. `GET /api/banquet/confirmation` returns only `processing`, `not_completed`, or a confirmed response containing the opaque transaction reference, paid cents, and currency.

Only that confirmed response can cause the browser to push `registration_complete`. The event is session-deduplicated and limited to the opaque transaction reference, value, currency, event ID, paid status, and `test_mode: true`; it contains no contact, attendee, meal, dietary, seating, or Stripe identifiers. Preview-hostname GTM guards prevent delivery to the production GA4 and Ads tags. A production GTM/GA4/Ads mapping, Primary-conversion decision, and launch are separate board/TJ approvals.

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
| Board access audit | Subject digest, access type, timestamp; no email/IP/registrant PII | Retention and review owner |
| Export audit | Subject digest, type, scope, count, timestamp; no email/IP/registrant PII | Retention and review owner |
| Campaign attribution | First-touch UTM labels only; no ad click ID or person-level identifier | Naming convention and reporting owner |
| CSV files | Manual download; no-store response; operator must store/delete safely | Approved storage destination, access list, retention period |
| Google Sheets | Not implemented | Workspace destination, access list, retention, retry behavior, responsible operator |

## Explicitly deferred

There is no Google Sheets webhook or service account. There is no mutable admin console, automated refund action, attendee check-in mutation, production registration route, production confirmation endpoint, tax determination, live Stripe charge, production D1 migration, or approved refund workflow. Browser redirects must never be treated as proof of payment; the feature-only completion signal is gated by server-confirmed paid state and a safe deduplication reference.
