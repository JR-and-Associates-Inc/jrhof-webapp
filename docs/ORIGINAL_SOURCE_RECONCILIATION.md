# JRHOF Original-Source Reconciliation

## Executive summary

The control roster contains exactly 150 unique inductees and maps one-to-one to the 150 records in the existing reconciliation. The new original-source package contains 155 DOCX biography files and 156 photo files. It materially improves 63 inductee records and raises the safe or near-safe migration group from 47 to 113 records without changing production behavior.

The strongest gain is biography provenance. Of 92 prior biography/content blockers, 62 are cleared by readable, person-matched original DOCX files. Thirty content blockers remain: 27 records still have no readable original biography, Terry/Ray Garvey and Sam Corentino/Corsentino require identity review, and Walt Clay has an unresolved induction-year conflict.

The photo package confirms rather than solves most of the media gap. Thirty-three `Missing` files are byte-identical copies of one placeholder. Four person-named JPGs—Joe Bellich, Don Cimaglia, Edmund DHaillecourt, and Ervin Douglas—are also byte-identical copies of a generic silhouette and are not portraits. Dave Schmidt is the one prior media-blocked record clearly resolved by a person-specific original photo. Thirty-two records remain portrait/media blocked.

Robert Schnabel is now source-resolved: `content/Bios/Robert_Schnabel.docx` is a clearly mapped 2010 Robert Schnabel biography, and `content/Photos/Robert_Schnabel.jpg` is a person-specific portrait candidate. The WordPress/live biography, which contains Joe Rossi's biography, is not selected anywhere as canonical. Robert's archive-card link still needs repair in a later implementation phase.

No source files, prior audits, production routes, or application behavior were modified.

## Evidence and method

This pass reconciles five evidence layers:

1. `content/All Inductees.csv` as the roster/control file.
2. Original DOCX files under `content/Bios/`.
3. Original image files under `content/Photos/`.
4. The repository, WordPress, and live-site facts already normalized in `_migration/reconciliation/inductee-reconciliation.json`.
5. WordPress biography text in `_migration/extracted-content/inductees-draft.json`.

DOCX text was extracted read-only. Names were normalized for punctuation, suffixes, and known aliases, then mapped one-to-one against the control roster. Photos were checked by filename, dimensions, and SHA-256 hash. Any file named `Missing`, the shared `Missing_Inductee.webp`, and byte-identical generic silhouettes were rejected as portrait evidence.

The legacy application source tree is not present in this workspace snapshot. Repository comparisons therefore use the repository facts preserved by the prior audits and reconciliation rather than re-reading the original Next.js files.

## CSV roster inventory

The control CSV has 150 rows and these columns:

- `Name`
- `Year`
- `Image`
- `Bio URL`
- `Picture`
- `Bio`
- `Webpage`

There are no duplicate normalized names. All 150 rows map to exactly one prior known-inductee record, and no known record is left unmatched. The CSV includes 32 `Picture=False` values and 28 `Bio=False` values. Those flags are useful leads, but the actual files and hashes remain the stronger evidence for source availability.

Five ordinary display-name variants map cleanly to the repository: Bert Borgman/Borgmann, Bill/William "Bill" Fanning, Dave/Dave "Chick" Baker, Dick/Richard "Dick" Reininger, and Gene Rozzelle/Rozelle. Three additional cases require substantive review: Terry/Ray Garvey, Sam Corentino/Corsentino, and Walt Clay's year.

## Original biography inventory

- Files found: 155 DOCX files.
- Readable/non-empty files: 127.
- Empty DOCX files: 28.
- Unmatched files: 0.
- Duplicate-candidate mappings: 10 files across five inductees.

The five records with two source versions are Manual Boody (`Boody.docx` and `Manual_Boody.docx`), Bert Borgman (`Borgmann.docx` and `Bert_Borgmann.docx`), Mitchell Burns (`Burns.docx` and `Mitchell_Burns.docx`), Pete Butler (`Butler.docx` and `Pete_Butler.docx`), and Dick Reininger (`Dick_Reininger.docx` and `Richard_Dick_Reininger.docx`). Their text hashes differ, so they are alternate versions rather than byte/text duplicates. The longest readable version is used only as the draft candidate; final editorial selection remains a later decision.

Twenty-seven inductees have no readable biography in any mapped original DOCX. The complete list and concrete empty-file paths are in `remaining-missing-bios.csv`. These are the remaining incomplete biographies; the 28th empty DOCX is an alternate file for a record that also has a readable version.

## Original photo inventory

- Files found: 156.
- Formats: 123 JPG and 33 WebP.
- Unique image hashes: 121.
- Placeholder or generic-silhouette files: 37.
- Unmatched files: 1 (`Missing_Inductee.webp`, intentionally the shared placeholder).

All 33 WebP files containing `Missing` in their names share one image hash. Four additional JPGs share a second hash and depict the same generic silhouette: Joe Bellich, Don Cimaglia, Edmund DHaillecourt, and Ervin Douglas. None are accepted as verified portraits.

Thirty-two records still lack an assignable portrait candidate after all evidence is considered. This is higher than the prior audit's 27 unresolved portraits because source hashing exposed four person-named generic silhouettes and the Terry/Ray identity conflict. It is a correction in evidence quality, not a regression caused by the source package.

Dave Schmidt's person-specific JPG resolves a prior media blocker. George Demetriou also has both a real JPG and a `Missing` duplicate, but the prior reconciliation already had a resolving portrait. Missing duplicates should not override person-specific files.

## Roster discrepancies and special cases

| Record | Finding | Disposition |
|---|---|---|
| Robert Schnabel | Original DOCX clearly identifies Robert, Class of 2010; original JPG is person-specific. WordPress/live page contains Joe Rossi's bio and an extracted year of 1996. | Use the original DOCX as the biography candidate, preserve 2010 from CSV/repo/source, never use the WordPress/live biography, and later repair the archive link. |
| Terry Garvey / Ray Garvey | DOCX is an extensive Terry Garvey biography; photo is `Ray_Garvey.jpg`; live card also says Ray. | Identity-blocked pending board confirmation. Do not assign the photo to Terry yet. |
| Walt Clay | CSV/repo say `Pre 1990`; WordPress/live say 1990. The original biography does not settle induction year. | Board content review. |
| Sam Corentino / Corsentino | CSV/repo/live use Corentino; WordPress and photo filename use Corsentino; bio filename uses Corentino. | Confirm preferred/legal display spelling before canonicalization. |
| Steve Usecheck / Usechek, Jr. | CSV/repo use Usecheck; original biography text uses Usechek, Jr. | Confirm spelling and suffix; content itself is source-resolved. |
| Gene Rozzelle / Rozelle | CSV uses Rozzelle; repo, WordPress, DOCX, and photo use Rozelle. Gene is absent from the live archive. | Confirm display spelling, then restore/fix archive visibility. |
| Wiley Chance | Original DOCX is empty and only a Missing placeholder exists. | Biography and media blocked. |
| Mike Kronkright | CSV image field says `David_Kronkright.jpg`; source contains `Mike_Kronkright.jpg` and a complete biography. | Treat the CSV image filename as stale; retain Mike source candidate after routine visual check. |
| Joe Bellich | Empty DOCX; JPG is generic silhouette. | Biography and media blocked. |
| Dave Schmidt | Readable original biography and person-specific JPG exist alongside a Missing duplicate. | Source-resolved candidate; ignore the Missing duplicate. |
| Don Cimaglia | Empty DOCX; JPG is generic silhouette. | Biography and media blocked. |
| Edmund DHaillecourt | Empty DOCX; JPG is generic silhouette. | Biography and media blocked. |
| Ervin Douglas | Empty DOCX; JPG is generic silhouette. | Biography and media blocked. |

The machine-readable conflict register contains eight rows: five non-blocking name variants, Robert's now source-resolved WordPress year conflict, Sam's spelling/identity conflict, and Walt's blocking year conflict.

## Updated migration status

| Measure | Before original sources | After reconciliation |
|---|---:|---:|
| Biography/content blockers | 92 | 30 |
| Media blockers | 33 | 32 |
| Unresolved portraits | 27 | 32 corrected/verified gaps |
| Incomplete biographies | 27 | 27 |
| Identity/content blockers | 3 | 3 |
| Safe or near-safe candidates | 47 | 113 |

The 150 status rows are distributed as follows:

- 47 `safe_candidate`
- 61 `source_resolved_candidate`
- 5 `auto_prep_link_fix`
- 28 `board_content_review`
- 7 `media_blocked`
- 2 `identity_blocked`

No record currently needs the `do_not_migrate_until_fixed` lane because Robert's correct original biography was found and clearly mapped. Records in content, media, or identity lanes remain excluded from automatic canonicalization until their stated blockers are cleared.

Forty-three records appear in the human-review queue. This includes the 37 blocked records plus source-sensitive spelling, filename, and special-case confirmations. Automated archive-link fixes are not counted as board review unless another manual issue is present.

## What should feed the future canonical dataset

The future canonical inductee dataset should be assembled only after review, using this precedence:

1. Control CSV for roster membership and initial year/era, subject to the conflict register.
2. Clearly mapped, readable original DOCX for biography copy and provenance.
3. Person-specific original photo files for portrait candidates; never `Missing` or generic-silhouette assets.
4. WordPress/live data for current production URLs, redirect preservation, and editorial deltas—not as automatic authority where it conflicts with original evidence.
5. Prior repository data as a cross-check for slugs, years, and content history.

Every future record should retain source paths, source hashes, review status, approved display name, approved year/era, canonical slug, and legacy redirect aliases. The files in this pass are draft evidence products, not final canonical records.

## Recommended next phase

Run a focused board/content approval pass before any platform implementation:

1. Resolve Terry/Ray Garvey, Sam Corentino/Corsentino, Walt Clay, Steve Usecheck/Usechek Jr., Gene Rozzelle/Rozelle, and the five alternate-DOCX version choices.
2. Obtain biographies for the 27 records in `remaining-missing-bios.csv`.
3. Obtain or positively identify portraits for the 32 records in `remaining-missing-photos.csv`.
4. Approve Robert Schnabel's original biography/photo pair and the 2010 year, while recording the existing bad WordPress/live page for replacement and redirect/link testing.
5. After approval, generate a separate canonical-data proposal and media manifest with checksums. Only then begin Astro/Next.js implementation or payment/event work.

## Output and validation index

The new evidence package is under `_migration/source-reconciliation/`:

- `roster-control-inventory.csv`
- `roster-source-comparison.csv`
- `original-bios-inventory.csv`
- `original-photos-inventory.csv`
- `source-file-match-report.csv`
- `updated-inductee-source-status.csv`
- `remaining-missing-bios.csv`
- `remaining-missing-photos.csv`
- `resolved-by-original-files.csv`
- `needs-human-review-after-source-files.csv`
- `name-year-conflicts.csv`
- `source-reconciliation-summary.json`

Validation confirms:

- 150 control rows and 150 unique updated status rows.
- Every known inductee is represented exactly once.
- All 155 biography files and all 156 photo files are inventoried.
- Every unmatched, duplicate-candidate, placeholder, resolved, and remaining-missing item is listed with a concrete source path where one exists.
- Robert Schnabel's WordPress/live biography is not selected as canonical.
