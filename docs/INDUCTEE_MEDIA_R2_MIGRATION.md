# Inductee Portrait Media Audit and R2 Migration Plan

## Scope

This is a planning and dependency audit only. No inductee portrait was converted, uploaded, deleted, or redirected during the event-gallery work. The deterministic inventory is stored at `manifests/audits/inductee-media.json` and can be regenerated with `npm run media:inductees:audit`.

## Current inventory

- 150 inductee records are defined in `src/data/inductees.json`.
- 125 media files are tracked under `public/images/inductees/`.
- 117 records have `portrait_status: verified_candidate` and reference 117 distinct tracked portraits.
- 33 records have `portrait_status: pending_review`; the biography and archive routes display the shared `/images/inductees/missing_inductee.webp` placeholder for all 33.
- 118 unique public URLs are currently used at runtime: 117 verified portraits plus the shared placeholder.
- No current portrait URL is broken.
- Seven tracked files are not referenced by current runtime logic:
  - `Don_Cimaglia.jpg`
  - `Edmund_DHaillecourt.jpg`
  - `Ervin_Douglas.jpg`
  - `Joe_Bellich.jpg`
  - `Ray_Garvey.jpg`
  - `Sam_Corsentino.jpg`
  - `portrait-pending.svg`
- Four of those unreferenced JPEGs (`Don_Cimaglia`, `Edmund_DHaillecourt`, `Ervin_Douglas`, and `Joe_Bellich`) are byte-identical. They must remain quarantined from migration until identity and provenance are reviewed.
- `Ray_Garvey.jpg` is intentionally not connected to Terry Garvey because the identity mismatch remains board-review blocked. `Sam_Corsentino.jpg` is similarly not connected to the pending Sam Corentino record.

The audit manifest lists every tracked file with its public URL, format, dimensions, byte count, SHA-256 hash, referencing records, and proposed R2 key.

## Current consumers and removal risk

Local portrait URLs are used directly; there is no inductee-media resolver yet.

| Consumer | Usage | Effect of deleting local files before cutover |
|---|---|---|
| `src/pages/inductees/[slug].astro` | Biography portrait, Open Graph image, and verified `Person.image` schema | Broken biography images and invalid social/schema image URLs |
| `src/pages/inductees/index.astro` | All archive cards and the shared missing portrait | Broken archive cards for every removed portrait; 33 cards break if the placeholder is removed |
| `src/pages/index.astro` | Current class portraits | Broken homepage portraits for referenced class members |
| `src/pages/events/induction-banquet/index.astro` | Banquet inductee cards | Broken banquet portraits for referenced class members |

Removing any of the 117 verified portraits now would break at least its biography and archive card. Removing `missing_inductee.webp` would break 33 biography portraits and 33 archive cards. The seven unreferenced files do not currently affect rendered routes, but they may be unresolved candidates and must not be deleted as part of a mechanical cleanup.

## Proposed R2 object layout

Publish only approved, metadata-stripped public derivatives. Originals remain in the organization-controlled Google Drive or SharePoint archive.

```text
inductees/
  portraits/
    v1/
      terry_angell/
        profile.webp
        card.webp
      george_demetriou/
        profile.webp
        card.webp
      ...
  placeholders/
    v1/
      missing-inductee.webp
```

- `profile.webp`: uncropped portrait derivative sized for biographies and social metadata.
- `card.webp`: smaller derivative for archive, homepage, and banquet cards.
- Canonical slugs, not source filenames, define identity in object keys.
- Keys are versioned and immutable. Set `Content-Type: image/webp` and `Cache-Control: public, max-age=31536000, immutable`.
- A corrected portrait must use `v2` or another new key; do not overwrite bytes behind an immutable `v1` URL.
- Do not create keys for pending or ambiguous candidate files until the corresponding record is approved.

## Proposed manifest

Commit a deterministic `manifests/r2/inductee-portraits-v1.json` containing metadata only:

```json
{
  "schemaVersion": 1,
  "bucket": "jrhof-media-public",
  "prefix": "inductees/portraits/v1",
  "contentType": "image/webp",
  "cacheControl": "public, max-age=31536000, immutable",
  "records": [
    {
      "stableId": "jrhof-wp-2977",
      "slug": "terry_angell",
      "displayName": "Terry Angell",
      "portraitStatus": "verified_candidate",
      "source": {
        "trackedPath": "public/images/inductees/Terry_Angell.jpg",
        "sha256": "..."
      },
      "variants": {
        "profile": {
          "key": "inductees/portraits/v1/terry_angell/profile.webp",
          "width": 960,
          "height": 1440,
          "bytes": 0,
          "sha256": "..."
        },
        "card": {
          "key": "inductees/portraits/v1/terry_angell/card.webp",
          "width": 400,
          "height": 600,
          "bytes": 0,
          "sha256": "..."
        }
      }
    }
  ]
}
```

The production manifest should also include the approved placeholder as a separate object and a `pendingRecords` list that records missing/blocked status without assigning an unverified candidate image.

## Recommended migration sequence

1. Review the 33 pending records and seven unreferenced files; resolve identity/provenance separately from mechanical conversion.
2. Generate `profile` and `card` WebP variants for the 117 verified records plus the approved shared placeholder in an ignored local workspace.
3. Generate the deterministic manifest and verify dimensions, metadata stripping, byte counts, and SHA-256 hashes.
4. Upload to `jrhof-media-public` under the versioned keys and verify every object through `https://media.jrhof.org`.
5. Add an inductee portrait resolver that consumes the manifest and preserves local fallback during preview testing.
6. Update biography, archive, homepage, banquet, Open Graph, and `Person.image` consumers together. A partial resolver would leave broken or inconsistent references.
7. Test all 150 biography routes, the archive grid, homepage class cards, banquet cards, placeholders, social metadata, and schema through a non-production Worker version.
8. Cut over only after approval. Remove local portraits in a later cleanup commit after production verification; do not combine deletion with the first URL switch.

## Decision gate

No inductee files should be removed from Git until the R2 manifest exists, every approved object passes checksum verification through `media.jrhof.org`, all five rendering/metadata consumers use the resolver, the 33-record placeholder behavior is preserved, and a Worker rollback version has been recorded.
