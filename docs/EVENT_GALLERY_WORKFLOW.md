# Event and Gallery Publishing Workflow

## 1. Preserve originals

Copy the complete camera delivery to the approved JR and Associates Google Drive or SharePoint event folder. Verify the copy before cards/drives are erased. Keep originals, selections, permissions/releases, and working exports distinct. Do not place the source drop in Git.

## 2. Curate and review

Remove accidental captures, exact/near duplicates, unusable frames, and media that lacks publication approval. Confirm event name, year, photographer credit, captions, and any privacy restrictions. Record the final selection independently of the derivative filenames.

## 3. Generate derivatives outside Git

Create display and thumbnail variants with consistent orientation, color profile, dimensions, format, and metadata stripping. WebP is the current gallery format. The existing 2024 helper expects originals in the ignored `2024 Golf Tournament Pictures/` directory:

```bash
npm run gallery:2024 -- --audit-only
npm run gallery:2024
```

The tracked 2024 helper generates 1800 px display images, 500 px thumbnails, and `src/data/galleries/golf-2024.json`. New R2-only galleries use the generalized ignored-output workflow:

```bash
npm run gallery:2025
npm run gallery:2026
npm run media:2025:verify-local
npm run media:2026:verify-local
```

`scripts/gallery-media.mjs` writes generated binaries only under ignored `.local-media/` paths and commits deterministic metadata/checksum manifests under `manifests/r2/`. Never force-add the source directories or `.local-media/`.

## 4. Publish derivatives to R2

Upload only approved derivatives to the organization-owned R2 bucket. Use the paths and staged verification in [R2_MEDIA_MIGRATION.md](R2_MEDIA_MIGRATION.md), set content types/cache metadata, and compare object counts/checksums with the local export. Originals remain in Drive/SharePoint.

## 5. Update site records

Add or update the typed event record in `src/data/events.ts` and its gallery manifest. Use final R2 URLs only after every object loads and checksum-verifies through the production media domain.

## 6. Validate and release

Run the commands in [VALIDATION.md](VALIDATION.md), open the gallery in a preview deployment, verify thumbnails/lightbox/full images on mobile and desktop, check alt text and keyboard behavior, and confirm that no original/source folder is staged. After production verification, retain the derivative export only as long as operationally useful; the originals archive remains authoritative.

## 7. Rollback

Keep the previous manifest and R2 objects through the release window. If the gallery fails, restore the last known-good manifest/deployment. Do not overwrite working objects in place when an immutable filename can make rollback safer.
