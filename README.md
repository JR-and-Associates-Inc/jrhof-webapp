<p align="center">
  <a href="https://jrhof.org/">
    <img src="https://avatars.githubusercontent.com/u/212161181?s=180&v=4" width="140" alt="Joe Rossi Umpires Hall of Fame logo">
  </a>
</p>

<h1 align="center">Joe Rossi Umpires Hall of Fame</h1>

<p align="center"><strong>Preserving the people, stories, and traditions of Colorado high school baseball officiating.</strong></p>

<p align="center">
  <a href="https://jrhof.org/"><img alt="JRHOF website status" src="https://img.shields.io/website?url=https%3A%2F%2Fjrhof.org&up_message=online&down_message=offline&label=jrhof.org"></a>
  <a href="https://github.com/JR-and-Associates-Inc/jrhof-webapp/actions/workflows/validate.yml"><img alt="Validation status" src="https://github.com/JR-and-Associates-Inc/jrhof-webapp/actions/workflows/validate.yml/badge.svg?branch=main"></a>
  <a href="https://github.com/JR-and-Associates-Inc/jrhof-webapp/security"><img alt="CodeQL and secret scanning enabled" src="https://img.shields.io/badge/security-CodeQL%20%2B%20secret%20scanning-2ea44f"></a>
  <a href="LICENSE"><img alt="Source code licensed under MIT" src="https://img.shields.io/badge/code%20license-MIT-blue.svg"></a>
  <a href="https://astro.build/"><img alt="Built with Astro 7.2" src="https://img.shields.io/badge/Astro-7.2-BC52EE?logo=astro&logoColor=white"></a>
  <a href="CONTRIBUTING.md"><img alt="Contributions welcome" src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg"></a>
</p>

<p align="center">
  <a href="https://jrhof.org/">Visit the Hall of Fame</a> ·
  <a href="https://jrhof.org/inductees/">Explore the inductees</a> ·
  <a href="CONTRIBUTING.md">Contribute</a> ·
  <a href="https://jrhof.org/donate/">Support the mission</a>
</p>

This repository contains the production website for the [Joe Rossi Umpires Hall of Fame](https://jrhof.org/), a public-facing program of **JR and Associates, Inc., a Colorado 501(c)(3) nonprofit organization**. The site preserves Colorado high school baseball officiating history, publishes the inductee archive, and supports the Hall of Fame's events and fundraising work.

## Why this project matters

The website is a living public archive, not just an event page. It helps families, officials, researchers, and community members discover the people and stories that shaped Colorado baseball officiating. The project is maintained with nonprofit resources and substantial pro bono support.

Students, educators, coding-bootcamp participants, early-career contributors, and experienced practitioners are welcome. Accessibility, web design, frontend engineering, content quality, testing, documentation, and digital-archive work can all make a meaningful contribution.

## Production platform

- Astro 7.2 prerenders the public site to static files in `dist/`.
- Cloudflare Workers Static Assets serves production at [jrhof.org](https://jrhof.org/) through the Worker named `jrhof-webapp`.
- `main` is the production source branch. Cloudflare account-side build settings, custom-domain attachment, deployment history, and rollback controls are not stored in this public repository.
- `wrangler.jsonc` intentionally has no Worker entrypoint or domain routes for the current public site. The production application has no request-time server code, database, session, or repository-managed secret.
- R2 serves approved optimized media through `https://media.jrhof.org`, the only public media origin. Event-photo originals belong in an organization-controlled archive, not Git or public R2.
- Media is referenced through `src/lib/media.ts` rather than hardcoded URLs. See [Inductee media R2 migration](docs/INDUCTEE_MEDIA_R2_MIGRATION.md).
- The retired Next.js application is preserved under `_archive/legacy-nextjs/`. WordPress is migration history, not the active application or deployment target.

## Measurement and transactions

Google Tag Manager container `GTM-WGDF4SBN` is the single Google loader. It delivers GA4 (`G-VYQQ5E7ZHM`) and the approved Google Ads tag. Do not add hardcoded Google tags or enable Google measurement tools in Cloudflare Zaraz. Cloudflare Web Analytics remains a separate dashboard-managed observer; Microsoft Clarity is loaded only when its approved public project ID is configured.

Eventbrite remains the production registration bridge. A native Stripe Checkout, Cloudflare Worker, and D1 registration flow is under protected board review and must not be treated as approved production functionality until the board completes its decisions.

## Repository map

| Path | Purpose |
| --- | --- |
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

`npm run validate` must follow the build because it inspects generated routes and assets. GitHub Actions runs the same application checks on pull requests and `main`. See [Validation](docs/VALIDATION.md).

`npm run deploy` is a real Cloudflare deployment, not a local preview command. Do not run it without production-deployment approval and an identified rollback owner.

## Documentation and handoff

Start with the [documentation index](docs/README.md) and [maintainer handoff guide](docs/HANDOFF.md). Key references include:

- [Master status](docs/JRHOF_MASTER_STATUS.md)
- [Platform architecture](docs/PLATFORM_ARCHITECTURE.md)
- [Cloudflare operations playbook](docs/infrastructure/CLOUDFLARE_OPERATIONS.md)
- [Cloudflare deployment](docs/CLOUDFLARE_DEPLOYMENT.md)
- [Media strategy](docs/MEDIA_STRATEGY.md)
- [Analytics summary](docs/ANALYTICS.md)
- [Marketing architecture](docs/architecture/JRHOF_MARKETING_ARCHITECTURE.md)
- [GA4/GTM/Ads operations](docs/playbooks/JRHOF_GA4_GTM_ADS_OPERATIONS.md)

Normal changes use a focused branch, preserve redirects and historical evidence, run all validations, obtain review, merge to `main`, verify the Cloudflare build/deployment, and smoke-test production. Do not change Cloudflare, analytics, advertising, Stripe, Search Console, DNS, legal copy, or transaction behavior without the named owner for that system.

## Security

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md), never through a public issue. The public discovery file is served at [`/.well-known/security.txt`](https://jrhof.org/.well-known/security.txt).

## Licensing and content rights

Original website **source code** is licensed under the [MIT License](LICENSE).

The MIT License does not cover the nonprofit's name, logos, trademarks, branding, photographs, portraits, video, audio, biographies, historical records, event materials, website copy, archival material, or other non-code content. See [CONTENT_RIGHTS.md](CONTENT_RIGHTS.md) and [COPYRIGHT.md](COPYRIGHT.md) before reusing material.
