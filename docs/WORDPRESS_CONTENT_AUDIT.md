# JRHOF WordPress Content Export Audit

**Export reviewed:** `joerossihalloffame.WordPress.2026-06-20.xml`  
**Compared with:** legacy `JR-and-Associates-Inc/jrhof-webapp` checkout and `docs/JRHOF_REPO_AUDIT.md`  
**Audit date:** June 19, 2026 (America/Denver)  
**Scope:** extraction, reconciliation, and migration planning only

## Executive summary

The WordPress export confirms that production and the legacy repository each represent the same 150-person inductee roster, but neither source is safe to promote wholesale. WordPress is the newer editorial source and contains substantially expanded biographies, current donation copy, current 2026 event details, and 567 media records. The repository has a cleaner structured year field and, in several cases, a better portrait or more complete biography. WordPress also contains serious import/copy errors: Robert Schnabel's page contains Joe Rossi's biography, 39 inductee pages have featured-media metadata that appears to point to another person, and the inductee index has one broken Wiley Chance link.

The canonical inductee source should therefore be a **curated merged dataset**, not raw WordPress or raw repository data. Start with WordPress current text, production URL, and media references; cross-check every year, name, portrait, and biography against repository data and original Hall of Fame records. Preserve current WordPress URLs exactly during the first migration to minimize SEO risk.

The export contains 750 items: 159 published pages, 2 draft pages, 4 published posts, 567 attachment records, and supporting WordPress/plugin records. Of the 159 published pages, 150 are inductee detail pages and 9 are organizational/index pages. Two FooGallery records reference 402 historical golf photos.

The XML contains media metadata and URLs, not media binaries. All required originals must be downloaded separately and verified before WordPress is retired.

## Outputs created

The following draft artifacts were created under `_migration/extracted-content/`:

- `inductees-draft.json` — all 150 WordPress inductees, repo matches, content comparisons, media details, and recommended canonical records.
- `events-draft.json` — four WordPress event posts, links, media/gallery IDs, and registration fields found or implied.
- `pages-draft.json` — 11 non-inductee pages, including 9 published and 2 drafts.
- `media-map-draft.json` — 567 attachment records, content/gallery references, repo stem matches, and migration actions.
- `redirects-draft.json` — 156 unimplemented draft redirects using a preserve-current-WordPress-URLs strategy.

The raw XML remains outside the workspace and was not copied or committed.

## Export inventory

| WordPress item type | Count | Notes |
|---|---:|---|
| Pages | 161 | 159 published, 2 drafts |
| Posts | 4 | All published event posts |
| Attachments | 567 | Metadata/URLs only; no binary files in XML |
| FooGallery | 2 | 2024 and 2025 golf galleries |
| Navigation items | 6 | WordPress menu records |
| WordPress navigation entities | 3 | Block navigation records |
| Custom CSS | 5 | Platform/plugin-specific; do not migrate as content |
| Global styles | 2 | Platform-specific; do not migrate directly |
| **Total** | **750** | 181 published, 2 draft, 567 inherited attachments |

The prior repository audit's REST counts are confirmed: 159 published pages, four posts, and 150 inductee detail pages.

## Inductee reconciliation

### Counts and roster

| Measure | WordPress | Repository |
|---|---:|---:|
| Inductee records | 150 | 150 |
| Records missing from the other source | 0 | 0 |
| Unique names/routes within source | 150 | 150 |
| Explicit induction years | 122 extracted from WordPress body text | 150 structured values |

There are no roster-only inductees in either source. The WordPress parent page `/inductees/` is not counted as a detail record. Production has 149 detail pages under `/inductees/` and one root-level outlier, `/gene_rozelle/`.

### Name and slug mismatches

Two display names differ:

| WordPress | Repository | Recommendation |
|---|---|---|
| Sam Corsentino | Sam Corentino | WordPress spelling is also supported by its media filename; verify against original program, then retain alias |
| Steve Usecheck Jr. | Steve Usecheck | Verify suffix against original record; retain both search aliases |

Three route identifiers differ:

| WordPress production slug | Repository route key |
|---|---|
| `dave_baker` | `Dave_Chick_Baker` |
| `richard_reininger` | `Richard_Dick_Reininger` |
| `sam_corsentino` | `Sam_Corentino` |

Other notable display normalization differences include underscores in WordPress titles (`Al_Raglin`, `Arny_Karraker`, `Gene_Rozelle`) and apostrophe/quote variants. These should be cleaned in display text without dropping legacy aliases.

### Induction-year conflicts

WordPress body headings yielded 122 years. The remaining 28 pages have no reliable year in their body; most are incomplete biographies and should use the repository's structured year only after verification.

Two extracted values conflict with repository data:

1. **Robert Schnabel:** repository says 2010, while the WordPress body includes a 1996 Joe Rossi heading. The WordPress page is corrupted and cannot be used for year or biography.
2. **Walt Clay:** WordPress says Class of 1990; repository groups him as `Pre 1990`. Original Hall of Fame records must decide the canonical value.

### Biography comparison

Every WordPress inductee record has a modification timestamp later than the repository's last commit on November 5, 2025. That establishes newer timestamps, not automatically more authoritative content. Text comparison produced the following audit classifications:

| Classification | Count | Interpretation |
|---|---:|---|
| Substantively the same | 7 | Text is effectively equivalent after markup normalization |
| WordPress more complete | 42 | WordPress has materially more body content, including all three 2026 biographies |
| Different, similar length | 63 | Both have content but wording differs substantially; manual review required |
| Repository more complete | 11 | Repository has materially more content |
| Both incomplete | 27 | Neither source contains a useful biography |

This is a migration heuristic based on normalized text, word counts, and similarity—not an editorial judgment.

#### Substantively the same (7)

Al Raglin, Arny Karraker, Dave “Chick” Baker, Gene Rozelle, Ray Belfiore, Steve Heuer, and Terry Reed.

#### WordPress more complete (42)

Art Wollenweber; Bill Lind; Bill Vincent; Bob Ferguson; Bruce Bradshaw; Bud Best; Dave Schmidt; David Letofsky; Dennis Smith; Doug Graham; Ed O'Connor; Edward Stevens; Frank Zele; Fred Zuercher; Gary Baker; George Demetriou; H.R. Phillips; Jack Smith; Jim Dorsey; Joe Rossi; Joey Borjon; Leonard Varriano; Leroy Garzonio; Manual Boody; Mark Denzin; Myran Dunker; Neil Devlin; Paul Babkiewich; Pete DAmato; Raymond Powe; Richard Fanning; Richard Mauro; Ron Sisson; Ross Barlow; Sam Corsentino; Terry Angell; Terry Schiessler; Thomas Severtson; Tim Kardatzke; Tom Freed; Virgil Jester; Willie White.

The most important improvements are the 2026 biographies: Fred Zuercher, George Demetriou, and Terry Angell have substantial WordPress biographies but only placeholder text in the repository.

#### Repository more complete (11)

Bob Meisner; Ernie Ortiz; Frank Prentup; Julius Carabello; Ken Furman; Lou Nedbalski; Mike Kronkright; Richard Hawkins; Robert Campbell; Roger Kinney; Walt Clay.

#### Both incomplete (27)

Bob Mullerberg; Bob Westhoff; Dan Ringsby; Del Petersen; Dick Hotton; Don Cimaglia; Don Hegi; Don Shiverdecker; Ed Tracy; Edmund DHaillecourt; Ernest Cavalieri; Ervin Douglas; Francis Ford; George Theodore; Joe Bellich; Joe Brooks; John Wenglass; Ken Zetner; Lou Nolin; Lou Spector; Mark Junge; Nick Vitale; Sal Salazar; Sid Peretti; Stormy Stucker; Vic Damon; Wiley Chance.

#### Different, similar length (63)

Bert Borgmann; Bill Helman; Bob Jones; Bob Ottewill; Bruce Grigsby; Bud Schoepflin; Carl Zele Jr.; Charlie Chainhalt; Chris Dittman; Chuck Denney; Cliff Hendrick; Dan Cholas; Dan Weikle; Dick Cartin; Dick Yates; Don Carlsen; Don Stengel; Ed Underwood; Ernie Kozacek; Frank DeAngelis; Frank Messenger; Fritz Johnstone; Gene Bunnelle; Gordon Cooper; Harry Wise; Howard Dunbar; Howard Wentz; Irv Brown; Irv Moss; James Roorda; Jim Darden; Jim Jenkins; Jim Paronto; Jim Schaefer; Joe Bonacquista; Joe Maciel; John DeSiato; John Walsh; Joseph Massaro; Keith Bailey; Lee Rosa; Leo Bahl; Melvin Martin; Mert Letofsky; Mike Brady; Mike Doohan; Mitchell Burns; Pat Haggerty; Pete Butler; Randy Holmen; Rich Czernicki; Richard “Dick” Reininger; Richard Chandler; Robert Blaser; Robert Schnabel; Ron Piotraschke; Ross MacAskill; Steve Usecheck Jr.; Terry Garvey; Tom Robinson; Tom Smith; Warren Kettner; William “Bill” Fanning.

Robert Schnabel appears in this broad text category only because both sources have text. It must be elevated to a blocking content error because the WordPress text belongs to Joe Rossi.

### Biography errors requiring immediate review

- **Robert Schnabel:** WordPress title/class says Robert Schnabel/Class of 2010, but the biography begins “1996 Hall of Fame inductee Joe Rossi” and describes Joe Rossi. Repository content is the safer temporary source.
- **Walt Clay:** conflicting class/year (`1990` vs. `Pre 1990`).
- **Terry Garvey:** repository and WordPress page use Terry Garvey, but the repo image is named `Ray_Garvey.jpg` and the WordPress archive index displays “Ray Garvey.” Verify the actual inductee and portrait label.
- **Wiley Chance:** the WordPress archive index links to `/wiley_chance/`, but the published detail page is `/inductees/wiley_chance/`.
- The 27 incomplete records need a defined editorial status rather than silently publishing a generic “biography coming soon” block.

### Portrait and image reconciliation

The repository has 29 missing referenced portrait files. WordPress supplies real portraits for two of those cases:

- Mike Kronkright → `Mike_Kronkright.webp` (repo incorrectly references `David_Kronkright.jpg`).
- Sam Corsentino → `Sam_Corsentino.webp` (repo uses `Sam_Corentino.jpg`).

After combining both sources, **27 inductees still have no confirmed portrait**; WordPress uses `_Missing` placeholder assets for these cases.

WordPress media metadata is not clean enough to trust automatically:

- 8 inductee featured-media IDs are absent or unresolved in the export.
- 37 featured-media records point to a filename containing `Missing`.
- 39 featured-media assignments appear to belong to a different inductee. Examples include Bert Borgmann → `Fred_Zuercher.webp`, Bob Jones → `Bert_Borgmann.webp`, Steve Heuer → `Terry_Angell.webp`, Robert Schnabel → `Richard_Fanning.webp`, and Terry Reed → `Sid_Peretti_Missing.webp`.
- Some page bodies still contain the correct portrait even when featured-media metadata is wrong. Body references and `_thumbnail_id` must be reconciled independently.

The counts above overlap and must not be added together.

### Recommended canonical inductee source

Create a new reviewed canonical record per inductee using this precedence:

1. **Roster and current production URL:** WordPress export.
2. **Current biography baseline:** WordPress when complete and correctly assigned.
3. **Structured induction year:** repository as a starting value, verified against original programs/board records.
4. **Portrait:** choose the valid image from either source after visual/person verification; do not trust WordPress featured-media IDs alone.
5. **Conflicts:** original banquet programs, board-approved roster, or another primary archival record.
6. **Aliases:** retain every WordPress slug, repo `Bio URL`, prior display spelling, and known image filename variant.

No current data file should be overwritten until the 150-row review is approved.

## URLs and redirects

### URL strategy

The lowest-risk launch strategy is to preserve current WordPress paths as canonical, including underscores and the unusual root-level `/gene_rozelle/`. Cleaner lowercase/hyphen routes can be considered later, but changing all production URLs during the platform migration creates avoidable SEO and inbound-link risk.

Current production patterns:

- 149 inductees: `/inductees/{wordpress_slug}/`
- Gene Rozelle outlier: `/gene_rozelle/`
- Joe Rossi uses a hyphenated slug: `/inductees/joe-rossi/`
- Current event posts use top-level descriptive URLs rather than the repository's `/events/{year}/...` paths.

### Draft redirect inventory

`redirects-draft.json` contains 156 unimplemented rules:

- 150 legacy repo biography routes such as `/Fred_Zuercher/` → current WordPress detail URLs.
- 4 repository golf/banquet routes → current WordPress event post URLs.
- `/privacy/` → current production `/privacy-policy/`.
- The stale 2025 test signup route → the 2025 golf archive post.

The file also lists all current published WordPress paths that should be preserved.

### Redirect and link risks

- Redirect matching must account for case, underscores, hyphens, encoded apostrophes, and trailing slashes.
- Current WordPress content contains one confirmed broken internal link: `/inductees/` links Wiley Chance to `/wiley_chance/` instead of `/inductees/wiley_chance/`.
- Three names have materially different repo/WordPress slugs and need explicit rules: Dave Baker, Richard Reininger, and Sam Corsentino.
- Preserve old event post URLs even after registration closes; convert them to archive pages rather than deleting them.
- Do not chain redirects. Each known variant should point directly to the final canonical URL.
- Before implementation, merge this draft with Search Console, analytics landing pages, server logs, the committed repo sitemap, and WordPress sitemap data.

## Event content audit

### WordPress event inventory

| Event | WordPress status | Key content | Registration/payment links |
|---|---|---|---|
| 2026 Umpire's Cup IV golf tournament | Current/upcoming in export | June 27, 2026; 8:00 a.m.; Applewood Golf Club; $130 per golfer | Eventbrite registration; separate Stripe raffle, mulligan, and donation links |
| 2026 HOF induction banquet | Past by audit date | January 31, 2026; Holiday Inn Denver–Lakewood; $43 early/$50 regular; hotel group code | Eventbrite registration link still present |
| 2025 Umpire's Cup III | Archive/gallery | Sponsor credit to KSK; photography credit to LeBaron Portraits | No registration link; FooGallery with 244 photos |
| 2024 Umpire's Cup II | Archive/gallery | Sponsor credit to KSK; photography credit to LeBaron Portraits | No registration link; FooGallery with 158 photos |

### Repository comparison

- The repository's 2026 golf page is stale and materially wrong: it uses June 14, Littleton Golf and Tennis Club, a placeholder street address, $150, and an older Eventbrite ID (`1754953445999`). WordPress uses June 27, Applewood, $130, and Eventbrite ID `1985644019715`.
- The repository and WordPress banquet pages use the same Eventbrite event ID, but the event occurred January 31, 2026. The registration link and “upcoming” treatment are now stale.
- Repository 2025 and 2024 golf pages overlap the WordPress gallery posts, but the XML contains 402 gallery image records not present in the repository.
- The repository contains historical banquet pages (2010, 2023, 2024, 2025) not represented as equivalent published WordPress posts/pages. Retain them as secondary migration candidates, not production-authoritative content.

### Stale Eventbrite links

- **Definitely stale:** repository 2026 golf Eventbrite link/ID; repository and WordPress 2026 banquet links after the event date.
- **Current in export but slated for replacement:** WordPress 2026 golf Eventbrite link.
- Eventbrite registration data and custom questions are not contained in the WordPress XML. An Eventbrite export or account audit is required before recreating fields and preserving attendee history.

### Native registration boundaries

Future native flows are required for:

- banquet ticket/guest registration;
- golf individual/foursome registration;
- raffle and mulligan add-ons tied to the golf registration;
- sponsor packages once approved;
- optional event-linked donation.

This audit does not implement those flows.

### Registration fields found or implied

#### Golf tournament

Found in the repo form or explicitly implied by WordPress:

- contact email;
- one-to-four golfer names and emails;
- golfer/ticket quantity at a per-golfer price;
- team/foursome request or comments;
- raffle ticket quantity;
- mulligan quantity;
- event year/package identifier.

Operationally implied but not present as explicit WordPress fields:

- purchaser/contact name and phone;
- individual vs. foursome package;
- accessibility needs;
- consent/terms acknowledgment;
- sponsor package/company/contact/artwork fields, if sponsorship is offered.

#### Induction banquet

Explicitly implied by WordPress content:

- ticket quantity;
- attendee/guest names, including significant others and friends;
- price tier based on registration date;
- event year/package identifier.

Operationally implied but not present as explicit fields:

- purchaser/contact name, email, and phone;
- seating/group request;
- dietary and accessibility needs;
- consent/terms acknowledgment;
- table/sponsor package fields, if offered.

The hotel group code is informational and should not be treated as registration data.

## Donation and sponsor content

### Content present in WordPress

- One-time Stripe donation link.
- Monthly Stripe donation link.
- Donation purpose language covering the banquet, history preservation, education/community initiatives, and operating costs.
- Legal operator name: `JR and Associates, Inc.`; the privacy page adds `DBA: Joe Rossi Hall of Fame`.
- General statement that the organization is a Colorado nonprofit.
- Homepage statement that JRHOF is a `501(c)(3)` nonprofit.
- General language that donations “may be tax-deductible as allowed by law.”
- Thank-you page expectation that the donor will receive a confirmation email with donation details.
- Sponsor/credit mentions for KSK and LeBaron Portraits on 2024/2025 golf galleries.

### Missing or insufficient trust elements

| Trust element | Assessment |
|---|---|
| Legal nonprofit name | Present, but should be consistently displayed with DBA |
| EIN / federal tax ID | Not found anywhere in the export |
| Tax-deductibility language | Present only as generic “may be” language; no goods/services or deductible-amount explanation |
| Board/stewardship information | No organizational board roster, officers, financial stewardship report, annual report, or governance page found |
| Impact metrics | Mission claims exist, but no quantified scholarships, programs, people served, archive progress, or use-of-funds metrics |
| Sponsor package details | No levels, pricing, benefits, deadlines, logo requirements, fulfillment terms, or contact workflow |
| Donation receipt expectations | Confirmation email promised; not clearly identified as a tax receipt and no timing/content expectations stated |
| Recurring donation management | Monthly cancellation/change promise exists, but no support or self-service details are stated |

The About page says fundraising supports scholarships and mentorship, but the donation page does not quantify or substantiate those programs. Verify these claims before using them in fundraising or Ad Grants landing pages.

### Sponsor migration gap

The XML proves historical sponsor recognition but does not define sellable sponsor products. Sponsor packages must be obtained from the board/event committee or prior Eventbrite/Stripe materials. Do not infer prices or benefits from the KSK gallery credit.

## Media audit

### Media inventory

| Measure | Count |
|---|---:|
| WordPress attachment records | 567 |
| Attachments referenced by published pages/posts or FooGallery | 557 |
| Unreferenced attachment records | 10 |
| 2024 FooGallery photos | 158 |
| 2025 FooGallery photos | 244 |
| Total gallery photos | 402 |
| Attachments with a repo asset stem match | 120 |
| Attachments without a repo stem match | 447 |
| Published media URLs with no matching XML attachment record | 3 |

The 447 items absent by repo stem are mostly the 402 gallery photos plus current WordPress-only portraits, placeholders, flyers, PDFs, and event add-on graphics.

### Media that must be migrated separately

- All 567 attachment binaries; the WXR export contains URLs/metadata only.
- 402 FooGallery originals for the 2024 and 2025 golf archives.
- Current WordPress WebP portraits, especially Mike Kronkright and Sam Corsentino.
- Current brand/background assets where still used.
- 2026 golf flyer PDF and preview image.
- 2026 banquet flyer image/PDF if the PDF exists outside the content references.
- 2026 raffle and mulligan graphics.
- Any WordPress-generated alt text/captions that survive review.

Download original attachment URLs, not thumbnail variants, and verify file hashes, dimensions, MIME types, and visual identity before import.

### Unresolved XML media references

Three URLs are referenced by published content but have no matching attachment record in the export:

- `https://jrhof.org/wp-content/uploads/2026/01/Al_Raglin1.webp`
- `https://jrhof.org/wp-content/uploads/2026/01/Arny_Karraker1.webp`
- `https://jrhof.org/wp-content/uploads/2026/03/golf_tournament_flyer_2026-1-2-2-pdf.jpg`

The Al Raglin and Arny Karraker pages also reference similarly named attachment records without the `1`, so these may be stale derivative/copy URLs. The golf PDF preview may be a generated derivative omitted from WXR. Confirm each URL from the live media library or filesystem backup.

### Additional media risks

- WordPress featured-media metadata is systematically misassigned for 39 inductee pages and cannot drive OG images or canonical portraits without review.
- Ten attachment records are not connected to published content through page/post, featured-image, or FooGallery references. Some are global theme assets or alternate golf PDFs and may still be operationally important.
- The repository uses JPEG portraits while WordPress usually uses WebP; filename-stem matching does not prove identical imagery.
- Placeholder images are person-specific filenames and can be mistaken for genuine portraits unless explicitly tagged.
- XML attachment URLs are not a backup. Obtain a full `wp-content/uploads` archive before shutdown.

## Canonical content and migration recommendation

Use the WordPress export as the **current editorial baseline**, but create a reviewed canonical migration layer rather than importing it directly.

Recommended next phase:

1. Acquire a complete WordPress media archive and Eventbrite exports before any production changes.
2. Review the 150-row `inductees-draft.json` with a board/content owner.
3. Resolve Robert Schnabel, Walt Clay, Terry/Ray Garvey, Sam Corsentino, Steve Usecheck Jr., and the 27 incomplete biographies first.
4. Visually verify all portraits, beginning with 39 mismatched featured-media assignments and 27 unresolved portraits.
5. Approve current WordPress URLs as the initial canonical URL set; merge redirect candidates with Search Console and logs.
6. Verify legal name/DBA, EIN display policy, tax wording, board/stewardship content, impact claims, donation receipt behavior, and sponsor packages.
7. Obtain Eventbrite form/attendee exports and board-approved registration requirements.
8. Only after content sign-off, transform the draft JSON into a validated canonical schema. Do not overwrite current repo data during reconciliation.

No Astro, Stripe, D1, Workers, native registration, or production behavior changes should begin until this content/media review has a named approver and the unresolved records are dispositioned.

## Open questions

1. Which original program or board roster resolves Walt Clay's year and the Terry/Ray Garvey naming issue?
2. Is Robert Schnabel's correct production biography the repository version, and who approves replacing the corrupted WordPress copy?
3. Are the 27 incomplete biographies intentionally unpublished content, or is another archive available?
4. Does the organization have genuine portraits for the 27 unresolved cases?
5. Can a full `wp-content/uploads` archive and database/media-library export be obtained?
6. Can Eventbrite export the banquet and golf custom questions and historical attendees?
7. What is the organization's EIN display policy, exact tax-receipt language, and goods/services treatment for event tickets and sponsorships?
8. Who are the current board/officers, and which stewardship/impact metrics are approved for public use?
9. What sponsor levels, prices, benefits, deadlines, and fulfillment requirements are approved?
10. Should current WordPress URLs remain canonical permanently, or only through the first migration?
