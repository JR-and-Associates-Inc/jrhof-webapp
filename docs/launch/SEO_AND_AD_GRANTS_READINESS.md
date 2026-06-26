# SEO and Google Ad Grants Readiness

This checklist is about improving eligibility, indexability, relevance, and conversion readiness. It does **not** promise top rankings.

## Implemented technical baseline - June 26, 2026

- The canonical production host is configured as `https://jrhof.org` in `astro.config.mjs`. Preview deployments intentionally emit production-domain canonical URLs and must not be treated as the production cutover.
- Shared metadata includes canonical URLs, unique route titles and descriptions, Open Graph metadata, Twitter card metadata, and a default social image. Verified inductee portraits are used for biography previews; unresolved portraits fall back to the default site image.
- The shared JSON-LD graph includes `Organization`/`NonprofitOrganization`, `WebSite`, and route-appropriate `WebPage` types. The organization uses the legal name JR and Associates, Inc., the alternate name Joe Rossi Umpires Hall of Fame, and the public EIN as `taxID`.
- `BreadcrumbList` schema is present on nested and principal section routes.
- Inductee biography routes include conservative `Person` schema. Every record includes only its name and canonical URL at minimum. Description and portrait fields are included only when the biography/portrait data is available and cleared for public use.
- The inductee and events indexes use `CollectionPage`; About uses `AboutPage`; Contact uses `ContactPage`.
- `@astrojs/sitemap` generates the sitemap from current Astro routes at build time. The 404 route is excluded, and stale checked-in sitemap artifacts were removed so they cannot override generated output.
- `public/robots.txt` allows public crawling and references Astro's generated `https://jrhof.org/sitemap-index.xml`.
- The 404 route uses `noindex, follow`. Public content routes do not receive an accidental `noindex`.
- Current golf and banquet detail routes include conservative `Event` schema with status, date, location, organizer, and an offer only where registration is currently supported.
- Past event archive pages remain `WebPage`/`CollectionPage` content and do not imply active registration, ticket inventory, offers, or donation availability.
- No donation, rating, board-member, phone, email, `sameAs`, founding-date, charitable-registration, or receipt/tax-deductibility schema is asserted.

## Indexing and technical SEO

- Review generated `sitemap-index.xml`, its sitemap files, and `robots.txt` for completeness, canonical hosts, and exclusions before each launch.
- Verify canonical URLs on all public pages against the approved production host.
- Continue confirming title and meta description standards are unique and descriptive as routes are added.
- Recheck Open Graph and Twitter card metadata for new landing pages.
- Confirm image dimensions, responsive loading, and meaningful alt text.
- Validate that legacy URLs redirect cleanly without chains.
- Run broken-link checks across internal navigation, archive detail pages, and event pages.
- Confirm HTTPS is enforced before launch.

## Structured data

- Validate `Organization`/`NonprofitOrganization`, `WebSite`, `WebPage`, `BreadcrumbList`, `Person`, and current `Event` schema after material content changes.
- Keep time-sensitive event status and offers synchronized with public event pages.
- Extend schema carefully if FAQ, article, or sponsor-page content later justifies it.

## Content strategy for search visibility

- Maintain strong inductee biography pages with complete, original, and accurate copy.
- Build event archive pages that remain useful after the event date.
- Expand Colorado baseball umpire history and Joe Rossi Umpires Hall of Fame background content.
- Provide donor and sponsor pages that explain purpose and next steps clearly.
- Add FAQs that answer common visitor questions without marketing fluff.
- Add local, history, and community pages that reinforce nonprofit relevance.
- Migrate the 2024 and 2025 Umpire’s Cup galleries only after an approved optimized-media workflow is available; use Cloudflare R2 or another approved media store rather than committing full-size galleries to GitHub.
- Replace the 2026 banquet photos-pending state with a useful gallery/recap when approved media is ready, preserving descriptive captions and internal links.

## Internal linking

- Link related inductees, related events, and related organizational pages.
- Use descriptive anchor text instead of repeated generic CTAs.
- Make sure archive pages and supporting pages point to the most relevant canonical landing page.

## Search Console and measurement

- Set up Google Search Console for the production domain before cutover.
- Verify ownership, submit the sitemap, and monitor coverage issues.
- Choose an analytics destination that is consent-aware and approved by the organization, such as GA4, GTM, or Cloudflare Zaraz.
- The site emits GA4-compatible click and search events to `dataLayer`, an optional `gtag`, and the `jrhof:analytics-event` browser event without hardcoding a production measurement ID.
- Configure and validate the approved measurement destination before relying on conversion reports.

## Conversion tracking targets

- Donation and giving-option clicks.
- Donation completed, once Stripe provides an approved completion signal.
- Contact and email clicks.
- Event registration interest and external partner clicks.
- Inductee search and profile clicks.
- Newsletter/email signup, if that workflow is later added.

Stripe donation-completion conversion tracking remains deferred until the donation flow is configured and a trustworthy completion event is available.

## Google Ad Grants landing-page readiness

- Clear mission statement on the landing page.
- Substantial original content, not placeholder copy.
- Functional navigation with no dead-end routes.
- Mobile usability at small phone widths.
- Fast page speed and Core Web Vitals awareness.
- HTTPS everywhere.
- Working donation and contact paths.
- No placeholder content on pages intended for ads.
- No excessive third-party ads or distracting external promotions.

## Launch checks

- Confirm landing pages have a single obvious next step.
- Confirm the donation/contact paths resolve to approved destinations.
- Confirm the content supports the grant account with real nonprofit value.
- Confirm measurement is configured before campaigns begin.
