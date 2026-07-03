# Repository Governance

The active application is Astro. Public behavior is defined by `src/pages/`, active `.astro` components, `src/config/`, `src/data/`, `src/styles/`, and required files in `public/`.

## Source categories

- `src/data/inductees.json` is generated and committed; do not hand-edit it.
- `content/Bios/`, `content/Photos/`, and `_migration/` are migration/source evidence. They are not public routes or an event-photography archive.
- `_archive/legacy-nextjs/` is read-only historical reference. Never import from it or include it in deployment.
- `docs/archive/` contains superseded plans and audits that should not direct current implementation.
- `public/_redirects` and `public/_headers` are production-sensitive controls and require deliberate review.

## Change rules

- Keep documentation/hygiene changes behavior-neutral unless a broken reference, exposed source original, or unnecessary large public asset clearly requires correction.
- Do not commit full-resolution event photography. Store originals in the organization-controlled Google Drive and publish optimized derivatives to R2.
- Do not add analytics snippets merely because a dashboard-managed tool is absent from source. Cloudflare Web Analytics is account configuration, and Zaraz must remain free of Google measurement tools while GTM is installed.
- Treat `npm run deploy` as an approval-gated real Worker deployment. Routine pull requests use validation and preview review; custom-domain and DNS changes remain separate account operations even though the Worker now serves production.
- Run [VALIDATION.md](VALIDATION.md) before merging.
