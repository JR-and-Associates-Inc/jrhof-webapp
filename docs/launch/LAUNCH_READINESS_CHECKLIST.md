# Launch Readiness Checklist

## Content completeness

- Confirm the active content model is complete and current.
- Confirm the board-review queue is resolved or explicitly accepted.
- Confirm the current biography count is still the expected `27` incomplete entries, or update the count if the content review has changed.
- Confirm the paragraph-merge biographies are resolved, including Dan Weikle, Julius Carabello, Robert Schnabel, and Warren Kettner if they are still current exceptions.
- Confirm identity-sensitive records are resolved before launch.
- Confirm portrait gaps are either resolved or explicitly accepted for launch.

## Trust and legal readiness

- Confirm Privacy and Terms are board-reviewed and approved, or intentionally left as draft language with a documented reason.
- Confirm the EIN and other trust signals are accurate and approved for public use.
- Confirm any donation or sponsor claims are aligned with approved nonprofit policy.

## Routing and redirects

- Verify redirect coverage for legacy URLs.
- Verify canonical URLs on the launch candidate.
- Confirm 404 behavior and redirect behavior together, not separately.
- Verify the Gene Rozelle/Rozzelle handling is intentional and approved.

## Measurement and operations

- Set up Google Search Console.
- Confirm the analytics/conversion tracking plan.
- Confirm the donation path exists, whether as Stripe links or Checkout.
- Confirm the contact delivery provider and environment variables are in place.
- Confirm any newsletter or future email workflow is either off or explicitly configured.

## Cloudflare and DNS

- Confirm the existing `jrhof-webapp` Worker name, account ownership, active version, GitHub connection, `main` production branch, and build/deploy commands.
- Confirm Cloudflare build variables, runtime secrets, and bindings; the current asset-only site should have no runtime bindings.
- Confirm preview URLs are enabled and decide whether Cloudflare Access is required.
- Export current DNS and confirm the approved apex custom-domain plus `www`-to-apex redirect sequence.
- Confirm WordPress remains available through the rollback window and name the deployment, DNS, validation, and rollback owners.

## Accessibility and performance

- Run an accessibility pass on core public pages.
- Review PageSpeed/Core Web Vitals.
- Verify mobile usability on real devices or emulation at small widths.
- Verify no horizontal overflow, broken touch targets, or unreadable cards.

## QA and monitoring

- Verify 404 and redirect behavior.
- Verify post-launch monitoring and alert ownership.
- Verify that broken links, form failures, and missing assets are visible quickly.
- Verify a post-launch issue triage process exists.

## Launch decision

- Confirm the launch is a coordinated content, operations, and technical decision.
- Do not treat a mostly complete site as launch-ready until the checklist items above are signed off.
