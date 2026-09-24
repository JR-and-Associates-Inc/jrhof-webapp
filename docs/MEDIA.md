# Media

This covers where photos live, how R2 keys are laid out, how to publish an event gallery, and how to add an inductee portrait.

## Where media lives

| Store | Holds | Never holds |
|---|---|---|
| JR and Associates Google Drive (`Events/<event-type>/<event-slug>/Originals/`) | Complete photographer deliveries, selections, releases, and attribution notes. This is the permanent archive. | Anything the website build depends on. |
| Cloudflare R2 `jrhof-media-public`, served only at `https://media.jrhof.org` | Approved, optimized, metadata-stripped WebP derivatives, plus the flyers and PDFs linked from event records. | Originals, unreviewed camera dumps, private media. |
| Git | Code, and deterministic metadata manifests in `manifests/r2/`. | Image binaries for galleries or portraits, originals, RAW files. |

- The bucket's `r2.dev` development URL is disabled and must stay disabled.
- The private `jrhof-media-intake` bucket is optional, empty staging.
- If an R2 object is lost, regenerate it from the Drive original.

Local working folders are gitignored and must never be force-added:
- `media-sources/<event-id>/`: approved gallery selections.
- `content/Photos/`: inductee portrait originals.
- `.local-media/`: generated derivatives.

## R2 key layout

- **New event media mirrors the site route:** `events/<event-type>/<slug>/{hero.webp,gallery/,thumbs/,documents/}`. For example, `/events/induction-banquet/2026-hall-of-fame-induction-banquet/` maps to `events/induction-banquet/2026-hall-of-fame-induction-banquet/`.
- **Published golf galleries keep their original keys** (`events/golf/2024/umpires-cup-ii/`, `events/golf/2025/umpires-cup-iii/v1/`, `events/golf/2026/umpires-cup-iv/v1/`). Those URLs are live, so don't move them.
- **Inductee portraits** are `inductees/portraits/v1/<slug>/{profile,card}.webp`. Every inductee without a verified portrait uses the one shared placeholder, `https://media.jrhof.org/inductees/placeholders/v1/missing-inductee.webp`. There is no local copy in `public/`, and validation fails if a page renders any other image for them.
- **All objects** use `Content-Type: image/webp` and `Cache-Control: public, max-age=31536000, immutable`. Because they are cached as immutable, never overwrite a published key with different bytes; publish under a new key instead.

Site code resolves media through `src/lib/media.ts` and `src/config/media.ts`, never through hardcoded URLs.

## Publish an event gallery

`scripts/event-media.mjs` handles one event at a time. Its output is a manifest at `manifests/r2/<event-id>.json` plus derivatives under `.local-media/generated/`.

1. **Archive** the full delivery in Google Drive and verify the copy.
2. **Curate.** Remove duplicates, unusable frames, and anything without publication approval. Confirm the photographer credit.
3. **Stage** the approved selections, root-level files only, in `media-sources/<event-id>/`.
4. **Configure.** Add an entry to `eventConfigs` in `scripts/event-media.mjs`: `id` matching the event in `src/data/events.ts`, `eventType`, `year`, `title`, `slug`, `sourceDirectory: 'media-sources/<event-id>'`, `expectedImages`, and `galleryDirectory: 'gallery'`.
5. **Process and check locally:**
   ```bash
   npm run event:media -- process --event <event-id>
   npm run event:media -- validate --event <event-id>
   ```
   The processor fixes orientation, resizes to a 2000px long edge (640px thumbnails, 2400px hero), strips EXIF/GPS/IPTC/XMP, and records checksums, dimensions, keys, and alt text.
6. **Upload and verify remotely.** These steps need maintainer approval and a Wrangler login to the JR and Associates account (`npx wrangler whoami`):
   ```bash
   npm run event:media -- upload --apply --event <event-id>
   npm run event:media -- validate-remote --event <event-id>
   ```
7. **Wire it into the site.**
   - Import the manifest in `src/pages/events/[eventType]/[slug].astro` and add it to the `manifests` map.
   - Add the id to the `EventGallery['manifest']` union in `src/data/events.ts`.
   - Set the event's `gallery` to `{ status: 'published', manifest, mediaPath, count }` and `status: 'gallery-published'`, and add `photographer`.
8. **Verify.** Run `npm run verify`, then check the gallery on desktop and mobile with keyboard and touch.

Commit only the manifest and data changes, never `media-sources/` or `.local-media/`.

## Add an inductee portrait

`scripts/optimize-inductee-portraits.mjs` makes a 960px `profile` and a 400px `card` WebP for each verified inductee. It records them in `manifests/r2/inductee-portraits-v1.json`, which `inducteePortrait()` reads. It carries existing manifest records forward unchanged and only encodes portraits that aren't in the manifest yet, so a run never disturbs published portraits.

1. **Place the approved original** at `content/Photos/<Name>.jpg`. Keep the original in Drive too.
2. **Update the record** in `src/data/inductees.json`: set `portrait_status: "verified_candidate"`, `portrait_source: "content/Photos/<Name>.jpg"`, `portrait_output_filename: "<Name>.jpg"`, and `portrait_url: "https://media.jrhof.org/inductees/portraits/v1/<canonical_slug>/profile.webp"`.
3. **Generate and check locally:**
   ```bash
   npm run portraits -- generate --slug <canonical_slug>
   npm run portraits -- verify-local --slug <canonical_slug>
   ```
4. **Upload and verify remotely** (requires maintainer approval):
   ```bash
   npm run portraits -- upload --apply --slug <canonical_slug>
   npm run portraits -- verify-remote --slug <canonical_slug>
   ```
5. **Update the count and verify.** If the person was previously pending, lower `EXPECTED_UNRESOLVED_PORTRAITS` in `scripts/validate-foundation.mjs`. Then run `npm run verify`.

Validation fails if a verified inductee has no manifest record, or if a manifest record has no verified inductee. Pending or identity-blocked people keep the shared placeholder, and no R2 key is minted for them.
