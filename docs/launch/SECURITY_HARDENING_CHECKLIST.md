# Security Hardening Checklist

## Platform and transport

- Enforce HTTPS for the production domain.
- Review Cloudflare SSL/TLS settings before cutover.
- Decide whether HSTS is enabled, and if so, document the rollout plan and preload implications.
- Confirm preview and production environments are separated by policy and by configuration.

## Security headers

- Set `Content-Security-Policy` deliberately.
- Set `X-Content-Type-Options`.
- Set `Referrer-Policy`.
- Set `Permissions-Policy`.
- Set `frame-ancestors` in CSP or the equivalent `X-Frame-Options` protection where needed.
- Verify the headers on both the root page and representative inner pages.

## Contact form protection

- Add a honeypot.
- Add Turnstile or an equivalent challenge.
- Add rate limiting.
- Validate on the server, not only in the browser.
- Make sure the public form does not imply message delivery unless the provider is configured.

## Secrets and sensitive config

- Keep email provider secrets out of public code.
- Keep Stripe secrets out of public code.
- Keep webhook signing secrets out of public code.
- Inventory all environment variables before launch.
- Confirm that preview and production variables are separated and documented.

## Payments and future webhooks

- Never collect card data directly on the site.
- Verify Stripe webhook signatures when Checkout or payment state is implemented.
- Keep server-side payment state authoritative.
- Avoid trusting client-supplied prices, payment status, or fulfillment state.

## Operational controls

- Use GitHub branch protection and pull-request review for sensitive changes.
- Require review for Cloudflare Pages production settings and environment variables.
- Treat preview deployments as non-production until approved.
- Confirm the privacy and terms pages are formally approved before enabling public transactional flows.

## Data handling

- Document contact and donor record retention.
- Define a deletion/export policy for future D1 records or other operational stores.
- Keep backup/export plans for future contact and donor records.
- Minimize personal data collection to what is operationally required.

## Dependency and release hygiene

- Run a dependency audit before launch and after major package updates.
- Review any new third-party script for necessity, privacy impact, and failure mode.
- Keep the static site lean unless a feature truly requires additional runtime logic.
