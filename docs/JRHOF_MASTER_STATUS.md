# JRHOF Master Status

**Updated:** June 29, 2026
**Scope:** Current repository and platform status

## Current state

- The active site is an Astro static build. Public routes and gallery behavior remain unchanged by the June 29 repository-hygiene pass.
- The target production model is Cloudflare Pages in the JR and Associates Cloudflare account, using the `main` branch and `npm run build`.
- The repository still contains Worker-oriented Wrangler configuration that must be reconciled with the Pages dashboard before anyone treats direct Wrangler deployment as authoritative.
- Cloudflare Web Analytics is active.
- GA4 measurement ID `G-VYQQ5E7ZHM` is configured through Cloudflare Zaraz.
- Microsoft Clarity is not part of the active Astro implementation and remains a future, privacy-reviewed decision.
- The 2024 golf gallery currently uses committed optimized WebP derivatives so existing public behavior remains intact. R2 migration is deferred until the bucket, public media domain, upload ownership, and final URLs are verified.
- No full-resolution event gallery originals are intentionally tracked. Event originals belong in Google Drive or SharePoint; R2 receives only approved optimized derivatives.

## Repository cleanup status

- Retired Next.js source, React-only components, old data generators, duplicate derived data, and legacy public assets are preserved under `_archive/legacy-nextjs/`.
- IDE metadata and `.DS_Store` files are generated local artifacts and are not part of the repository.
- WordPress extraction and reconciliation outputs remain available as historical evidence under `_migration/` and the audit documents.
- `content/Bios/` and `content/Photos/` remain because the active inductee generator uses them; they are migration inputs, not the long-term organizational archive.

## Current safeguards

- Preserve the 150-record inductee model and its content-safety validations.
- Do not change routes, redirects, navigation, event state, or gallery behavior during documentation/hygiene work.
- Do not hardcode a second GA4 or Cloudflare analytics snippet while dashboard injection is active.
- Do not commit full-resolution event photography, camera originals, RAW files, or unreviewed bulk media drops.

## Open risks

- Confirm the Pages project build-output setting against a clean build. The current Cloudflare adapter produces a deployable client payload under `dist/client`, while generic Pages guidance commonly assumes `dist`.
- Confirm that the JR and Associates account controls the DNS zone, Pages project, R2 bucket/domain, Web Analytics site, and Zaraz configuration, and that registrar recovery is organization-owned.
- Complete the R2 cutover before removing the committed 2024 gallery derivatives.
- Review event dates/statuses after each event; repository validation does not prove that time-sensitive copy is current.
- Content-review issues documented in the reconciliation audits remain separate from this hygiene pass.

See [DEFERRED_WORK.md](DEFERRED_WORK.md) for the managed follow-up list.
