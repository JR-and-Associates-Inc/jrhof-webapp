# Cloudflare Access Setup for Preview Board Exports

**Preview design only. Do not deploy or attach a production route without explicit approval.**

## Access application

1. In Cloudflare Zero Trust, create a self-hosted Access application covering only the two exact preview paths:
   - `/api/banquet/exports/registrations.csv`
   - `/api/banquet/exports/seating-plan.csv`
2. Create an allow policy for the approved board Access group or exact approved email identities. Do not use a broad email-domain rule unless the board explicitly approves it.
3. Keep an explicit deny/default-deny policy after the allow rule. Require the approved identity provider and appropriate session duration.
4. Copy the exact Access team domain and application audience (`AUD`) into `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`. Restrict the application to the preview origin.
5. Store the exact comma-separated board allowlist with Wrangler secret input as `BOARD_EXPORT_ALLOWED_EMAILS`. Never commit the list.
6. Test an approved identity, a disallowed identity, an expired session, no JWT, wrong issuer, and wrong audience. All unauthorized cases must fail before D1 is read.

The Worker reads only `Cf-Access-Jwt-Assertion`; it verifies RS256 through the Access JWKS and validates issuer, audience, expiration, token type, subject, and allowlisted email. It does not rely on the unsigned email header.

## Download URLs

- All registration statuses: `registrations.csv`
- Paid-only registrations: `registrations.csv?paid-only=true`
- All attendees: `seating-plan.csv`
- Paid-only attendees: `seating-plan.csv?paid-only=true`

No other filter is accepted. The endpoints return attachment CSV with UTF-8 BOM, CRLF, formula-injection protection, `Cache-Control: no-store`, and `X-Robots-Tag: noindex, nofollow`.

## Secret rotation

If the Access application is recreated, update `ACCESS_AUD` and retest every fail-closed case. If board membership changes, update both the Access policy/group and the Worker allowlist secret; remove the prior identity from both. Review the privacy-safe export audit after changes. Rotate identity-provider credentials in the provider, not in this repository.

## CLI fallback

The ignored operator command remains `npm run banquet:export:preview` with optional `-- --paid-only`. It authenticates through Wrangler, writes mode `0600`, refuses overwrite unless `--overwrite` is explicit, and must be run only by an authorized operator on an approved device. It is a fallback, not a public or unprotected admin route.
