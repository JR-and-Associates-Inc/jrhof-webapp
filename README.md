# Joe Rossi Umpires Hall of Fame

This repository contains the Astro static site for the [Joe Rossi Umpires Hall of Fame](https://jrhof.org), a public program of JR and Associates, Inc. The active application is Astro; the retired Next.js implementation is preserved under `_archive/legacy-nextjs/` for historical reference only.

## Platform overview

- Astro generates the public site from `src/pages/`, Astro components, and committed data.
- The intended production host is Cloudflare Pages in the JR and Associates Cloudflare account, with `main` as the production branch.
- Cloudflare DNS, Pages, R2, Web Analytics, and Zaraz should remain organization-controlled resources.
- Cloudflare Web Analytics is active. GA4 is configured in Zaraz with measurement ID `G-VYQQ5E7ZHM`; the repository does not load a second GA4 tag.
- R2 is the public delivery store for optimized website media. Original event photography belongs in an organization-controlled Google Drive or SharePoint archive, not Git or R2.

The current `wrangler.jsonc` and `npm run deploy` path are Worker-oriented legacy/development configuration. They are not the canonical production deployment path until reconciled with the actual Pages project. See [Platform architecture](docs/PLATFORM_ARCHITECTURE.md).

## Repository map

| Path | Purpose |
|---|---|
| `src/pages/` | Public Astro routes. |
| `src/components/` | Active Astro components. |
| `src/data/` | Active typed event data, gallery manifest, and generated inductee data. |
| `public/` | Static files required by the current build; large galleries should move to R2 after URL verification. |
| `content/` | Original inductee migration inputs used by the generator; not an event-photo archive. |
| `_migration/` | Historical migration and reconciliation evidence. |
| `_archive/` | Superseded implementation artifacts; excluded from TypeScript checks and deployment. |
| `docs/` | Current architecture, operations, governance, and historical evidence. |

## Local development

Node.js 22.12 or newer is required.

```bash
npm install
npm run dev
```

Do not run `npm run content:generate` as routine setup. It rewrites committed inductee data and is only appropriate when the reviewed source package changes.

## Validation

Run these commands before merging:

```bash
npm run check
npm run build
npm run validate
git diff --check
```

`npm run validate` should run after `npm run build` so it can verify generated routes and internal links. The full expectations are in [Validation](docs/VALIDATION.md).

## Documentation

Start with [docs/README.md](docs/README.md). The most useful operational references are:

- [Platform architecture](docs/PLATFORM_ARCHITECTURE.md)
- [Media strategy](docs/MEDIA_STRATEGY.md)
- [Analytics](docs/ANALYTICS.md)
- [Event and gallery workflow](docs/EVENT_GALLERY_WORKFLOW.md)
- [Deferred work](docs/DEFERRED_WORK.md)

## License

Code is licensed under MIT. Site content and media are governed by [LICENSE.content.md](LICENSE.content.md) and by JRHOF publication approvals.
