# Event Media Workflow

## Storage contract

Event media has three distinct homes:

1. **Google Drive is the permanent archive.** The photographer uploads the complete original delivery to the approved JRHOF/JR and Associates Drive location. Preserve originals, permissions, and source notes there.
2. **The Git repository stores code and metadata.** Originals and generated image binaries are never committed. Only deterministic gallery manifests are tracked.
3. **Cloudflare R2 is public delivery.** The `jrhof-media-public` bucket contains approved, optimized derivatives only. Those objects are served through `https://media.jrhof.org`.

Originals are never served directly from R2. If a public object is lost, regenerate it from the controlled Google Drive archive.

## Media paths

New event directories mirror the website route after the hostname:

```text
Website: /events/induction-banquet/2026-hall-of-fame-induction-banquet/
R2:      events/induction-banquet/2026-hall-of-fame-induction-banquet/

  hero.webp
  gallery/
  thumbs/
  documents/
```

Each event is self-contained. Use lowercase paths and predictable filenames such as `2026-hall-of-fame-induction-banquet-001.webp`.

The already-published golf galleries retain their verified legacy R2 keys, including year and revision segments such as `events/golf/2026/umpires-cup-iv/v1/`. Do not move or delete those objects merely to adopt the new convention; existing `media.jrhof.org` URLs are an active compatibility contract. New event media uses route-mirroring.

## Archive originals in Google Drive

1. Create `Events/{event-type}/{event-slug}/Originals/` in the approved Drive.
2. Upload the complete photographer delivery.
3. Compare file counts and spot-check opening files before erasing cards or temporary transfers.
4. Store selection notes, releases, usage restrictions, and photographer attribution beside the originals.
5. Keep Drive originals permanently and restrict write access appropriately.

## Process a gallery

The default command processes the 139 root-level approved selections in `2026_CHSBUA_HOF_Induction_Banquet/`. The nested `[Originals]` directory is excluded to prevent duplicate camera files from entering the public gallery.

```bash
npm run event:media:process
npm run event:media:validate
```

The processor:

- normalizes EXIF orientation;
- resizes both landscape and portrait images by long edge;
- converts display images, thumbnails, and the hero to WebP;
- strips EXIF, GPS, IPTC, and XMP from public derivatives;
- writes predictable filenames;
- records source and derivative checksums, dimensions, byte sizes, object keys, and alt text;
- writes binaries only under ignored `.local-media/generated/`;
- writes the tracked manifest to `manifests/r2/banquet-2026.json`.

Source copyright and photographer metadata are not copied into image files because embedded metadata can contain GPS or private workflow information. Record confirmed photographer credit in `src/data/events.ts` instead.

## Upload to R2

Authenticate Wrangler for the JR and Associates Cloudflare account, then run:

```bash
npx wrangler whoami
npm run event:media:upload -- --apply
npm run event:media:validate-remote
```

The upload command requires the explicit `--apply` flag, uploads only manifest-listed derivatives to `jrhof-media-public`, and sets:

```text
Content-Type: image/webp
Cache-Control: public, max-age=31536000, immutable
```

The remote validator fetches every object through `media.jrhof.org` and compares HTTP metadata, exact bytes, and SHA-256 checksums. Do not set an event gallery to published until this validation passes.

For a manual upload, use each manifest `localPath` as the source and `key` as the R2 object key, preserving the same content type and cache policy. Do not upload any path outside the manifest.

## Add another event to the processor

1. Add a configuration entry to `eventConfigs` in `scripts/event-media.mjs`.
2. Set its event ID, route event type, descriptive slug, source directory, and reviewed root-level image count.
3. Run the processor with `--event {id}`.
4. Add package scripts only when a stable operator shortcut is useful.
5. Commit the generated manifest and event data, not `.local-media/` or the source folder.

## Validation checklist

- Originals have been copied and verified in Google Drive.
- Publication rights and selections have been reviewed.
- The local source folder and `.local-media/` are ignored.
- Only approved root-level selections are processed.
- Orientation, color, crops, and representative portraits/landscapes look correct.
- No generated derivative retains EXIF, GPS, IPTC, or XMP.
- Manifest image/object counts match the output.
- Every R2 object passes public-origin checksum verification.
- The gallery loads on desktop and mobile with keyboard and touch controls.
- `git status --ignored` shows originals and generated binaries as ignored, never staged.
