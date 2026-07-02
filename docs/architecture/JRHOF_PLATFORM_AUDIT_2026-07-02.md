# JRHOF Platform Audit & Registration/Payments Architecture

**Date:** 2026-07-02 · **Auditor:** Claude (senior platform review) · **Repo:** `JR-and-Associates-Inc/jrhof-webapp` @ `e060da2`
**Scope:** Whole-repo architecture audit, Stripe donation design, Eventbrite replacement design, V1/V2 roadmap.

---

## 1. Executive recommendation

**Keep the current stack. Do not migrate.** Astro static + Cloudflare Workers Static Assets is the correct long-term foundation for JRHOF. The site's core asset — the inductee archive — is exactly what this architecture is best at: fast, free-to-serve, secure-by-absence-of-server, and low-maintenance.

**Extend it with a small, deliberately boring dynamic layer** to replace Eventbrite:

- Same repo, same Worker: add a `main` entrypoint handling only `/api/*` and `/admin*` (via `run_worker_first`); everything else stays static assets.
- **Cloudflare D1** as the registration system of record (SQLite, SQL exports, free tier is orders of magnitude beyond JRHOF's scale).
- **Stripe Checkout (hosted, redirect)** for all event payments — pre-checkout registration form writes to D1 *first*, then redirects to Stripe. PCI scope stays SAQ A.
- **Stripe webhooks** mark registrations paid/expired/refunded; a reconcile job backstops missed webhooks.
- **Cloudflare Access** (free ≤50 users) protects a minimal server-rendered admin with per-report **CSV downloads** — no custom auth code, ever.
- **Donations stay on Stripe Payment Links** (already live and working). Improve them; don't rebuild them.

Two things must happen **before** any payment code ships (Phase 0): collapse the dual Cloudflare account / dual-deploy topology found in the 2026-07-01 audit, and add CI. Running payment webhooks while a stale duplicate Worker in a second account receives near-simultaneous deploys is an incident waiting to happen.

Verdict on the specific question asked: **Stripe Checkout custom fields are NOT sufficient** (hard limit of 3 custom fields; a 4-golfer team needs 8+ structured fields). The pre-checkout D1 registration form is required, and it is the safest V1.

---

## 2. Current repo architecture assessment

### What's in the repo

| Area | State |
|---|---|
| Framework | Astro 6, `output: 'static'`, no adapter, no server code anywhere |
| Deploy | `wrangler deploy` → Worker `jrhof-webapp`, Workers Static Assets serving `dist/` |
| Content | 150 inductees in `src/data/inductees.json` (~456 KB, build-time), event archive in `src/data/events.ts` (typed TS records) |
| Media | Optimized derivatives on R2 (`media.jrhof.org`); 2026 flyer on fragile `cdn.jrhof.org` (stale TMCO-account R2 custom domain, ssl error) |
| Payments today | Stripe **Payment Links** hardcoded/env-injected in `src/config/site.ts`: one-time donate, (unused) monthly, golf raffle, mulligans |
| Registration today | **Eventbrite** link for golf (`eventLinks.golfRegistration`) |
| Security posture | Excellent static headers in `public/_headers`: HSTS preload, frame-ancestors none, tight CSP already allowlisting `checkout.stripe.com`/`buy.stripe.com`/`donate.stripe.com` in `form-action`/`frame-src` |
| Redirects | 460-line `_redirects` preserving legacy WordPress URLs — good SEO hygiene |
| CI | **None** (`.github/` absent). Deploys are local `npm run deploy` |
| Git history | **2.7 GB local `.git`** (image originals in history; public repo). Board-gated rewrite still pending |
| Docs | Extensive but **stale post-cutover** — `PLATFORM_ARCHITECTURE.md` still says "WordPress remains production" |

### Live Stripe account (verified today, read-only)

Account `acct_1ROoGaAi2cwPLToA` ("JR and Associates"), 6 payment links, 5 active:

| Link | Purpose | Notes |
|---|---|---|
| `donate.stripe.com/00w5kC…` | One-time donation | Redirects to `/donate/thank-you/` ✓; referenced in repo |
| `donate.stripe.com/14AfZg…` | **Monthly donation (subscription)** | Active in Stripe, **not wired up** — `PUBLIC_STRIPE_DONATE_MONTHLY_URL` unset, so the "Give monthly" button never renders |
| `buy.stripe.com/7sYdR8…` | Golf raffle tickets | Name + phone collection |
| `buy.stripe.com/5kQ3cu…` | Golf mulligans | Name + phone collection |
| `buy.stripe.com/eVq8wO…` | Unknown — active but **referenced nowhere** in repo | Likely banquet-support; identify or deactivate |
| `donate.stripe.com/fZufZg…` | Inactive legacy link | Fine |

**Findings:** every link has **empty `metadata`** — payments are only distinguishable by which link/price they came through; no campaign/event tagging; no webhook consumer exists (no server code at all). Reconciliation today is "read the Stripe dashboard and remember what each link was for." That works at current volume but is exactly the gap the board is feeling.

### Assessment

The static site itself is in strong shape: clean component structure, typed content models, good headers, deliberate docs. The weaknesses are operational, not architectural: no CI, dual-account deploy hazard, giant public git history, stale docs, and a payments story that is a pile of unlabeled Payment Links plus Eventbrite. Nothing here argues for replatforming; everything argues for hardening and extending.

---

## 3. Astro + Cloudflare suitability analysis

**Is Astro + Workers the right architecture? Yes, decisively, for this org.**

- **Fit to content:** ~170 pages, updated a handful of times per year, dominated by a permanent archive. Static generation gives ~0ms TTFB at the edge, zero patching burden, and no database to corrupt for the 95% of the site that never changes.
- **Cost:** effectively $0–5/month for hosting regardless of traffic spikes (banquet announcements, obituary traffic to inductee pages). Workers free plan covers 100k req/day; paid ($5/mo) is worth it once payments ship for headroom + D1 Time Travel 30-day restore.
- **Dynamic needs are tiny and bursty:** two events/year, likely <300 registrations/year, <1k donations/year. This is the *worst* case for renting an always-on server or an expensive SaaS, and the *best* case for Workers + D1 (pay-per-request, scale-to-zero).
- **Maintainability:** one repo, one deploy, one dashboard. Board-manageable via TMCO stewardship; no plugin treadmill (explicit anti-WordPress requirement satisfied).
- **Pages Functions?** No. Cloudflare has consolidated on Workers + Static Assets; Pages gets maintenance-mode treatment for new features. The repo is already on the recommended path — do not move it.
- **Astro Cloudflare adapter (SSR)?** Not needed for V1. Keeping `output: 'static'` untouched and putting dynamic routes in a plain Worker `main` keeps the static build's risk profile at zero. (If the admin later wants richer UI, the adapter with selective prerendering is a clean V2+ option.)

The only scenario where I'd recommend leaving: if TMCO stewardship ends and no technical maintainer exists at all. In that case the right move is not WordPress — it's swapping the registration layer for a SaaS (see §12 alternatives) while the static site keeps running unattended, which this architecture makes easy.

---

## 4. Static vs dynamic functionality map

| Function | Static / Dynamic | Where |
|---|---|---|
| Inductee archive (150 bios, portraits) | **Static** (build-time JSON → prerendered) | Astro, R2 media |
| Event archive + galleries | **Static** | Astro, R2 |
| Home, about, contact, privacy, terms | **Static** | Astro |
| Donate page | **Static** (links out to Stripe) | Astro → Payment Links |
| Sponsor info page | **Static** | Astro |
| Event registration **forms** (golf, banquet) | **Static page**, POSTs to API | Astro page + `/api/register` |
| Checkout session creation | **Dynamic** | Worker `POST /api/register` |
| Stripe webhook consumer | **Dynamic** | Worker `POST /api/webhooks/stripe` |
| Registration confirmation page | Static shell + one `GET /api/registration/:id/summary` fetch (name + status only) | Astro + Worker |
| Admin lists, edits, CSV exports | **Dynamic**, behind Cloudflare Access | Worker `/admin/*` |
| Sponsor recognition wall (V2) | **Static at build**, fed from D1 export or committed JSON | Astro |
| Board notification emails | **Dynamic** (webhook-triggered) | Worker → Resend |

Rule of thumb encoded here: *money and PII are dynamic; everything the public reads is static.* No attendee or payment data is ever written into the static build.

---

## 5. Donation system design

**Keep Stripe Payment Links for donations. This is already the right architecture** — Stripe-hosted, PCI SAQ A, zero code. Fix the gaps:

1. **Wire up the monthly link** — set `PUBLIC_STRIPE_DONATE_MONTHLY_URL` (build-time env / Workers Builds variable) to the existing active subscription link. The button code already exists and is dead today.
2. **Add metadata to every Payment Link** (`campaign: donate_page`, `fund: general` / `banquet_support` / `golf_raffle_2027`, etc.) so dashboard exports and the future webhook consumer can classify revenue without guessing from the price ID.
3. **Identify or deactivate** the orphaned active link (`eVq8wO…`).
4. **Apply for Stripe's nonprofit rate** (2.2% + 30¢ vs 2.9% + 30¢) — email Stripe support with the EIN (33-1883765) and 501(c)(3) determination letter. Free money on every transaction.
5. **Enable receipt emails** on all links (verify in dashboard) and set the statement descriptor to `JRHOF.ORG` so donors recognize the charge.
6. **Redirect completion** to `/donate/thank-you/` on all donation links (two already do; make consistent) — the thank-you page is where the GA4 conversion event fires.
7. **Tax acknowledgment:** pure donations should say "no goods or services were provided in exchange" — add to the Stripe receipt custom message or the thank-you page. (Event tickets are different — see §10.)
8. When the registration system ships, donation webhooks (`checkout.session.completed` from Payment Links) land in the same webhook handler and get recorded in D1's `payments` view for one unified CSV — donations then appear in board exports without changing the donor-facing flow.

**Do not** build a custom donation form, embedded checkout, or donor database in V1 or V2. Stripe's dashboard *is* the donor database at this scale.

---

## 6. Event registration system design

### Core flow (both events)

```
Static event page
   └─ Registration form (static HTML/Astro, client-side validation only for UX)
        └─ POST /api/register  (Worker)
             1. Turnstile verification
             2. Server-side validation against event config (prices NEVER from client)
             3. Capacity check (teams/seats remaining)
             4. INSERT registration + attendees + items into D1, status='pending'
             5. Create Stripe Checkout Session:
                  - line_items built server-side from D1 items
                  - metadata: { registration_id, event_id }  (also on payment_intent_data.metadata)
                  - client_reference_id = registration_id
                  - expires_at = now + 24h
                  - success_url = /events/<event>/confirmed/?rid={registration_id}
                  - cancel_url  = /events/<event>/register/?resume={registration_id}
             6. Store session_id on registration, 303 redirect to Stripe
        └─ Stripe-hosted Checkout (card, Apple/Google Pay, Link)
             └─ webhook: checkout.session.completed → D1 status='paid' → board email
             └─ webhook: checkout.session.expired  → D1 status='abandoned'
```

### Golf tournament (Umpire's Cup, ~late June)

Form structure:
- Purchaser: name, email, phone (optional).
- Party size: 1–4 golfers. Per golfer: name (required), shirt size (S–3XL dropdown).
- Add-ons (each an item row + Checkout line item): hole sponsorship (qty + sponsor display name), raffle tickets (qty), mulligan packs (qty), "support the cause" donation (free-amount input, server-clamped $1–$10,000).
- Line items rendered in Checkout exactly as the board reconciles them: `Golfer entry × 3`, `Hole sponsor × 1`, `Raffle tickets × 10`, `Mulligans × 4`, `Donation`.

Notes:
- A team of 4 is simply a registration with 4 attendee rows — no separate "team" object needed; the registration *is* the team. Export groups by registration.
- The existing standalone raffle/mulligan Payment Links stay for day-of/walk-up sales; because they'll carry metadata, they reconcile into the same reports as "unattached add-on" rows.

### Induction banquet (~early February)

Form structure:
- Purchaser: name, email.
- Attendees: 1–6 (single seat up to full table). Per attendee: name, meal choice (`chicken`/`beef` — driven by event config so 2028 can add a vegetarian option without a schema change).
- Add-on: "support the cause" donation.
- Line items: `Banquet seat × 6`, `Donation`.

### Capacity

`events.capacity` (golf: max golfer count, e.g. 144; banquet: max seats). `POST /api/register` counts confirmed + pending-and-unexpired attendees; rejects with a friendly "sold out / N spots left" message. At JRHOF volume, D1's per-database serialization makes oversell effectively impossible; no Durable Object needed.

### Abandoned registrations

- Checkout sessions get `expires_at = 24h` (Stripe max). `checkout.session.expired` webhook flips D1 status to `abandoned`.
- Belt-and-suspenders: a daily Cron Trigger marks any `pending` older than 25h as `abandoned` (covers missed webhooks).
- Abandoned rows are **kept, not deleted** — they're the "started but didn't pay" follow-up list the board asked for, exported separately.
- `cancel_url` carries `?resume=<rid>`: the form offers "pick up where you left off," creating a *new* Checkout session for the same registration (old one expires harmlessly). Pending registrations count against capacity only until expiry.

### Refunds, cancellations, edits, partial changes

| Case | Handling |
|---|---|
| Full refund | Board issues refund **in the Stripe dashboard** (no custom refund UI in V1 — Stripe's is better and safer). `charge.refunded` webhook → status `refunded`, `amount_refunded` recorded, attendees flagged canceled, board notified. |
| Partial refund (e.g., 1 of 4 golfers drops) | Board refunds the golfer-entry amount in Stripe dashboard → webhook records `partially_refunded` + amount; board removes the attendee row in admin (audit-logged). Two clicks total. |
| Cancellation without refund (no-show, comp) | Admin status override with required note; audit-logged. |
| Detail edits (shirt size, meal, name swap, typo) | Admin edit form on attendee rows; every change writes an `audit_log` row (who/when/old→new). No money moves. |
| Attendee self-service edits | **V2** (signed magic link lets purchaser edit names/meals until a cutoff date). V1: "email us" — at 300 registrations/year this is fine. |

### Answers to the specific Stripe questions

1. **Are Checkout custom fields sufficient?** **No.** Hard limit of **3 custom fields** per Checkout Session / Payment Link (text/number/dropdown only). A 4-golfer team needs ≥8 structured fields; a table of 6 needs 12. Even for a single golfer (name + shirt) it's technically possible but leaves data trapped in Stripe as untyped strings — no capacity control, no attendee table, no clean export. Custom fields are fine for what they're used for today (raffle buyer name/phone) and nothing more.
2. **Pre-checkout form stored in D1 before redirect?** **Yes — this is the architecture.** It's the only design that satisfies the stated critical requirement (structured registration data tied to each payment). It also cleanly handles abandonment (row exists before money moves) and gives the board a follow-up list.
3. **Can metadata safely carry event/order IDs?** **Yes.** Limits: 50 keys, 40-char keys, 500-char values — an ID pair (`registration_id`, `event_id`) fits trivially. Rules: metadata is **not** for PII or secrets (visible in dashboard, exports, connected tools — IDs only, attendee details live in D1); set it on **both** the session *and* `payment_intent_data.metadata` so the ID survives onto the PaymentIntent/charge that dashboard finance exports show; also set `client_reference_id` for visibility in the Stripe UI. Metadata is advisory glue — D1 keys on `session_id`/`payment_intent_id` as the authoritative join.
4. **How should webhooks mark registrations paid?** `POST /api/webhooks/stripe`: verify `stripe-signature` (use `stripe-node`'s `constructEventAsync` — the sync variant doesn't work on Workers' SubtleCrypto); INSERT `event.id` into `webhook_events` first (unique constraint = idempotency, Stripe retries duplicate-safe); handle `checkout.session.completed` (→ `paid`, store `payment_intent`, `amount_total`, verify amount matches D1 expectation and flag mismatch instead of trusting), `checkout.session.expired` (→ `abandoned`), `checkout.session.async_payment_succeeded/failed` (future-proofing), `charge.refunded` (→ `refunded`/`partially_refunded`); respond 200 fast; on unmatched `registration_id`, write an `alerts` row and email the operator rather than dropping silently. **Backstop:** webhooks are at-least-once but not guaranteed-delivered-on-time — a daily reconcile cron lists the last 48h of Checkout Sessions from Stripe's API and diffs against D1, auto-healing and flagging discrepancies. This is the auditability requirement, satisfied.

---

## 7. Stripe architecture recommendation

| Option | Verdict | Why |
|---|---|---|
| **Stripe Checkout, hosted redirect** | ✅ **Use for all event registrations** | SAQ A (card data never touches your origin), Stripe maintains the payment UI/methods/receipts/SCA, multi-line-item support renders the reconciliation the board needs, `expires_at` handles abandonment, no Stripe JS on jrhof.org (CSP stays tight — `form-action` already allows it) |
| **Payment Links** | ✅ **Keep for donations + walk-up raffle/mulligans** | Already live; zero code; right tool for fixed simple products |
| Embedded Checkout | ❌ | Adds `js.stripe.com` scripts/frames to every form page and iframe/CSP complexity for zero functional gain here; redirect is fine — donors already leave the site today |
| Payment Element / custom form | ❌ | Most integration work, most maintenance, moves UI burden in-house; still SAQ A(-EP-ish) but strictly worse effort/benefit for a 2-events-a-year nonprofit |
| Stripe Invoicing | ➕ Niche | Useful ad hoc for corporate sponsors who need an invoice to pay by check/ACH — dashboard feature, no code |
| Third-party ticketing SaaS | Fallback only | See §12 |

Supporting choices: **products/prices defined in an event-config table in D1** (not hardcoded); Checkout line items use `price_data` built server-side (dynamic donation amounts need this anyway); Stripe **test mode** + a separate preview Worker + separate D1 database for all development; API version pinned in code.

### Cloudflare primitives

| Primitive | Verdict | Role |
|---|---|---|
| **Workers (same Worker, add `main`)** | ✅ | API + webhook + admin. `run_worker_first: ["/api/*", "/admin", "/admin/*"]`; all other routes keep serving static assets even if the Worker code is broken — blast radius contained |
| **D1** | ✅ | System of record. Relational fits the data (registrations→attendees→items); SQL = trivial CSV exports; free tier (5M reads/100k writes daily) is ~1000× JRHOF's needs; Time Travel restore + nightly `d1 export` to R2 for backups |
| **Turnstile** | ✅ | Free bot protection on the registration form |
| **Cloudflare Access** | ✅ | Admin auth. Zero auth code. Free ≤50 users. One-Time PIN mode = board members just enter their email. Webhook path explicitly excluded |
| **Cron Triggers** | ✅ | Daily abandoned-sweep + reconcile + backup export |
| KV | ❌ V1 | Eventually-consistent; wrong for money. Only later niche: rate-limit counters/config cache — not needed |
| R2 | ➕ minor | Already used for media; add nightly D1 backup dumps. Not part of the payment path |
| Queues | ❌ | Webhook handling is <50ms of work; queues add moving parts with no benefit at this volume |
| Durable Objects | ❌ | Capacity contention doesn't exist at this scale; D1 suffices |
| Pages / Pages Functions | ❌ | Legacy direction; repo is already on the recommended Workers path |
| Email | **Resend** (or Postmark) free tier via API from the Worker | Cloudflare has no native *sending* primitive. Stripe sends payment receipts; Resend sends the registration-detail confirmation + board notifications. Requires SPF/DKIM on a subdomain (e.g. `send.jrhof.org`) — pairs with the DMARC fix already on the backlog |

---

## 8. Data model recommendation (D1)

```sql
-- Event configuration (one row per event instance)
CREATE TABLE events (
  id            TEXT PRIMARY KEY,          -- 'golf-2027', 'banquet-2027'
  type          TEXT NOT NULL CHECK (type IN ('golf','banquet')),
  title         TEXT NOT NULL,
  starts_at     TEXT NOT NULL,             -- ISO 8601
  capacity      INTEGER,                   -- max attendees (golfers / seats)
  registration_opens_at  TEXT,
  registration_closes_at TEXT,
  config_json   TEXT NOT NULL              -- meal options, shirt sizes, prices (cents), add-on catalog
);

-- One row per purchase attempt (a "team" or "table" IS a registration)
CREATE TABLE registrations (
  id                 TEXT PRIMARY KEY,     -- ULID (sortable, unguessable enough w/ signed links)
  event_id           TEXT NOT NULL REFERENCES events(id),
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','paid','abandoned','canceled','refunded','partially_refunded')),
  purchaser_name     TEXT NOT NULL,
  purchaser_email    TEXT NOT NULL,
  purchaser_phone    TEXT,
  amount_expected    INTEGER NOT NULL,     -- cents, computed server-side
  amount_paid        INTEGER,
  amount_refunded    INTEGER NOT NULL DEFAULT 0,
  stripe_session_id  TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  notes              TEXT,                 -- admin free-text
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at            TEXT,
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_reg_event_status ON registrations(event_id, status);
CREATE INDEX idx_reg_pi ON registrations(stripe_payment_intent_id);

-- One row per person attending
CREATE TABLE attendees (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id TEXT NOT NULL REFERENCES registrations(id),
  name            TEXT NOT NULL,
  shirt_size      TEXT,                    -- golf
  meal_choice     TEXT,                    -- banquet
  canceled        INTEGER NOT NULL DEFAULT 0
);

-- One row per priced thing in the order (mirror of Checkout line items)
CREATE TABLE registration_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id TEXT NOT NULL REFERENCES registrations(id),
  kind            TEXT NOT NULL,           -- 'golfer_entry','banquet_seat','hole_sponsor','raffle','mulligan','donation'
  label           TEXT NOT NULL,           -- 'Hole sponsor — "Smith Family"'
  quantity        INTEGER NOT NULL,
  unit_amount     INTEGER NOT NULL,        -- cents
  sponsor_name    TEXT                     -- display name for hole sponsors
);

-- Webhook idempotency + audit trail of everything Stripe told us
CREATE TABLE webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  received_at     TEXT NOT NULL DEFAULT (datetime('now')),
  registration_id TEXT,
  payload_json    TEXT NOT NULL
);

-- Every admin mutation (edits, cancellations, overrides)
CREATE TABLE audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor      TEXT NOT NULL,                -- Cloudflare Access email header
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,                -- 'registration:01J…','attendee:42'
  old_value  TEXT, new_value TEXT,
  at         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Operator attention needed (amount mismatch, orphan webhook, reconcile diff)
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL, detail TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Design points: money in **integer cents**; prices live in `events.config_json` and are stamped onto `registration_items` at creation (historical accuracy when prices change); every report in §9 is a `SELECT` over these six tables; migrations via `wrangler d1 migrations` checked into the repo.

---

## 9. Admin & reporting recommendation

### Minimum admin (V1) — deliberately small

Server-rendered HTML (Hono + `hono/html` in the Worker; no SPA, no build step) behind Cloudflare Access:

1. **Event dashboard** — per event: paid/pending/abandoned counts, seats/golfers remaining, gross/refunded totals, meal + shirt tallies.
2. **Registration list** — filter by status, search by name/email; row → detail.
3. **Registration detail** — attendees, items, Stripe links (deep-link `dashboard.stripe.com/payments/<pi>`), edit attendee fields, status override w/ note. All edits audit-logged with the Access email.
4. **Exports page** — one button per report below.
5. **Alerts** — unresolved reconcile/mismatch items.

That is the whole admin. Refunds happen in Stripe's dashboard; donor management happens in Stripe's dashboard.

### CSV exports (V1) — each a SQL view + streaming endpoint

Formatting for Excel: **UTF-8 with BOM, CRLF line endings, all fields quoted**, filename `jrhof-<event>-<report>-<date>.csv`. Every export includes: registration ID, Stripe payment ID, purchaser name/email, amount paid, payment status, event name, timestamp.

| Report | Contents |
|---|---|
| Paid registrations | One row per paid registration + line-item breakdown columns |
| Pending / abandoned | Follow-up list with emails |
| Golf teams | One row per registration: team members concatenated, counts |
| Individual golfers | One row per golfer (name, shirt, team/registration ref) |
| Shirt sizes | Tally: size × count (+ per-golfer detail sheet) |
| Hole sponsors | Sponsor display name, purchaser, amount |
| Mulligans / Raffle | Qty per purchaser + totals (incl. metadata-tagged standalone Payment Link sales once webhooks flow) |
| Banquet attendees | Name, meal, table/registration ref |
| Banquet tables | One row per registration: attendee count, meals |
| Meal counts | chicken × N, beef × N — the sheet the caterer gets |
| Donations | Registration add-on donations + (V1.5) Payment Link donations via webhook feed |
| Refunds / cancellations | Status, amounts, dates, Stripe IDs |

### Export workflow recommendation

1. **V1: on-demand CSV download from the admin, plus an automatic email to the board alias after each paid registration** (purchaser, items, amount, running totals). This satisfies "nontechnical board" with zero integration risk: the email is the push notification; the CSV is the report. **This is the recommended V1 — ship nothing else.**
2. **Google vs Microsoft:** choose whichever the org standardizes on for the originals archive (that decision is already pending). If genuinely neutral, **Google Sheets** wins for this use: free, link-shareable to board members without tenant/licensing friction, and the Sheets API from a Worker (service-account JWT) is simpler than Microsoft Graph's app-registration + SharePoint permission model. OneDrive/SharePoint only makes sense if the board already lives in M365.
3. **Cadence:** on-demand for V1. In V2, a **weekly scheduled sync** (Cron Trigger → append/replace tabs in one Google Sheet per event) beats nightly — board rhythm is weekly, and fewer runs = fewer silent-failure windows. Per-registration email remains the real-time channel.
4. **Never expose data publicly:** exports exist only behind Access on `/admin/*`; no signed public URLs; no data in the static build; `Cache-Control: no-store` on all admin/API responses; workers.dev + preview URLs for the Worker disabled or Access-gated (the current public preview copies are fine for a static site, not for an API).
5. **Access control:** Cloudflare Access policy = named board emails, One-Time PIN login, 24h sessions; separate service token for the cron; Access excluded on `/api/webhooks/stripe` and `POST /api/register`; the Worker verifies the `Cf-Access-Jwt-Assertion` header (not just trusts the network path) and records the authenticated email in `audit_log`.

---

## 10. Security, privacy & compliance review

**PCI:** Hosted Checkout + Payment Links keep JRHOF in **SAQ A** — card data never touches the Worker. Preserve this: never proxy card fields, never add Payment Element in V1/V2. The existing CSP already restricts `form-action` to Stripe domains — keep that discipline.

**Current headers:** excellent. Post-V1 additions: `Cache-Control: no-store` on `/api/*` and `/admin/*`; keep Turnstile's script host in CSP only on form pages if feasible.

**Webhook endpoint:** signature verification (async variant on Workers), 5-min tolerance, idempotency table, no Access on the path (Stripe can't do Access), rate-limited, returns 200 only after durable write.

**Secrets:** Stripe secret key + webhook secret + Resend key via `wrangler secret` only. Repo is **public** — add secret-scanning (gitleaks) to CI as a guardrail. Publishable keys aren't used at all in the redirect model (a small hidden bonus: no Stripe JS = nothing to leak).

**PII & privacy:** system stores names, emails, phone, shirt sizes, meal choices — low sensitivity but real. Data minimization is already in the design (no addresses, no DOBs). Add: privacy-policy update disclosing registration processing + processors (Stripe, Cloudflare, Resend); retention policy — keep financial records (registrations, amounts, Stripe IDs) ~7 years for the org's books, but purge/anonymize attendee-level detail (shirts, meals, phone) ~12 months post-event via cron; admin access limited to named individuals; audit log covers every read... (write) path.

**Email:** DMARC is still `p=none` (open finding from 2026-07-01). Before Resend goes live: SPF/DKIM for the sending subdomain, then move DMARC toward `quarantine`. Registration confirmations that land in spam generate board support burden — deliverability is a feature.

**Nonprofit-specific compliance (flag for the board, not code):**
- **Quid pro quo disclosure (IRS):** event payments >$75 that are part contribution require a written statement of the fair-market value of goods/services received (dinner, golf). Put FMV language in the Checkout description + confirmation email template (e.g., "Estimated value of dinner: $X; the remainder may be tax-deductible"). Pure donations get "no goods or services were provided."
- **Colorado Charitable Solicitations Act:** confirm the org's registration with the CO Secretary of State is current before expanding online fundraising prominence.
- **Refund policy:** publish a short one on event pages (required by card-network rules for online sales and it preempts disputes).

**Operational security risks (pre-existing, now blocking):**
1. **Dual Cloudflare accounts with duplicate `jrhof-webapp` Workers receiving near-simultaneous deploys.** With payments, a stale duplicate could serve an old webhook handler or leak a divergent API. **Must be resolved in Phase 0.**
2. **`cdn.jrhof.org`** rides a stale zone with `ssl_status: error` — migrate the flyer to `media.jrhof.org`, retire the TMCO zone.
3. **No CI** — payment code without automated checks + protected main is not acceptable; add GitHub Actions (typecheck, build, gitleaks, migrations dry-run) with branch protection.
4. **2.7 GB git history on a public repo** — makes CI slow (use shallow clones) and remains a governance wart; the board-gated history rewrite should land before the repo becomes payment-critical, but it is not a hard blocker.
5. Stale docs (`PLATFORM_ARCHITECTURE.md` et al. describe pre-cutover reality) — update alongside PR 1 so Codex isn't misled by its own repo.

---

## 11. Eventbrite replacement plan

**Why replace:** fees (Eventbrite service + payment fees run roughly 5–8% all-in on a $130 golf entry vs ~2.2–2.9% + 30¢ Stripe-direct — order of $500–900/year saved at current volume), data ownership (attendee data lands in D1/exports instead of a third-party silo), and one fewer external account/brand in the flow.

**Sequencing — banquet first, golf second:**
- The **Feb 2027 banquet** is the simpler product (seats + meals, no add-on zoo) and lands right after V1 can realistically ship. It's the ideal shakedown cruise.
- The **June 2027 golf tournament** exercises the full add-on model with six months of production confidence behind it.

**Cutover checklist per event:** run full test-mode rehearsal (registration → pay → refund → export) with a board member as the tester; open registration on jrhof.org; do **not** create the Eventbrite listing; keep the Eventbrite account dormant (free) for one full cycle as a documented fallback; after the golf tournament completes on the new system, close the Eventbrite chapter. Rollback at any point = publish an Eventbrite link on the (static, instantly deployable) event page.

---

## 12. Risks, tradeoffs & alternatives considered

| Risk | Severity | Mitigation |
|---|---|---|
| **Bus factor / custom-code maintenance** — board can't maintain a Worker if TMCO steps away | High (org-level) | Small dependency surface (Hono, stripe-node, Resend); boring SQL; runbook doc; and an explicit documented exit: the static site runs unattended, and the registration layer can be swapped for a SaaS (below) in a weekend |
| Missed/lost webhooks | Medium | Idempotency table + daily reconcile against Stripe's API + alerts |
| D1 data loss | Medium | Time Travel restore + nightly `d1 export` → R2; the financial source of truth is *also* in Stripe, so worst case is re-keying attendee details |
| Dual-account deploy confusion poisons payment infra | High | Phase 0 hard prerequisite |
| Volunteer admin error (wrong refund, bad edit) | Medium | Refunds only via Stripe's own UI; audit log; status overrides require notes |
| Scope creep (memberships, seating charts, badges…) | Medium | V1/V2 boundary in this doc; anything beyond V2 needs a new decision record |
| Stripe account health (disputes, fraud) | Low | Turnstile, amount clamps, statement descriptor, published refund policy |

**Alternatives honestly considered:**
- **Zeffy / Givebutter** (free nonprofit platforms funded by donor tips): $0 cost is attractive, but the tip-solicitation UX reflects on JRHOF's brand, form flexibility (per-golfer shirts, hole sponsors) is limited, and data lives in another silo. Reasonable Plan B.
- **Ticket Tailor** (~$0.75/ticket + Stripe): genuinely good, cheap, board-friendly. **This is the designated fallback** if custom V1 stalls or stewardship ends — it works with the same Stripe account, so nothing about the donation setup changes.
- **Eventbrite status quo:** highest fees, least data access; the thing being replaced.
- **Full SSR/adapter migration or replatform (Next, WordPress):** rejected — WordPress explicitly excluded; nothing about the requirements needs SSR of public content.

The strategic posture: **Stripe is the irreplaceable vendor; everything else is swappable.** Payment Links, Checkout, D1 exports, and the fallback SaaS all orbit the same Stripe account, so no future decision strands the money or the donor history.

---

## 13. V1 implementation plan (target: banquet registration live by Dec 2026)

**Phase 0 — prerequisites (no payment code until done)**
1. Consolidate to the JR & Associates Cloudflare account: kill the TMCO duplicate Worker + deploy pipeline; migrate flyer off `cdn.jrhof.org`; retire stale zone.
2. CI: GitHub Actions (install → check → build → gitleaks) + branch protection on `main`; deploys move to Workers Builds or a deploy workflow — no more laptop deploys once secrets exist.
3. Stripe hygiene: nonprofit rate application, metadata on existing links, wire monthly button, resolve orphan link, confirm receipt emails.
4. Update stale architecture docs to post-cutover reality.

**Phase 1 — dynamic foundation:** Worker `main` + `run_worker_first`; Hono router; D1 database (prod + preview) + migrations; secrets; `/api/health`; Turnstile.
**Phase 2 — banquet registration:** schema, event config, form page, `POST /api/register` → Checkout session, webhook handler + idempotency, confirmation page, Resend confirmation + board notification emails.
**Phase 3 — admin:** Cloudflare Access, dashboard/list/detail/edit, audit log, all banquet CSVs, alerts.
**Phase 4 — hardening:** abandoned-sweep + reconcile crons, D1 backup export, rate limiting, privacy-policy + refund-policy updates, full test-mode rehearsal with a board member, then live-mode $1 smoke test.

V1 explicitly excludes: golf add-ons (Phase 5), any Drive/Sheets sync, self-service edits, sponsor wall.

## 14. V2 plan (before golf, June 2027, plus quality-of-life)

**Phase 5 — golf event support:** add-on catalog (hole sponsor w/ display name, raffle, mulligans, donation), per-golfer shirt sizes, golf CSVs (teams/golfers/shirts/sponsors), capacity by golfer count.
**Phase 6 — unified money view:** webhook feed for Payment Link donations → donations CSV covers everything; quid-pro-quo FMV language in receipts.
**Phase 7 — board conveniences:** weekly Google Sheets sync (or SharePoint if the org lands on M365), self-service attendee edits via signed magic link with cutoff date, "resume payment" emails for abandoned registrations.
**Phase 8 — public recognition:** sponsor wall on the static site generated from D1 at build time (approved names only); event-day check-in list view (mobile-friendly admin page).

## 15. PR-by-PR breakdown for Codex

Each PR is small, reviewable, and independently deployable. Suggested acceptance criteria in parentheses.

| # | PR | Contents |
|---|---|---|
| 0.1 | `ci: add build/check/gitleaks workflow` | GitHub Actions, shallow clone, branch protection notes (CI green on PR) |
| 0.2 | `fix: serve 2026 flyer from media.jrhof.org` | Update `golf2026.flyer` in `src/data/events.ts`; upload asset (link 200s, cdn host unreferenced) |
| 0.3 | `docs: post-cutover architecture refresh` | PLATFORM_ARCHITECTURE, README, MASTER_STATUS reflect reality + this audit's target architecture |
| 1.1 | `feat: worker entrypoint + run_worker_first` | `worker/index.ts` (Hono), `/api/health`, wrangler `main`+`assets` binding (static routes still asset-served; health 200) |
| 1.2 | `feat: D1 binding + migration tooling` | prod/preview DBs, `migrations/0001` events table, `npm run db:migrate` (migration applies in CI dry-run) |
| 1.3 | `feat: turnstile verification helper + rate limit` | Shared middleware (bad token → 400) |
| 2.1 | `feat: registration schema` | `migrations/0002` registrations/attendees/items/webhook_events/audit_log/alerts + seed `banquet-2027` config |
| 2.2 | `feat: POST /api/register (banquet)` | Validation, capacity, D1 insert, Checkout session w/ metadata + payment_intent metadata + client_reference_id, redirect (test-mode e2e: form → Stripe) |
| 2.3 | `feat: stripe webhook consumer` | Signature verify (async), idempotency, completed/expired/refund handlers, amount-mismatch alert (replayed event = no double-write) |
| 2.4 | `feat: banquet registration form page` | Static Astro page, 1–6 attendees, meals, donation add-on, Turnstile, resume param |
| 2.5 | `feat: confirmation page + summary endpoint` | `/events/induction-banquet/confirmed/` + minimal summary API (no PII beyond purchaser first name/status) |
| 2.6 | `feat: transactional email (Resend)` | Confirmation w/ attendee detail + FMV language; board notification; SPF/DKIM docs (emails delivered in test) |
| 3.1 | `feat: admin shell behind Cloudflare Access` | JWT verification, layout, event dashboard w/ counts + meal tallies |
| 3.2 | `feat: admin registration list/detail/edit + audit log` | Edits write audit rows w/ Access email |
| 3.3 | `feat: CSV export endpoints (banquet set)` | Paid, pending/abandoned, attendees, tables, meal counts, donations, refunds — BOM+CRLF (opens clean in Excel) |
| 4.1 | `feat: crons — abandoned sweep, reconcile, D1 backup to R2` | Daily; discrepancies → alerts + email |
| 4.2 | `chore: hardening + policy pages` | no-store headers, refund policy, privacy update, workers.dev/preview lockdown for the Worker |
| 5.1 | `feat: golf event config + add-on catalog` | `golf-2027` seed, per-golfer shirt sizes, hole sponsor/raffle/mulligan/donation items |
| 5.2 | `feat: golf registration form` | 1–4 golfers, add-ons, resume |
| 5.3 | `feat: golf CSV set` | Teams, golfers, shirts, sponsors, raffle, mulligans |
| 6.x / 7.x | V2 PRs | Payment-link webhook feed; Sheets sync; magic-link edits; sponsor wall; check-in view |

## 16. Final recommendation

**Modify the current stack — do not migrate.** Keep the Astro static core exactly as it is; add the D1-backed registration Worker and Stripe Checkout flow described above; keep donations on Payment Links; put the admin behind Cloudflare Access with CSV exports as the entire V1 reporting story. Execute Phase 0 (account consolidation + CI) first, banquet registration by December 2026, golf by spring 2027, and retire Eventbrite after one successful cycle of each event. Total incremental cost: ~$5/month Cloudflare + Stripe's per-transaction fees (reduced via the nonprofit rate), against roughly $500–900/year in eliminated Eventbrite fees and full ownership of the attendee data the board has never had.
