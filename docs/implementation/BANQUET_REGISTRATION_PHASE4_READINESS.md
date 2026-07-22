# Banquet Registration Phase 4 Readiness Evidence

## Review record

- Timestamp: `2026-07-04 19:31:49 MDT`
- Preview-enablement validation: `2026-07-05 09:04 MDT`
- Candidate commit inspected: `0374a33`
- Branch: `feature/banquet-registration-checkout`
- Branch synchronization: clean, `0` ahead / `0` behind after fetch
- Evidence scope: setup readiness and non-credential validation only
- Synthetic registration records created: none
- Local reservation IDs recorded: none

No names, email addresses, phone numbers, attendee details, raw webhook payloads, Stripe secrets, payment-method details, or screenshots are recorded here.

## Feature preview behavior

The registration component is rendered only for `banquet-2027` when either:

- Astro is running in development mode (`import.meta.env.DEV`), or
- the static build receives the exact build-time value `BANQUET_REGISTRATION_PREVIEW=true`.

`BANQUET_PREVIEW_TICKET_PRICE_CENTS` supplies an explicit synthetic price for a local test review but does not enable the component by itself. The public feature-branch UI preview forces this value to `0` and displays “price pending.”

The review URL is:

`https://feature-banquet-registration-checkout-jrhof-webapp.jr-and-associates-inc.workers.dev/events/induction-banquet/2027-hall-of-fame-induction-banquet/`

The repository build command now applies the preview variables without requiring a broad Cloudflare dashboard variable. When Workers Builds supplies `WORKERS_CI=1` and the exact `WORKERS_CI_BRANCH=feature/banquet-registration-checkout`, `scripts/build-site.mjs` forces:

```text
BANQUET_REGISTRATION_PREVIEW=true
BANQUET_PREVIEW_TICKET_PRICE_CENTS=0
```

For every other Cloudflare branch, including `main`, the script deletes both variables before invoking Astro. This is fail-closed if a preview variable is accidentally configured more broadly. Local builds remain disabled by default and can still be enabled explicitly for review.

On 2026-07-05, the repository owner approved showing the draft at this unlinked feature URL without Cloudflare Access. The exception is limited to the non-promoted UI-only artifact: it has no live Stripe secrets, production D1 binding, write-capable banquet API, production route/domain, or public navigation/homepage/sitemap link. Stripe Checkout E2E remains localhost-only. Access is still required before adding PII, secrets, admin routes, or write-capable bindings to any preview.

## Exact local UI command

For a UI-only Astro development review, the `DEV` guard enables the form automatically:

```bash
BANQUET_PREVIEW_TICKET_PRICE_CENTS=0 npm run dev -- --host 127.0.0.1
```

Open:

`http://127.0.0.1:4321/events/induction-banquet/2027-hall-of-fame-induction-banquet/`

For the full local Worker/D1/Stripe test flow, use the commands in `BANQUET_REGISTRATION_E2E.md`; that flow requires an ignored `.dev.vars` containing real temporary test-mode values.

## Safe board-preview configuration

1. Keep the Workers Builds build command as `npm run build`. The repository script owns the exact feature-branch condition.
2. Keep the existing non-production version-preview workflow; do not promote the feature version to production.
3. The unlinked feature alias may remain reachable without Access only while it stays UI-only and contains no PII, secrets, admin routes, or write-capable bindings.
4. Keep production `wrangler.jsonc` unchanged. Do not use `wrangler.banquet-preview.jsonc` remotely; it is local-only and has no approved remote D1 resource.
5. Add no Stripe secrets or D1 bindings to the static board preview. It is UI-only; checkout E2E remains localhost-only.
6. Verify the draft appears only on the existing 2027 event page, a default/main build omits it even if preview variables are present, and `jrhof.org` remains unchanged.

## Credential and tooling readiness

| Check | Result | Evidence |
| --- | --- | --- |
| Ignored `.dev.vars` present | BLOCKED | File is absent. |
| Stripe test secret available locally | BLOCKED | No `.dev.vars`; no value was read or requested. |
| Stripe webhook signing secret available locally | BLOCKED | No `.dev.vars`; no value was read or requested. |
| Stripe CLI available | BLOCKED | `command -v stripe` returned no executable. |
| Production Worker config unchanged | PASS | No diff from branch point for `wrangler.jsonc`. |
| UI-only preview Access decision | PASS | Repository owner approved the unlinked feature preview without Access on 2026-07-05; it has no PII, live secrets, production D1, or write-capable API. |
| Feature build boundary configured | PASS | Exact Cloudflare branch match forces the draft flag and a zero price-pending display; all other branches remove both preview variables. |

## E2E scenario outcomes

Per the Phase 4 stop rule, no Stripe-dependent scenario was attempted and no result is inferred.

| Scenario | Outcome | Local reservation ID | Reason |
| --- | --- | --- | --- |
| Successful Stripe test payment | BLOCKED | none | Test secret and Stripe CLI unavailable. |
| Browser cancel/back from Stripe Checkout | BLOCKED | none | No Checkout Session could be created. |
| Deliberate test-session expiry | BLOCKED | none | No `cs_test_` session could be created. |
| Stripe webhook forwarding/signature verification | BLOCKED | none | Stripe CLI and temporary `whsec_` unavailable. |
| Local D1 payment reconciliation | BLOCKED | none | No real test-mode payment/webhook occurred. |

Automated request-limit, safe-error, idempotency, reconciliation, expiry, and livemode tests remain valid engineering evidence, but they are not represented as Stripe E2E results.

## Non-credential validation results

| Validation | Outcome |
| --- | --- |
| `npm run check` | PASS — 0 Astro/TypeScript diagnostics |
| Production-default `npm run build` | PASS — 172 static pages |
| `npm run validate` | PASS — foundation and launch-readiness audits |
| `npm run banquet:test` | PASS — 22 Workers-runtime tests |
| Build-boundary unit checks | PASS — default/local, exact feature, `main`, other branch, and missing-branch cases |
| Exact feature-branch build | PASS — one guarded form on the existing 2027 event page with price pending and checkout disabled |
| Simulated Cloudflare `main` build with preview variables supplied | PASS — guarded form omitted |
| Local D1 migration validation | PASS — local resource only; no migrations pending |
| Wrangler deploy dry-run | PASS — no upload or deployment |
| Production-default draft leak check | PASS |
| Production `wrangler.jsonc` branch-point comparison | PASS — no diff |
| `git diff --check` | PASS |

## Unresolved launch gates

All unchecked items in `BANQUET_REGISTRATION_REVIEW_CHECKLIST.md` remain unresolved. In particular, no board decision is inferred for price, capacity, public copy, receipts, refunds, cancellations, privacy, retention, operational ownership, or launch. CSV export, email, production migrations, live credentials, public registration, and production routing remain out of scope.
