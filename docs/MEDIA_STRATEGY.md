# Media Strategy

## Storage roles

| Store | Purpose | Must not contain |
|---|---|---|
| Google Drive or SharePoint | Long-term, access-controlled event originals and related release/source records. | Public delivery assumptions or build dependencies. |
| Cloudflare R2 | Approved, optimized public website derivatives. | The only copy of an original, unreviewed camera dumps, or private media. |
| Git repository | Small site-critical assets, manifests, and temporary compatibility derivatives required by current routes. | RAW files, full-resolution event sets, or bulk originals. |

Originals are archival records. R2 objects are reproducible publishing outputs. Losing or replacing an R2 object should be recoverable by regenerating it from the controlled originals archive.

## Originals archive

Choose Google Drive or SharePoint based on JR and Associates' existing identity, retention, and backup practices; do not split one event across both without a documented reason. A useful structure is `Events/<year>/<event-slug>/Originals/`, plus folders for selections, releases/permissions, and working exports. Preserve original filenames and capture dates, restrict write access, and record who approved publication.

The repository's `content/Photos/` directory contains inductee migration inputs. It is not evidence that Git is the correct long-term archive for event photography.

## R2 public derivatives

- Upload only reviewed derivatives sized and compressed for the web.
- Use stable, lowercase object keys such as `events/golf/2024/umpires-cup-ii/web/2024-umpires-cup-ii-001.webp` and the matching `thumbs/` key.
- Set correct `Content-Type` and cache metadata, and use immutable filenames when bytes may change.
- Strip unnecessary EXIF/XMP/IPTC metadata unless a specific copyright workflow requires it.
- Keep captions, alt text, dimensions, event/year, and object URLs in a versioned manifest.
- Use a custom media domain owned within the JR and Associates Cloudflare zone; do not rely permanently on a development hostname.

## Current repository state

The committed 2024 golf gallery contains 158 WebP display images (maximum generated width 1800 px) and 158 thumbnails (maximum generated width 500 px). These are optimized derivatives, not full-resolution originals. They remain in `public/` only to preserve the current gallery until an R2 domain and objects are verified. After cutover, remove the local copies in a separate behavior-reviewed change.

The About-page first-pitch photo is retained as a required site derivative at 1200×1600, reduced from the prior 3024×4032 public file. Other public images above routine web size should receive the same source/usage review before optimization or archival.

See [EVENT_GALLERY_WORKFLOW.md](EVENT_GALLERY_WORKFLOW.md) for publishing steps and [R2_MEDIA_MIGRATION.md](R2_MEDIA_MIGRATION.md) for the bucket, URL, test, cutover, and rollback contract.
