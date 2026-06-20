# JRHOF Inductee Reconciliation — Board Review Package

**Roster:** 150 Hall of Fame inductees  
**Evidence sources:** legacy repository, WordPress export, and live public site  
**Purpose:** approve canonical biography, portrait, name/year, URL, and migration disposition before implementation

## Executive summary

All 150 repo and WordPress records are represented exactly once in the reconciliation files. The live archive displays 149 cards. It provides working biography links for 135, no image-only links, no currently broken card links, 14 visible cards without anchors, and one omitted inductee (Gene Rozelle). All 150 direct detail URLs return successfully.

The content is not ready for a blind bulk import:

- 92 records require board/content review.
- 92 are blocked by biography/content decisions.
- 33 are blocked by portrait/media issues.
- 15 lack a working archive-to-biography path on the live site.
- 47 have no current content, media, or link blocker.
- 52 have acceptable content/media candidates and can be prepared automatically if five live-link defects are corrected in the new archive.

The single most serious defect is Robert Schnabel: his card has no link and his direct live/WordPress page contains Joe Rossi's biography. He is marked `do_not_migrate_until_fixed`.

This package is designed for row-by-row board decisions. It does not overwrite repo data or authorize platform implementation.

## Package contents

### Primary review table

- `_migration/reconciliation/inductee-reconciliation.csv`
- `_migration/reconciliation/inductee-reconciliation.json`

Each of the 150 rows includes:

- repo, WordPress, and live names/slugs/URLs;
- repo and WordPress years;
- repo, WordPress, and live portrait references;
- live visibility, card target, response status, and direct-page status;
- biography comparison and word counts;
- canonical biography source classification;
- live link, biography, and media status;
- proposed future canonical Astro URL;
- redirect need and source aliases;
- blocker flags, migration action, and reviewer notes.

### Issue queues

- `media-issues.csv` — 104 traceable media issue rows.
- `live-link-issues.csv` — 16 issue rows covering 15 affected inductees; Robert has both no-link and wrong-person-page entries.
- `redirects-review.csv` — 157 source/target/status rows, including exact case variants and the live Wiley Chance alias.
- `event-conversion-issues.csv` — 23 event, donation, comment, sponsor, login, and Ad Grants findings.

## What is safe to migrate automatically

### Safe structural data

The following can be generated automatically for all 150 records after board approval of the URL strategy:

- stable WordPress ID as migration provenance;
- repo and WordPress legacy aliases;
- current production URL;
- proposed canonical URL (current WordPress URL retained initially);
- redirect candidates;
- source word counts and review classifications;
- live response and image checks.

### Content/media candidates without blockers

Fifty-two records have no biography or media blocker. Five of these have only an archive-link defect—Al Raglin, Arny Karraker, Gene Rozelle, Julius Carabello, and Richard Fanning—which a correctly generated future archive can repair.

Forty-seven currently have no content, media, or live-link blocker:

Art Wollenweber; Bill Vincent; Bob Meisner; Bruce Bradshaw; Bud Best; Dave “Chick” Baker; David Letofsky; Dennis Smith; Doug Graham; Ed O'Connor; Edward Stevens; Ernie Ortiz; Frank Prentup; Fred Zuercher; Gary Baker; George Demetriou; H.R. Phillips; Jack Smith; Jim Dorsey; Joe Rossi; Joey Borjon; Ken Furman; Leonard Varriano; Lou Nedbalski; Manual Boody; Mark Denzin; Mike Kronkright; Myran Dunker; Neil Devlin; Paul Babkiewich; Pete DAmato; Ray Belfiore; Raymond Powe; Richard Hawkins; Richard Mauro; Robert Campbell; Roger Kinney; Ron Sisson; Ross Barlow; Steve Heuer; Terry Angell; Terry Reed; Terry Schiessler; Thomas Severtson; Tim Kardatzke; Virgil Jester; Willie White.

“No blocker” still requires normal proofreading, portrait visual verification, and redirect testing. It means no evidence conflict currently requires a board decision.

## What requires board review

### Biography/content review: 92 records

The board-review set consists of:

- 62 materially different repo/WordPress biographies;
- 27 incomplete biographies;
- Robert Schnabel's incorrect content;
- Sam Corsentino/Corentino naming review;
- Walt Clay induction-year review.

The materially-different count is 62 rather than the prior audit's 63 because Robert Schnabel has been elevated into the more severe `incorrect_content` category.

### Media review: 33 blocked records

The media-blocked set contains:

- 32 live placeholder portraits;
- Terry/Ray Garvey identity/portrait conflict.

Five placeholder cases have a repo portrait candidate and should be visually verified before being considered resolved:

- Dave Schmidt
- Don Cimaglia
- Edmund DHaillecourt
- Ervin Douglas
- Joe Bellich

The remaining 27 portrait cases remain unresolved across repo, export, and live sources.

### Live-link review: 15 affected records

Fourteen cards have no anchor and Gene Rozelle has no card. This is a live-site defect, not missing content: all 150 direct pages return successfully.

The 14 no-anchor cards are Al Raglin, Arny Karraker, Francis Ford, Irv Moss, Julius Carabello, Ken Zetner, Leo Bahl, Lou Nolin, Lou Spector, Richard Chandler, Richard Fanning, Robert Schnabel, Walt Clay, and Warren Kettner.

## What live-site issues must not be preserved

1. Robert Schnabel's Joe Rossi biography.
2. The archive omission of Gene Rozelle.
3. Fourteen visible cards without biography anchors.
4. Person-specific filenames containing the same generic placeholder image.
5. Terry/Ray Garvey naming and portrait ambiguity.
6. WordPress `_thumbnail_id` assignments that point to another person.
7. Public comments and comment forms on inductee/event content.
8. Sitewide public Login UI without a defined member feature.
9. Event sponsorship handled through public comments and personal email.
10. Stale Eventbrite banquet registration.
11. Broken banquet `Time: 31, 2026` and zeroed countdowns.
12. Wiley Chance alias reliance without an explicit migration redirect.

## Top content risks

### 1. Robert Schnabel wrong-person biography

The live/export biography is unequivocally Joe Rossi's. Use the repo text only as a review candidate; do not publish until approved.

### 2. Sixty-two materially different biographies

These cannot be resolved mechanically by choosing the longer source. Rewrites may add useful detail, alter meaning, or introduce errors. A designated reviewer must select repo, WordPress, or a merged version.

### 3. Twenty-seven incomplete biographies

The board should decide one of three states per record:

- publish a clearly labeled placeholder profile;
- keep the profile searchable but biography unpublished;
- complete the biography from primary records before launch.

### 4. Identity and year ambiguity

- Sam Corsentino vs. Sam Corentino.
- Terry Garvey vs. live `Ray Garvey` card/image.
- Walt Clay: `1990` vs. `Pre 1990`.
- Steve Usecheck vs. Steve Usecheck Jr. should also be confirmed during normal review.

### 5. Source timestamps are not proof

All WordPress records have newer modification timestamps than the repo's last commit. That establishes production recency, not historical accuracy.

## Top media risks

1. Twenty-seven portraits remain unresolved.
2. Thirty-two live cards display the same placeholder binary under person-specific filenames.
3. Thirty-nine WordPress featured-image assignments appear to belong to another inductee.
4. Terry/Ray Garvey has a person-identity mismatch, not merely a filename typo.
5. Three published media URLs lack attachment records in the XML.
6. The XML contains no binaries; a full uploads archive is still required.
7. A successful HTTP response proves availability, not that the portrait depicts the correct person.

## Top live-link risks

1. Gene Rozelle is omitted from the live archive.
2. Fourteen visible cards have no anchor.
3. Robert Schnabel's no-link card hides a direct page with incorrect content.
4. Wiley Chance depends on a root alias redirect to reach the canonical detail page.
5. Current WordPress URLs use mixed underscores, hyphens, case, and one root-level outlier; redirect handling must be exact.

## Classification guidance

### `canonical_bio_source`

- `wordpress`: WordPress is materially more complete and no board-level conflict is known.
- `repo`: repo is materially more complete and no board-level conflict is known.
- `merged_candidate`: sources are substantively equivalent; canonical cleanup can be generated.
- `board_review_required`: sources conflict, are incomplete, or have identity/year/content defects.
- `live`: reserved for genuine live-only content; no row currently depends solely on this source.

### `migration_action`

- `migrate_as_is`: equivalent candidate with no known blocker.
- `use_wordpress_bio`: use reviewed WordPress text.
- `use_repo_bio`: use reviewed repo text.
- `manually_merge`: materially different sources.
- `board_review`: incomplete or identity/year decision.
- `fix_media`: content can proceed but portrait must be replaced.
- `fix_live_link`: content/media can proceed but current archive linkage is defective.
- `do_not_migrate_until_fixed`: severe wrong-person or equivalent blocking defect.

## Recommended board review workflow

### Step 1 — Assign decision owners

Name one content authority and one archival fact-checker. Record reviewer name and review date outside the generated evidence fields.

### Step 2 — Resolve blocking identity errors first

Review, in order:

1. Robert Schnabel
2. Terry/Ray Garvey
3. Walt Clay
4. Sam Corsentino/Corentino
5. Steve Usecheck/Jr.

### Step 3 — Review the 62 materially different biographies

For each row:

- compare repo and WordPress text side by side;
- select `repo`, `wordpress`, or `merged`;
- correct factual errors without silently rewriting historical claims;
- approve display name, year, and excerpt;
- record source/provenance notes.

### Step 4 — Disposition the 27 incomplete records

Use one controlled status: `approved_placeholder`, `hold_unpublished`, or `complete_before_launch`.

### Step 5 — Review portraits visually

- verify the person, not just filename;
- approve one canonical original;
- record alt text and credit/source;
- reject placeholder binaries as portraits;
- verify the five repo rescue candidates;
- resolve Terry/Ray Garvey separately.

### Step 6 — Approve URLs and redirects

Retain current WordPress paths for the first migration unless the board explicitly accepts broader URL change risk. Review every row in `redirects-review.csv`, including path case variants.

### Step 7 — Freeze the canonical package

After review, produce a new approved dataset rather than overwriting these evidence drafts. Include reviewer, approval date, content hash, source selection, and outstanding status.

## Recommended acceptance criteria before Astro implementation

Do not begin final page implementation until all of the following are true:

- [ ] Exactly 150 approved canonical records exist, each with a stable ID.
- [ ] Every record has an approved display name, induction year/era, canonical URL, and source provenance.
- [ ] Robert Schnabel's biography is corrected and approved.
- [ ] Terry/Ray Garvey, Sam Corsentino/Corentino, Walt Clay, and Steve Usecheck/Jr. are resolved.
- [ ] Every materially different biography has a recorded source/merge decision.
- [ ] Every incomplete biography has an approved publication status.
- [ ] Every portrait is either visually verified or explicitly marked as an approved placeholder state.
- [ ] No person-specific `Missing` file is treated as a genuine portrait.
- [ ] All 39 featured-image mismatches are ignored or corrected in canonical data.
- [ ] A complete uploads/media backup has been obtained and hashed.
- [ ] Every canonical page is represented once in the archive.
- [ ] Every archive card links to its canonical biography.
- [ ] Every redirect has approved source, target, and status with no chains.
- [ ] Current production sitemap/Search Console URLs have been reconciled.
- [ ] Event comments, public login, sponsor leak, stale Eventbrite links, countdowns, and banquet Time are explicitly excluded from migration.
- [ ] Board-approved donation trust content and sponsor requirements are documented separately.

Meeting these criteria authorizes implementation planning; it does not itself authorize production cutover.

## Decision summary

The recommended next phase is a **board-led canonical content approval sprint**, not Astro implementation. Use the reconciliation CSV as the work queue, resolve the 92 content-blocked records and 33 media-blocked records, obtain the uploads/Eventbrite evidence, and freeze an approved 150-record canonical dataset. Once the acceptance checklist is complete, the team can move into implementation with far less risk of preserving current content and conversion defects.
