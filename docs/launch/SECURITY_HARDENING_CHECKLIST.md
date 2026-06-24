# Security Hardening Checklist

## Platform and transport

- Enforce HTTPS for the production domain.
- Review Cloudflare SSL/TLS settings before cutover.
- HSTS is intentionally deferred in this branch until production DNS and cutover are verified; revisit `Strict-Transport-Security` after launch confirmation and do not enable preload here.
- Confirm preview and production environments are separated by policy and by configuration.

## Security headers

- Use Cloudflare Pages-compatible `public/_headers` for the static header baseline.
- Set `X-Content-Type-Options: nosniff`.
- Set `Referrer-Policy: strict-origin-when-cross-origin`.
- Set `Permissions-Policy` to disable camera, microphone, geolocation, payment, usb, bluetooth, accelerometer, gyroscope, and magnetometer.
- Set `X-Frame-Options: DENY` and keep `frame-ancestors 'none'` in CSP.
- Use an enforceable CSP baseline rather than report-only because the current Astro surface is static and the inline behavior is known.
- Allow `style-src 'self' 'unsafe-inline'` and `script-src 'self' 'unsafe-inline'` only because the current site relies on inline Astro scripts for the mobile nav, inductee search, contact form feedback, and golf event state switch, plus inline component styles.
- Keep the CSP narrow: `default-src 'self'`, `base-uri 'self'`, `object-src 'none'`, `img-src 'self' data:`, `font-src 'self' data:`, `connect-src 'self'`, `form-action 'self'`, and `upgrade-insecure-requests`.
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

## Revisit points

- Reassess the CSP when Stripe Checkout, Turnstile, an email provider, GA4/GTM, Clarity, or other third-party services are actually added.
- Move HSTS from deferred to enforced only after the production domain, TLS, and cutover path are confirmed.
