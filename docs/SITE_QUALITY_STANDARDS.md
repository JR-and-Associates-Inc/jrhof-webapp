# Site Quality Standards

This document sets the project-wide standards for the JRHOF Astro rebuild. These requirements apply to every public page, shared layout, and future feature unless a later approved decision supersedes them.

## 1. Theme Support

- Phase 1 uses a single consistent light theme that matches the historical JRHOF presentation.
- Do not add a theme toggle, preference storage, or `prefers-color-scheme` switching during the static foundation phase.
- Keep colors accessible in the approved light palette.
- If theme support is revisited later, document the decision and re-validate the site before release.

## 2. Security Baseline

- Keep the static site lean and avoid unnecessary client-side JavaScript.
- Do not add public login, registration, or comment UI.
- Do not expose inline secrets or private configuration in public code or markup.
- Use `rel="noopener noreferrer"` on external links that open with `target="_blank"`.
- Future forms must use Turnstile or an equivalent spam-protection control.
- Future Stripe, D1, and Workers implementations must validate server-side and never trust client-supplied price IDs or payment status.
- Add a future Cloudflare security-header checklist covering HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a CSP report-only to enforced rollout plan.
- Do not add third-party scripts unless they are approved and documented.

## 3. SEO and Marketing Baseline

- Every public page must have a unique title and meta description.
- Preserve current WordPress URLs or direct redirects where possible.
- Avoid redirect chains.
- Keep sitemap generation in place.
- Add canonical URLs where practical.
- Future schema targets include `NonprofitOrganization`, `Event`, `Person/Profile`, and `BreadcrumbList`.
- Donation, sponsor, and event pages must have one clear primary CTA.
- Pages should remain ready for Google Ad Grants work later without sending visitors into stale or fragmented flows.

## 4. Mobile-First Requirement

- Every page must be usable at 390px width.
- The header and navigation must be responsive.
- Inductee archive cards must remain readable on mobile.
- Buttons and links must be touch-friendly.
- No horizontal overflow is allowed.
- Images must be responsive and use meaningful `alt` text.

## 5. Visual Parity and Eyebrow Guidance

- The JRHOF site should feel like a historical archive and nonprofit organization, not a technology company, startup, SaaS product, or generic marketing landing page. Design choices should prioritize trust, legacy, history, community, readability, accessibility, and photography over aggressive conversion patterns.
- Preserve the original JRHOF/CHSBUA classic nonprofit feel.
- Avoid making the site feel like a SaaS or tech landing page.
- Softened or remove eyebrow labels unless they clearly help orientation.
- Prefer original section headings when available.
- Maintain the original site’s recognizable header and footer structure.
- Keep the cleaned modern implementation, but respect legacy layout and tone.
- Keep the footer uncluttered and avoid adding utility controls that distract from the archive and nonprofit layout.

## 6. Validation

Future implementation work must run:

- `npm run check`
- `npm run build`
- `npm run validate`

If theme support is reintroduced in a later phase, add explicit visual and accessibility checks for that work before merging.

## 7. Explicit Exclusions

- Do not implement payments in the static rebuild phase.
- Do not implement Cloudflare Workers, D1, or event registration in this task.
- Do not add deployment automation as part of this documentation update.
