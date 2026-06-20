# JRHOF Live-Site Validation Audit

**Live site:** `https://jrhof.org`  
**Validation date:** June 19, 2026 (America/Denver)  
**Evidence:** rendered public site, read-only HTTP snapshots, WordPress export drafts, and legacy repository  
**Scope:** content, links, media, event/conversion surfaces, and migration reconciliation only

## Executive summary

The live site contains 149 visible inductee cards for a 150-person roster. Of the 149 cards, 135 link to biography pages and 14 have no link. Gene Rozelle has a live detail page but is absent from the rendered archive, producing 15 inductees without a working archive-to-biography path. No card links only to an image, no card link is currently broken, all 150 known detail URLs return successfully, and all 149 rendered card images resolve over HTTP.

Robert Schnabel is the highest-risk live defect. His archive card has no anchor—not an image link—and his direct biography URL returns 200 but renders Joe Rossi's biography beneath `Robert Schnabel` and `Class of 2010`. The page also exposes a public comment form. This content must not be migrated.

The live site uses 32 visible placeholder portraits. All 32 placeholder URLs resolve, but they are the same underlying placeholder binary under person-specific filenames. Five of these can potentially be repaired from existing repo portraits; 27 remain unresolved. Terry/Ray Garvey adds a separate identity/portrait issue, resulting in 33 media-blocked records.

The public event and conversion experience is fragmented across Eventbrite, several Stripe Payment Links, WordPress comments, and a personal email address disclosed in a sponsor-support reply. The banquet page is stale and renders `Time: 31, 2026`. Public Login UI is present sitewide, and public comment forms appear on 149 of 150 inductee pages plus both 2026 event posts.

No forms, comments, logins, Eventbrite pages, or Stripe forms were submitted during validation.

## Validation method

- Loaded and inspected rendered pages in the public browser without authentication.
- Extracted the live inductee card name, anchor target, and rendered image URL from `/inductees/`.
- Issued read-only GET requests to 160 public page/link URLs and 149 unique card images.
- Verified all 150 known inductee detail URLs independently, including cards with no anchor.
- Hashed the returned card images to identify shared placeholder binaries.
- Inspected `robots.txt`, `wp-sitemap.xml`, and all four child sitemaps.
- Compared live behavior with `_migration/extracted-content/` and the legacy repo data/content.
- Stored raw HTML snapshots only in `/private/tmp`; they are not migration artifacts and are not committed.

## Live crawl inventory

| Surface | Result |
|---|---:|
| Known inductees | 150 |
| Visible archive cards | 149 |
| Visible cards linking to biographies | 135 |
| Visible cards linking only to media | 0 |
| Visible cards with no anchor | 14 |
| Roster records absent from archive | 1 |
| Inductees without a working archive-to-bio path | 15 |
| Broken card links | 0 |
| Known detail pages returning successfully | 150 |
| Detail pages with confirmed wrong-person content | 1 |
| Unique rendered card images | 149 |
| Card-image HTTP failures | 0 |
| Visible placeholder portraits | 32 |
| Public inductee comment forms | 149 |

## Sitemap validation

The live WordPress sitemap index returns 200 and lists:

| Sitemap | URLs |
|---|---:|
| Posts | 4 |
| Pages | 159 |
| Categories | 2 |
| Users | 1 |
| **Total** | **166** |

The page sitemap is more complete than the rendered inductee archive because it includes all known detail pages, including Gene Rozelle. Category and user sitemaps are WordPress artifacts that should not automatically carry into the future site.

## Inductee archive behavior

### Missing archive record

- **Gene Rozelle:** detail page `/gene_rozelle/` returns successfully, but there is no visible Gene Rozelle card on `/inductees/`.

### Visible cards with no anchor

The following 14 cards render a name and image but no `<a>` element:

- Al Raglin
- Arny Karraker
- Francis Ford
- Irv Moss
- Julius Carabello
- Ken Zetner
- Leo Bahl
- Lou Nolin
- Lou Spector
- Richard Chandler
- Richard Fanning
- Robert Schnabel
- Walt Clay
- Warren Kettner

Their direct detail URLs all return 200. The defect is the archive card markup/content, not a missing page.

### Image-only and broken links

- No card links only to an image or media file.
- No rendered card link is broken.
- Wiley Chance links to `/wiley_chance/`, which currently redirects successfully to `/inductees/wiley_chance/`. Both exact path variants should remain in redirect review because future static hosting may treat path case and aliases differently.

### Robert Schnabel: confirmed live behavior

The precise live state is:

1. Robert Schnabel is visible on `/inductees/`.
2. The card uses `Robert_Schnabel.webp`, which returns 200.
3. The card/photo/name has no anchor and does not link to the image or biography.
4. The direct URL `/inductees/robert_schnabel/` returns 200.
5. The page renders heading `Robert Schnabel` and `Class of 2010`.
6. The biography begins `1996 Hall of Fame inductee Joe Rossi – Arvada` and describes Joe Rossi.
7. The live page therefore confirms the WordPress export corruption.
8. The WordPress featured-media assignment also points at `Richard_Fanning.webp`, although the rendered card/body image is Robert's filename.

Classification: `incorrect_content`, `no_link`, `mismatched_featured_image`, and `do_not_migrate_until_fixed`.

## Live biography validation

All 150 known direct detail URLs resolve. The live page headings generally match the expected person; two benign display differences are:

- `Al_Raglin` page heading renders `Al “Rags” Raglin`.
- `Gene_Rozelle` page heading includes location text.

Only Robert Schnabel is confirmed to contain another person's biography. The remaining content is classified through the repo-versus-WordPress comparison rather than assumed correct:

| Bio classification | Count |
|---|---:|
| Complete candidate | 58 |
| Materially different | 62 |
| Incomplete | 27 |
| Incorrect content | 1 |
| Needs review for identity/year | 2 |

The two `needs_review` records are Sam Corsentino/Corentino and Walt Clay. Terry/Ray Garvey is included in the materially-different group and separately blocked for identity/media review.

## Live media validation

### Results

- All 149 rendered card images return successfully.
- 32 cards display a `Missing` placeholder.
- The 32 differently named placeholder URLs return the same SHA-256 binary, confirming they are not individual portraits.
- Five live placeholders have a repo portrait candidate: Dave Schmidt, Don Cimaglia, Edmund DHaillecourt, Ervin Douglas, and Joe Bellich.
- After those candidates are considered, the prior count of 27 unresolved portraits remains accurate.
- Mike Kronkright and Sam Corsentino are the two cases where live/WordPress media resolves a missing repo portrait.
- Terry Garvey remains an identity issue: the live card says `Ray Garvey`, uses `Ray_Garvey.webp`, and links to the `Terry Garvey` biography.

### WordPress featured-image metadata

The 39 mismatched WordPress featured-image assignments remain confirmed as export/content-model issues. They do not always match what the live archive renders. Future migration must use an explicit canonical portrait field, not `_thumbnail_id` or live card markup without review.

### XML media gaps

These three published URLs still lack XML attachment records:

- `Al_Raglin1.webp`
- `Arny_Karraker1.webp`
- `golf_tournament_flyer_2026-1-2-2-pdf.jpg`

The current live card images for Al Raglin and Arny Karraker resolve under filenames without the trailing `1`. The golf preview should be obtained from a full uploads backup or regenerated from the PDF.

## Public comment and login surfaces

- Comment forms are enabled on 149 of 150 inductee detail pages.
- Comment forms are enabled on both 2026 event posts.
- The golf post has two public comments, including a hole-sponsorship inquiry and a response disclosing a personal email address.
- The events listing displays the golf post's `2 COMMENTS` count.
- A public `Login` account-modal link appears on every primary page inspected, including the homepage, archive, events, donation, contact, and inductee detail pages.

These surfaces should not be preserved unless the board explicitly approves a public account/community and moderation model.

## Live event and conversion validation

### Homepage

- Shows current golf content but also promotes the January 31, 2026 banquet after the event.
- Mixes mission, inductees, current events, past events, and donation asks.
- Provides no single measurable campaign conversion path.

### Events page

- Lists the four WordPress event posts.
- Shows public comment count on the golf event.
- Thanks sponsors/donors generically but has no sponsor package or sponsor inquiry CTA.
- `Donate Now!` goes to a Stripe-hosted link.

### 2026 banquet page

- Past event still presented with active-looking registration CTAs.
- Two `Register Now` links point to Eventbrite event `1948078227419`.
- Countdown displays all zeros.
- Event Details render the broken value `Time: 31, 2026`.
- Public comment form is enabled.
- Footer/sidebar donation CTA leaves for Stripe.

### 2026 golf page

- Two registration CTAs point to Eventbrite event `1985644019715`.
- Raffle and mulligan purchases use separate `buy.stripe.com` links.
- Donation uses a separate `donate.stripe.com` link.
- Countdown displays all zeros before the stated June 27 event date.
- Public comments are being used for sponsor support.
- The sponsor inquiry has no package/checkout path and is redirected manually to a personal email address.

### Donation page

- Accessible and renders one-time and monthly Stripe Payment Links.
- Clear donation ask, but missing EIN, board/stewardship detail, quantified impact, and explicit tax-receipt expectations.
- Contains a duplicated history-preservation bullet.

### Contact page

- Accessible and includes a contact form protected by Turnstile/reCAPTCHA-related fields.
- Also includes a separate newsletter subscription form.
- No forms were submitted.

## Eventbrite and Stripe dependencies

### Eventbrite

- Banquet: `1948078227419` — stale/past.
- Golf: `1985644019715` — current in the validated content but still an external dependency.

### Stripe-hosted links

- One-time donation.
- Monthly donation.
- Golf raffle tickets.
- Golf mulligans.
- Generic `Donate Now!` links on event surfaces.

These links are evidence for later product/payment reconciliation. They were not opened or submitted in this phase.

## Sponsor-conversion leaks

1. No published sponsor packages, levels, prices, or benefits.
2. No sponsor CTA or structured inquiry form on the event page.
3. A public WordPress comment is functioning as a sponsor lead.
4. A reply exposes a personal email address as the fulfillment path.
5. Golf registration, add-ons, donation, and sponsorship all use different channels, preventing a coherent conversion funnel.

## Google Ad Grants landing-page assessment

Poor landing-page candidates in their current state:

- **Homepage:** too broad, mixed intent, stale banquet promotion.
- **Events:** current/archive content mixed; comment metadata; no direct conversion.
- **Banquet:** past event, stale Eventbrite CTAs, broken Time field.
- **Golf:** fragmented external conversion channels and no sponsor funnel.
- **Donate:** clearest ask, but insufficient trust and impact evidence.
- **Contact:** generic contact/newsletter combination without campaign intent.

None should be used as a primary Ad Grants landing page without content and conversion remediation.

## Issues that must not be preserved

- Robert Schnabel's Joe Rossi biography.
- Missing or non-linked archive cards.
- Person-specific placeholder filenames treated as portraits.
- Terry/Ray Garvey identity ambiguity.
- Mismatched WordPress featured-media metadata.
- Public comments as event/sponsor support.
- Public personal email disclosure.
- Sitewide Login UI without a defined public-account purpose.
- Stale Eventbrite banquet registration.
- Zeroed countdowns and malformed banquet Time.
- Fragmented registration/add-on/donation/sponsor conversion paths.

## Deliverable references

- `_migration/reconciliation/inductee-reconciliation.csv`
- `_migration/reconciliation/inductee-reconciliation.json`
- `_migration/reconciliation/media-issues.csv`
- `_migration/reconciliation/live-link-issues.csv`
- `_migration/reconciliation/redirects-review.csv`
- `_migration/reconciliation/event-conversion-issues.csv`

These are review drafts only. No production behavior was changed.
