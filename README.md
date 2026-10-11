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
  <a href="https://astro.build/"><img alt="Built with Astro 7.3" src="https://img.shields.io/badge/Astro-7.3-BC52EE?logo=astro&logoColor=white"></a>
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

Read [Project state](docs/PROJECT_STATE.md) for the verified main/preview distinction, [Registration options](docs/operations/REGISTRATION_OPTIONS.md) for the Stripe-versus-Zeffy comparison, and [Zeffy evaluation](docs/operations/ZEFFY_EVALUATION.md) for its acceptance tests. The registration feature remains an open draft PR; this checkout includes its code for documentation review.

- Astro 7.3 prerenders the public site to static files in `dist/`.
- Cloudflare Workers Static Assets serves production at [jrhof.org](https://jrhof.org/) through the Worker named `jrhof-webapp`.
- `main` is the production source branch. Cloudflare account-side build settings, custom-domain attachment, deployment history, and rollback controls are not stored in this public repository.
- On production `main`, `wrangler.jsonc` has no Worker entrypoint or domain routes, and the site has no request-time registration code or database. On this feature-derived branch, it declares `worker/index.ts` for `/api/*`, `/board`, and `/board/*`, with runtime secret bindings configured separately in Cloudflare. Neither version declares domain routes.
- R2 serves approved optimized media through `https://media.jrhof.org`, the only public media origin. Event-photo originals belong in an organization-controlled archive, not Git or public R2.
- Media is referenced through `src/lib/media.ts` rather than hardcoded URLs. See [Media](docs/MEDIA.md).
- The earlier WordPress and Next.js sites are migration history, preserved only in Git history.

## Measurement and transactions

Google Tag Manager container `GTM-WGDF4SBN` is the single Google loader. It delivers GA4 (`G-VYQQ5E7ZHM`) and the approved Google Ads tag. Do not add hardcoded Google tags or enable Google measurement tools in Cloudflare Zaraz. Cloudflare Web Analytics remains a separate dashboard-managed observer; Microsoft Clarity is loaded only when its approved public project ID is configured.

This registration branch replaces Eventbrite for the induction banquet with Stripe Checkout, live board tracking, and CSV exports. Only the board routes require `@jrhof.org` Google login; registration is public. See [the demo and launch runbook](docs/operations/EVENT_REGISTRATION.md). Golf still uses Eventbrite; registration code that is not on `main` is unreleased.

## Repository map

| Path | Purpose |
| --- | --- |
| `src/pages/` | Public Astro routes and the authenticated static board share tool on the registration feature. |
| `worker/` | Registration APIs, Access verification, and board views on the unmerged registration feature. |
| `src/components/` | Active Astro components and the shared measurement bridge. |
| `src/config/` | Public site, transaction-link, and media-origin configuration. |
| `src/data/` | Typed event records and the hand-maintained inductee roster. |
| `public/` | Static assets plus production headers, redirects, robots, and `security.txt`. |
| `manifests/r2/` | Metadata and checksums for media published to R2. |
| `scripts/` | Validation checks and the gallery and portrait media pipelines. |
| `docs/` | Operations, content model, media workflow, guardrails, and marketing playbooks. |

## Local development

Node.js 22.12 or newer is required.

```bash
npm ci
npm run dev
```

Use `npm install` only when intentionally changing dependencies. Contributors working with an AI coding agent should point it at [AGENTS.md](AGENTS.md).

## Validation

Run before every pull request:

```bash
npm run verify
git diff --check
```

`npm run verify` runs the Astro/TypeScript check, the static build, the content and launch-readiness validations (which inspect the built site), and the page acceptance tests plus registration Worker tests against fake Stripe on the feature branch. GitHub Actions runs the same checks on pull requests and `main`.

`npm run deploy` is a real Cloudflare deployment, not a local preview command. Do not run it without production-deployment approval and an identified rollback owner.

## Documentation and handoff

Start with the [documentation index](docs/README.md) and [maintainer handoff guide](docs/HANDOFF.md). Key references include:

- [Roadmap](docs/ROADMAP.md)
- [Cloudflare operations](docs/CLOUDFLARE.md)
- [Inductee content model](docs/CONTENT_MODEL.md)
- [Media](docs/MEDIA.md)
- [Analytics summary](docs/ANALYTICS.md)
- [Marketing architecture](docs/architecture/JRHOF_MARKETING_ARCHITECTURE.md)
- [GA4/GTM/Ads operations](docs/playbooks/JRHOF_GA4_GTM_ADS_OPERATIONS.md)

Normal changes use a focused branch, preserve redirects, run all validations, obtain review, merge to `main`, verify the Cloudflare build/deployment, and smoke-test production. Do not change Cloudflare, analytics, advertising, Stripe, Search Console, DNS, legal copy, or transaction behavior without the named owner for that system.

## Security

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md), never through a public issue. The public discovery file is served at [`/.well-known/security.txt`](https://jrhof.org/.well-known/security.txt).

## Licensing and content rights

Original website **source code** is licensed under the [MIT License](LICENSE).

The MIT License does not cover the nonprofit's name, logos, trademarks, branding, photographs, portraits, video, audio, biographies, historical records, event materials, website copy, archival material, or other non-code content. See [CONTENT_RIGHTS.md](CONTENT_RIGHTS.md) and [COPYRIGHT.md](COPYRIGHT.md) before reusing material.
