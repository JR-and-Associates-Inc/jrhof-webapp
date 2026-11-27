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
| `biography` | Array of paragraphs. The first paragraph is usually a header like `2026 Hall of Fame Inductee – Name (Hometown)`. The page takes the hometown from it for the "Class of" line and doesn't repeat the header in the body, unless it also names who nominated or presented the inductee. A paragraph that starts with `## ` shows as a section title, and paragraphs that start with `- ` show as one bulleted list. See [Biography text and links](#biography-text-and-links). |
| `portrait_status` | `verified_candidate` uses the R2 portrait from `manifests/r2/inductee-portraits-v1.json`. `pending_review` uses the shared placeholder, `https://media.jrhof.org/inductees/placeholders/v1/missing-inductee.webp`. |
| `portrait_url` | The resolved R2 URL: the inductee's `profile.webp` when verified, otherwise the placeholder. Validation requires it to match the manifest, and `inducteePortrait()` in `src/lib/media.ts` does the rendering. |
| `board_review_required` | `true` withholds the biography and portrait from structured data. |

The other fields are migration metadata: `current_wordpress_url`, `legacy_repo_url`, `redirect_sources`, `bio_source`, `portrait_source`, `portrait_output_filename`, `live_link_status`, `migration_lane`, `publication_status`, `reviewer_notes`, and `source_provenance`.
- **Keep them on existing records.** `reviewer_notes` records unresolved identity questions.
- **Fill them on new records.** Copy an existing record's shape.
- **Don't render them.** They are never shown publicly.

## Add a new inductee class

1. **Add records.** Add one record per inductee, copying a recent record such as Terry Angell. Use `bio_status: "available"` only for a verified biography supplied by the organization.
2. **Update the count.** Raise `EXPECTED_INDUCTEES` in `scripts/validate-foundation.mjs`. If any new inductee starts without a portrait (`pending_review`, with `portrait_url` set to the placeholder), raise `EXPECTED_UNRESOLVED_PORTRAITS` too.
3. **Add portraits.** Follow `docs/MEDIA.md` for any portraits that are ready.
4. **Link from the event.** List the names in the banquet's `inductees` array in `src/data/events.ts`.
5. **Verify.** Run `npm run verify`, then check the archive card, the biography page, and the event page.

## Biography text and links

- **Keep the board's words.** Fix typos, spacing and formatting, and remove editing notes, duplicate drafts and text pasted from other websites. Don't add, reword or "improve" facts. When a record had both an original and a rewritten draft, keep the draft that holds every fact and adds none.
- **Links come only from `src/data/bio-links.json`.** `src/lib/biography.ts` links each listed term once per biography, at its first mention.
  - `organizations`: an organization's name and its official site. Add one only after opening the page and confirming it is that organization's own site.
  - `inductee_mentions`: for each biography, the names of other inductees it mentions. Add a name only after reading the sentence and confirming it is the same person as the linked inductee. A name inside an honor, such as the Joe Rossi Umpires Hall of Fame or a named award, isn't linked.
- **Tracking.** Organization links send `external_partner_click` and inductee links send `inductee_profile_click`, both with `link_context: biography`.
- The person's structured-data `description` is the first body paragraph, not the header.

## Standing rules

- Each person has exactly one record, and `stable_id` and `canonical_slug` are unique. Validation enforces this, along with the expected counts.
- Robert Schnabel's biography must come only from his original source document, never from the WordPress-era text. Validation enforces this.
- The organization confirmed the portraits of Terry Garvey and Sam Corsentino in November 2026. The existing profile URLs and legacy search aliases are preserved.
- Gene Rozzelle stays in the archive, with Gene Rozelle kept as an alias.
- Public pages never show review status, provenance, reviewer notes, or "pending review" wording.
