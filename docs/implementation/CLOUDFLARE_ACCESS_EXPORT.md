# Cloudflare Access Setup for Preview Board Reports

**Deployed preview only. Do not attach a production route or reuse this application for production without explicit approval.**

The board reports use a dedicated Worker origin so Cloudflare Access can protect the whole site without blocking Stripe's signed webhook deliveries:

- Public registration and webhook origin: `https://jrhof-banquet-registration-remote-preview.jr-and-associates-inc.workers.dev`
- Access-protected board origin: `https://jrhof-banquet-registration-board-preview.jr-and-associates-inc.workers.dev`

Both Workers share only the isolated preview D1 database and accept Stripe test mode only. The public Worker redirects every board page, dashboard request, and CSV request to the protected origin. Stripe sends webhooks only to the public origin.

## Access application

1. Use the Cloudflare Zero Trust Free plan. The current account is active at `$0/month`; no paid Access feature is required for this three-person preview.
2. Create one self-hosted Access application for the entire `jrhof-banquet-registration-board-preview` Worker. Do not protect the public registration Worker because Stripe must be able to reach its signed webhook route.
3. Create one allow policy containing only the exact approved board email identities. Do not use a broad email-domain rule. Unmatched identities remain denied by default, and no bypass policy is permitted.
4. Use the one-time PIN identity provider and a 24-hour session for board review.
5. Copy the exact Access team domain and application audience (`AUD`) into both preview configs as `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`.
6. Store the same exact comma-separated board allowlist with Wrangler secret input as `BOARD_REPORT_ALLOWED_EMAILS` on both preview Workers. Never commit the list. The Worker temporarily accepts the older `BOARD_EXPORT_ALLOWED_EMAILS` secret name only to support a safe rotation.
7. Test an approved identity, a disallowed identity, an expired session, no JWT, wrong issuer, and wrong audience. All unauthorized cases must fail before D1 is read.

The preview application is named `JRHOF 2027 Banquet Board Preview`; its policy is `Approved JRHOF board reviewers`. Recreating the application changes its audience and requires both Workers to be updated and redeployed.

The Worker reads only `Cf-Access-Jwt-Assertion`; it verifies RS256 through the Access JWKS and validates issuer, audience, expiration, token type, subject, and allowlisted email. It does not rely on the unsigned email header.

## Download URLs

The board dashboard is `/board/banquet/`. It reads only aggregate totals from `/api/banquet/dashboard`: registrations and seats by state, paid/pending/review counts, gross/refunded/net cents, paid meal counts, recent activity, and UTM source/medium rollups. It returns no purchaser, attendee, contact, dietary, seating, Stripe, or Access identity fields. Every dashboard read stores only a SHA-256 digest of the Access subject and the access time.

- All registration statuses: `registrations.csv`
- Paid-only registrations: `registrations.csv?paid-only=true`
- All attendees: `seating-plan.csv`
- Paid-only attendees: `seating-plan.csv?paid-only=true`

No other filter is accepted. The endpoints return attachment CSV with UTF-8 BOM, CRLF, formula-injection protection, `Cache-Control: no-store`, and `X-Robots-Tag: noindex, nofollow`.

## Secret rotation

If the Access application is recreated, update `ACCESS_AUD` and retest every fail-closed case. If board membership changes, update both the Access policy/group and the Worker allowlist secret; remove the prior identity from both. Review the privacy-safe export audit after changes. Rotate identity-provider credentials in the provider, not in this repository.

## CLI fallback

The ignored operator command remains `npm run banquet:export:preview` with optional `-- --paid-only`. It authenticates through Wrangler, writes mode `0600`, refuses overwrite unless `--overwrite` is explicit, and must be run only by an authorized operator on an approved device. It is a fallback, not a public or unprotected admin route.
