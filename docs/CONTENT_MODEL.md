# Inductee Content Model

`src/data/inductees.json` is the hand-maintained source of truth for the inductee archive. Each record renders a biography page at `/inductees/<canonical_slug>/` and a card on `/inductees/`. The WordPress-migration generator that first produced this file was retired in September 2026 because its inputs no longer matched the published data; the migration inputs remain in Git history.

## Fields the site uses

| Field | Meaning |
|---|---|
| `stable_id` | Permanent unique ID. Never reuse or change it. Migrated records use `jrhof-wp-<n>`. New records use `jrhof-<year>-<canonical_slug>`. |
| `display_name`, `sort_name` | For example `"Terry Angell"` and `"Angell, Terry"`. Event records reference inductees by exact `display_name`. |
| `aliases` | Alternate spellings, used only by archive search. |
| `induction_year` or `induction_era` | Class year, a number such as `2026`, or an era label such as `"Pre 1990"` with `induction_year: null`. |
| `canonical_slug` | URL slug, lowercase with underscores (`terry_angell`). Never change a published slug; add a redirect instead. |
| `proposed_canonical_url` | Must be exactly `/inductees/<canonical_slug>/`. |
| `bio_status` | `available` renders `biography`. `pending_review` renders a neutral "verified biography not yet available" panel. |
| `biography` | Array of paragraphs, formatted as described in [Biography formatting](#biography-formatting). |
| `portrait_status` | `verified_candidate` uses the R2 portrait from `manifests/r2/inductee-portraits-v1.json`. `pending_review` uses the shared placeholder, `https://media.jrhof.org/inductees/placeholders/v1/missing-inductee.webp`. |
| `portrait_url` | The resolved R2 URL: the inductee's `profile.webp` when verified, otherwise the placeholder. Validation requires it to match the manifest, and `inducteePortrait()` in `src/lib/media.ts` does the rendering. |
| `board_review_required` | `true` withholds the biography and portrait from structured data. |

The other fields are migration metadata: `current_wordpress_url`, `legacy_repo_url`, `redirect_sources`, `bio_source`, `portrait_source`, `portrait_output_filename`, `live_link_status`, `migration_lane`, `publication_status`, `reviewer_notes`, and `source_provenance`.
- **Keep them on existing records.** `reviewer_notes` records unresolved identity questions.
- **Fill them on new records.** Copy an existing record's shape.
- **Don't render them.** They are never shown publicly.

## Biography formatting

`src/lib/biography.ts` turns the `biography` strings into the page. It changes presentation only, never wording.

- **Header lines.** Leading lines such as `2026 Hall of Fame Inductee – Terry Angell (Morrison)` or `Bert Borgmann – Denver` are not repeated in the body. The page shows the hometown next to the class year, and a `Nominated by … • Presented by …` credit under it.
- **Subheadings.** Start a paragraph with `## ` (for example `## Career Highlights`). Keep it under 80 characters.
- **Lists.** Start each item with `- `. Consecutive items form one list; put the sentence that introduces the list in the paragraph before it.
- **Pull quotes.** A paragraph that is a single quotation, from `“` to `”`, is set as a quote.
- **Links.** The first mention of another inductee's full name links to their page, and the first mention of an organization in `referenceLinks` (CHSBUA, CHSAA, NFHS, the Colorado Sports Hall of Fame, the Connie Mack World Series, Referee Magazine, NASO) links to its official site. When a name in a biography might be a different person with the same name, list it in `unconfirmedMentions` until the organization confirms the identity.
- **Description.** The first body paragraph becomes the page's search description and the `Person` description in structured data, cut at a sentence boundary.

When copying a biography from a document, paste only the finished text. Validation fails on editor notes such as "(Bold = hyperlink targets)", a "Revised Biography" label, bracketed web citations like `[example.com]`, research notes, markdown or web-page title residue, and a biography that contains a second, reworded copy of itself. If a source document holds two versions, keep the one the organization approved.

## Add a new inductee class

1. **Add records.** Add one record per inductee, copying a recent record such as Terry Angell. Use `bio_status: "available"` only for a verified biography supplied by the organization.
2. **Update the count.** Raise `EXPECTED_INDUCTEES` in `scripts/validate-foundation.mjs`. If any new inductee starts without a portrait (`pending_review`, with `portrait_url` set to the placeholder), raise `EXPECTED_UNRESOLVED_PORTRAITS` too.
3. **Add portraits.** Follow `docs/MEDIA.md` for any portraits that are ready.
4. **Link from the event.** List the names in the banquet's `inductees` array in `src/data/events.ts`.
5. **Verify.** Run `npm run verify`, then check the archive card, the biography page, and the event page.

## Standing rules

- Each person has exactly one record, and `stable_id` and `canonical_slug` are unique. Validation enforces this, along with the expected counts.
- Robert Schnabel's biography must come only from his original source document, never from the WordPress-era text. Validation enforces this.
- Terry/Ray Garvey and Sam Corentino/Corsentino are identity-blocked. They keep the placeholder until the organization confirms the identity.
- Gene Rozzelle stays in the archive, with Gene Rozelle kept as an alias.
- Public pages never show review status, provenance, reviewer notes, or "pending review" wording.
