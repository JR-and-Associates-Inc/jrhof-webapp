# Repository Security Audit

**Date:** July 2, 2026
**Scope:** Tracked repository, static production surface, dependency metadata, disclosure files, and handoff controls

This is a maintainer security review, not a penetration test of Cloudflare, Stripe, Google, Eventbrite, or other vendor accounts. No dashboard state, payment flow, DNS, or production data was changed.

## Results

- No private-key blocks or common live credential/token patterns were found in tracked text files.
- `.env*`, Wrangler state, logs, IDE state, build output, and local photo drops are ignored. `.env.example` contains public build-time values only.
- The current site is fully static: no request-time Worker code, database, session, webhook, credential, or server-side form endpoint exists in this repository.
- JSON-LD is serialized and escapes `<` before `set:html`; external links reviewed use `noopener noreferrer`; Stripe URL mutation is restricted to exact Stripe hostnames.
- The production header baseline includes HSTS, a restrictive CSP, frame denial, MIME sniffing protection, a strict referrer policy, and a restrictive permissions policy.
- GTM container `GTM-WGDF4SBN` is the single Google loader. The public privacy copy now matches that implementation, and current docs prohibit Google tools in Zaraz.
- `SECURITY.md` now defines private reporting scope and safe-testing boundaries. `public/.well-known/security.txt` now includes the role contact, canonical URL, policy URL, preferred language, and an expiration less than one year away.
- `npm audit fix` applied nonbreaking transitive updates that removed the moderate nested-YAML advisory and stale packages from the lockfile.

No reportable repository vulnerability was validated in the static production path.

## Accepted/deferred risk

`npm audit` still reports two low-severity instances of the esbuild Windows development-server arbitrary-file-read advisory through Astro. npm's offered remediation is a forced upgrade to Astro 7, a breaking major release. The production site is a prerendered static build and does not expose the Astro development server. Do not run an untrusted local site through `npm run dev`, especially on Windows. Address the advisory in a separate Astro 7 upgrade with migration review and the full validation suite; do not use `npm audit fix --force` in this handoff PR.

The CSP currently permits inline scripts/styles required by the existing Astro/GTM implementation. Removing `'unsafe-inline'` would require nonce/hash architecture and coordinated GTM/Clarity testing, so it is not a hygiene-only change.

## Operational follow-up

- Confirm branch protection and required status checks in GitHub after this PR lands.
- Keep named account owners, MFA/recovery details, API tokens, registrar information, and incident contacts in an access-controlled runbook, not Git.
- Re-review security before adding the planned Stripe Checkout + Worker + D1 registration runtime. That project introduces PII, secrets, webhooks, access control, retention, reconciliation, and stateful rollback requirements that do not exist today.
- Re-run `npm audit`, secret scanning, static checks, build, generated-output validation, and production-header verification during dependency/platform upgrades.
