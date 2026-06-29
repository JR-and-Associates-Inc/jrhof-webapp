# R2 Media Migration Plan

## Scope and invariant

R2 is the delivery store for approved, optimized public derivatives. It is not the archive for original photography. Originals, releases, and source records remain in the approved JR and Associates Google Drive or SharePoint library.

The current 2024 golf gallery stays unchanged until every R2 object and the public media hostname are verified in a Worker preview. The repository's 158 display images, 158 thumbnails, and local manifest paths remain the rollback source during that process. Do not delete them in the upload/testing change.

## Public URL contract

Reserve this build-time Astro variable:

```text
PUBLIC_MEDIA_BASE_URL
```

Rules:

- It is an absolute HTTPS origin with no trailing slash.
- The planned production value is `https://media.jrhof.org`, subject to account/zone approval and R2 custom-domain verification.
- Empty or absent means the site continues using the existing root-relative repository assets.
- It is public configuration, not a secret. R2 credentials, API tokens, and upload credentials must never use a `PUBLIC_` variable.
- Gallery code does not consume the variable yet. Adding a single URL resolver and switching the manifest is a later, behavior-reviewed change.

`.env.example` documents the variable but leaves it blank so a default build cannot switch media origins accidentally.

## Bucket roles

| Bucket | Access | Allowed content | Retention |
|---|---|---|---|
| `jrhof-media-intake` | private | Temporary, approved derivative batches awaiting verification; no camera originals or private release records. | Short-lived; clean up after checksum and publication review. |
| `jrhof-media-public` | public only through an approved custom domain | Optimized images and other explicitly public website derivatives. | Durable publishing store with versioned/immutable keys. |

Keep the `r2.dev` URL disabled in production. If it is temporarily enabled for upload testing, treat it as a rate-limited development endpoint, record the window, and disable it after the custom domain is verified.

## Prefix and object-key layout

Use lowercase, stable prefixes that separate event identity from derivative type:

```text
events/
  golf/
    2024/
      umpires-cup-ii/
        web/
          2024-umpires-cup-ii-001.webp
          ...
          2024-umpires-cup-ii-158.webp
        thumbs/
          2024-umpires-cup-ii-001.webp
          ...
          2024-umpires-cup-ii-158.webp
```

The first image would resolve to:

```text
${PUBLIC_MEDIA_BASE_URL}/events/golf/2024/umpires-cup-ii/web/2024-umpires-cup-ii-001.webp
```

and its thumbnail to:

```text
${PUBLIC_MEDIA_BASE_URL}/events/golf/2024/umpires-cup-ii/thumbs/2024-umpires-cup-ii-001.webp
```

Reserve `site/` for shared site imagery and `inductees/` for separately governed portrait derivatives. Do not mix originals, source exports, or unpublished selections into public prefixes.

Treat a published object key as immutable. Set `Content-Type: image/webp` and a long-lived public cache policy only after agreeing never to replace bytes at that key. If an image must change, publish a new revision prefix or filename and update the manifest; do not overwrite the working object during the rollback window.

## Upload and verification sequence

1. Reconfirm that the local set contains exactly 158 `web/` images and 158 `thumbs/` images, with no source originals.
2. Generate a manifest of relative key, byte size, dimensions, MIME type, and SHA-256 checksum.
3. Upload only the derivative set to `jrhof-media-intake`, verify counts/checksums, then copy/promote the verified keys to `jrhof-media-public` using the layout above.
4. Verify all 316 public objects by exact key. Sample the first, middle, last, landscape, and portrait images visually.
5. Confirm `Content-Type`, cache metadata, TLS, and that bucket listing is unavailable.
6. Configure and verify the approved R2 custom domain in the same organization-controlled account/zone. Add that exact origin to `img-src` in the checked-in CSP as part of the later gallery switch.
7. Keep the local manifest and repository assets untouched while testing.

## Test without changing the current gallery

Use a dedicated branch and Worker preview version:

1. Upload and verify R2 objects without editing `src/data/galleries/golf-2024.json`.
2. In the later test branch, add one URL resolver that prefixes gallery paths only when `PUBLIC_MEDIA_BASE_URL` is non-empty. Preserve image order, dimensions, alt text, thumbnail behavior, lightbox behavior, and local fallback.
3. Build locally once with the variable absent and confirm all gallery URLs remain root-relative.
4. Build a non-production Worker version with `PUBLIC_MEDIA_BASE_URL` set to the verified test origin. Do not merge or deploy it to the production branch.
5. On the preview URL, verify all 158 thumbnails and display images, keyboard/lightbox behavior, mobile layout, CSP, mixed-content errors, 404s, and browser console/network failures.
6. Unset the variable and rebuild to prove rollback to repository assets is immediate.
7. After the production media custom domain is approved, repeat the preview with its final hostname. Only then submit a separate manifest/resolver cutover for review.

Cross-origin `<img>` delivery does not require a permissive CORS policy for the current gallery. Add CORS only if a future reviewed feature fetches bytes or uses canvas, and then allow only the required JRHOF origins and methods.

## Cutover and rollback

The first R2-backed release changes URL resolution only. It must not remove local assets.

- Before release, record the prior Worker version and keep all R2 objects and local files.
- If any image, CSP, cache, or domain check fails, unset/revert `PUBLIC_MEDIA_BASE_URL` usage and roll back the Worker version; do not delete objects while diagnosing.
- Monitor R2 errors, gallery load failures, Web Analytics, and representative mobile sessions through the agreed window.
- Remove the 316 repository copies only in a later cleanup after production verification, retained rollback history, and explicit approval.

## Deferred implementation TODOs

- [ ] Confirm `media.jrhof.org` ownership and attach it to `jrhof-media-public` without changing `jrhof.org` website DNS.
- [ ] Decide whether `jrhof-media-intake` is needed; if retained, enforce private access and a cleanup lifecycle.
- [ ] Add an upload/checksum verification script under a separate review.
- [ ] Add the optional `PUBLIC_MEDIA_BASE_URL` resolver and CSP origin under a preview-only test branch.
- [ ] Verify the 316-object set and gallery behavior against the final custom domain.
- [ ] Switch the gallery only after approval.
- [ ] Remove local compatibility assets only after a separate post-cutover verification window.

Official reference: [Cloudflare R2 public buckets and custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/).
