# Security Hardening Checklist

## Platform and transport

- Enforce HTTPS for the production domain.
- Review Cloudflare SSL/TLS settings before cutover.
- `public/_headers` currently enables HSTS with `includeSubDomains` and `preload`. Confirm production DNS, all subdomains, and preload intent before retaining or changing that policy.
- Confirm preview and production environments are separated by policy and by configuration.

## Security headers

- Use Workers Static Assets-compatible `public/_headers` for the static header baseline.
- Set `X-Content-Type-Options: nosniff`.
- Set `Referrer-Policy: strict-origin-when-cross-origin`.
- Set `Permissions-Policy` to disable camera, microphone, geolocation, payment, usb, bluetooth, accelerometer, gyroscope, and magnetometer.
- Set `X-Frame-Options: DENY` and keep `frame-ancestors 'none'` in CSP.
- Use an enforceable CSP baseline rather than report-only because the current Astro surface is static and the inline behavior is known.
- Allow `style-src 'self' 'unsafe-inline'` and `script-src 'self' 'unsafe-inline'` only because the current site relies on inline Astro scripts for the mobile nav, inductee search, contact form feedback, and golf event state switch, plus inline component styles.
- Keep the CSP narrow while allowing the currently configured Cloudflare Web Analytics, GA4/Zaraz, and approved external transaction destinations. Review the exact checked-in `public/_headers` value after any tool change.
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
- Require review for Workers Builds production settings, secrets, bindings, and environment variables.
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

- Reassess the CSP when Turnstile, an email provider, Clarity, or any additional third-party service is added. GA4/Zaraz and Cloudflare Web Analytics are already active.
- Reconfirm the existing HSTS policy after production domain, TLS, subdomain, and rollback ownership are verified.
