# SEO and Google Ad Grants Readiness

This checklist is about improving eligibility, indexability, relevance, and conversion readiness. It does **not** promise top rankings.

## Implemented technical baseline — June 24, 2026

- The canonical production host is configured as `https://jrhof.org` in `astro.config.mjs`. Preview deployments intentionally emit production-domain canonical URLs and must not be treated as the production cutover.
- Shared metadata includes canonical URLs, unique route titles and descriptions, Open Graph metadata, Twitter card metadata, and a default social image. Verified inductee portraits are used for biography previews; unresolved portraits fall back to the default site image.
- The shared JSON-LD graph includes `Organization`/`NonprofitOrganization`, `WebSite`, and route-appropriate `WebPage` types. The organization uses the legal name JR and Associates, Inc., the alternate name Joe Rossi Hall of Fame, and the public EIN as `taxID`.
- `BreadcrumbList` schema is present on nested and principal section routes.
- Inductee biography routes include conservative `Person` schema. Every record includes only its name and canonical URL at minimum. Description and portrait fields are included only when the biography/portrait data is available and the record is not marked for board review.
- The inductee and events indexes use `CollectionPage`; About uses `AboutPage`; Contact uses `ContactPage`.
- `@astrojs/sitemap` generates the sitemap from current Astro routes at build time. The 404 route is excluded, and stale checked-in sitemap artifacts were removed so they cannot override generated output.
- `public/robots.txt` allows public crawling and references Astro's generated `https://jrhof.org/sitemap-index.xml`.
- The 404 route uses `noindex, follow`. Public content routes do not receive an accidental `noindex`.

## Deferred structured data

- Active `Event` schema is deferred. The June 27, 2026 golf page changes from registration-open to concluded through client-side date logic, so static event markup could become misleading without a reliable content/build update workflow and named content owner. Event archive and event-detail routes currently use accurate page-level schema instead.
- Past event pages remain `WebPage`/`CollectionPage` content and do not imply active registration, ticket inventory, offers, or donation availability.
- No donation, payment, registration, rating, board-member, address, phone, email, `sameAs`, founding-date, charitable-registration, or receipt/tax-deductibility schema is asserted.

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

- Add and validate `NonprofitOrganization` schema for the organization.
- Define a `Person` or inductee schema strategy for biography pages.
- Define an `Event` schema strategy for current and archived event pages.
- Define `BreadcrumbList` schema for nested content where it improves navigation clarity.
- Extend schema carefully if FAQ, article, or sponsor-page content later justifies it.

## Content strategy for search visibility

- Maintain strong inductee biography pages with complete, original, and accurate copy.
- Build event archive pages that remain useful after the event date.
- Expand Colorado baseball umpire history and JRHOF background content.
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
- Choose an analytics strategy that is consent-aware and approved by the organization, such as GA4 or GTM.
- Define the conversion events before implementation so tracking and reporting are consistent.
- Analytics and Google Ads conversion implementation remain deferred to a dedicated approved analytics/conversion branch.

## Conversion tracking targets

- Donation click.
- Donation completed, once the Stripe donation flow and an approved completion signal exist.
- Contact form submission.
- Event registration interest.
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
