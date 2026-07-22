# Joe Rossi Umpires Hall of Fame

This repository contains the production website for the [Joe Rossi Umpires Hall of Fame](https://jrhof.org), a public program of JR and Associates, Inc. The site preserves the history of Colorado high school baseball umpiring, publishes the inductee archive, and supports the Hall of Fame's events and fundraising work.

## Production platform

- Astro 6 prerenders the site to static files in `dist/`.
- Cloudflare Workers Static Assets serves the production site at `https://jrhof.org` through the Worker named `jrhof-webapp`.
- `main` is the production source branch. Cloudflare account-side build settings, custom-domain attachment, deployment history, and rollback controls are not stored in this public repository.
- `wrangler.jsonc` intentionally has no Worker entrypoint or domain routes. The current application has no request-time server code, database, session, or repository-managed secret.
- R2 serves approved optimized media through `https://media.jrhof.org`, the only public media origin. The temporary `r2.dev` development URL is intentionally disabled; the `jrhof-media-public` custom domain is the permanent origin. Event galleries and, since the inductee portrait cutover, all inductee portraits and the shared placeholder are served this way. No inductee portrait binary is served from Git. Event-photo originals belong in an organization-controlled Google Drive or SharePoint archive, not Git or public R2. The private `jrhof-media-intake` bucket is optional temporary staging and may be retired in favor of Drive/SharePoint uploads.
- Media is referenced through `src/lib/media.ts` (`mediaUrl(key)` and `inducteePortrait(record, variant)`) rather than hardcoded URLs. The inductee pipeline is `npm run media:inductees:generate` → `verify-local` → `upload` → `verify-remote`; see [Inductee media R2 migration](docs/INDUCTEE_MEDIA_R2_MIGRATION.md).
- The retired Next.js application is preserved under `_archive/legacy-nextjs/`. WordPress is migration history, not the active application or deployment target.

## Measurement and transactions

Google Tag Manager container `GTM-WGDF4SBN` is the single Google loader. It delivers GA4 (`G-VYQQ5E7ZHM`) and the approved Google Ads tag. Do not add hardcoded Google tags or enable Google measurement tools in Cloudflare Zaraz. Cloudflare Web Analytics remains a separate dashboard-managed observer; Microsoft Clarity is loaded only when its approved public project ID is configured.

Eventbrite is a temporary external registration bridge. A Stripe Checkout, Cloudflare Worker, D1, verified-webhook, and protected-CSV implementation exists only on the isolated `feature/banquet-registration-checkout-v2` branch. It is an unapproved test preview: production registration is closed, the default static build omits the form, production `wrangler.jsonc` has no dynamic bindings, and no launch or deployment is authorized. See [registration v2 controls](docs/implementation/BANQUET_REGISTRATION_V2.md).

## Repository map

| Path | Purpose |
|---|---|
| `src/pages/` | Public Astro routes. |
| `src/components/` | Active Astro components and the shared measurement bridge. |
| `src/config/` | Public site, transaction-link, and media-origin configuration. |
| `src/data/` | Typed event data, gallery manifests, and generated inductee data. |
| `public/` | Static assets plus production headers, redirects, robots, and `security.txt`. |
| `content/` | Inductee migration inputs used by the generator; not an event-photo archive. |
| `manifests/` | Reviewable media inventories and checksums. |
| `scripts/` | Validation, generation, and media-audit utilities. |
| `docs/` | Current operations, architecture, governance, playbooks, and audit history. |
| `_archive/` | Superseded implementation artifacts; excluded from deployment. |

## Local development

Node.js 22.12 or newer is required.

```bash
npm ci
npm run dev
```

Use `npm install` only when intentionally changing dependencies. Do not run `npm run content:generate` as routine setup; it rewrites committed inductee data from reviewed migration inputs.

## Validation

Run before every pull request:

```bash
npm run check
npm run build
npm run validate
git diff --check
```

`npm run validate` must follow the build because it inspects generated routes and assets. A validation-only GitHub Actions workflow runs the same application checks on pull requests and `main`. See [Validation](docs/VALIDATION.md).

`npm run deploy` is a real Cloudflare deployment, not a local preview command. Do not run it without production-deployment approval and an identified rollback owner.

## Documentation and handoff

Start with the [documentation index](docs/README.md) and [maintainer handoff guide](docs/HANDOFF.md). Key references are:

- [Master status](docs/JRHOF_MASTER_STATUS.md)
- [Platform architecture](docs/PLATFORM_ARCHITECTURE.md)
- [Cloudflare operations playbook](docs/infrastructure/CLOUDFLARE_OPERATIONS.md) — canonical Git-vs-Cloudflare reference
- [Cloudflare deployment](docs/CLOUDFLARE_DEPLOYMENT.md)
- [Media strategy](docs/MEDIA_STRATEGY.md)
- [Analytics summary](docs/ANALYTICS.md)
- [Marketing architecture](docs/architecture/JRHOF_MARKETING_ARCHITECTURE.md)
- [GA4/GTM/Ads operations](docs/playbooks/JRHOF_GA4_GTM_ADS_OPERATIONS.md)
- [Repository cleanup audit](docs/REPOSITORY_CLEANUP_AUDIT_2026-07-02.md)

Normal changes use a focused branch, preserve redirects and historical evidence, run all validations, obtain review, merge to `main`, verify the Cloudflare build/deployment, and smoke-test production. Do not change Cloudflare, analytics, advertising, Stripe, Search Console, DNS, legal copy, or transaction behavior without the named owner for that system.

## Security

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). The public discovery file is served at [`/.well-known/security.txt`](https://jrhof.org/.well-known/security.txt).

## Licensing

No open-source license has been designated for this repository. Licensing decisions are reserved for JR and Associates, Inc. See [COPYRIGHT.md](COPYRIGHT.md) and the [licensing status note](docs/LICENSE_REVIEW.md).
