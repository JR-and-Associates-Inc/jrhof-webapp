# Current State

## Branch

`codex/astro-static-foundation`

## Public routes

- `/`
- `/about/`
- `/inductees/`
- `/inductees/[canonical_slug]/` for 150 records
- `/events/`
- `/events/golf-tournament/`
- `/events/induction-banquet/`
- `/donate/`
- `/sponsor/`
- `/contact/`
- `/privacy-policy/`
- `/terms/`
- `/404/`

## Content readiness

- Candidate inductees: 150
- Original-source biographies available: 123
- Biography pending review: 27
- Original portraits accepted as verified candidates: 117
- Portrait pending review or identity confirmation: 33
- Records in safe/near-safe migration lanes: 113
- Records in board, identity, or media-blocked lanes: 37

The site renders every record, even when content is pending. Missing biographies receive respectful review copy. Missing or unresolved portraits use one shared generic SVG.

## Static shells

Events, donations, sponsorship, and contact pages explain the intended user journey but do not collect data or money. Past event details are not promoted as active registration.

## Visual presentation

The shared Astro layout now closely follows the current production site's recognizable structure:

- Black classic header with the JRHOF and CHSBUA logos, association text, Hall of Fame title, and legacy tagline.
- Production nav order: Home, About, Inductees, Events, Contact, CHSBUA, Donate.
- Baseball-diamond page background with centered translucent white content blocks.
- Production homepage section order and language, including the three 2026 inductees and three latest-event summaries.
- Production-like footer content and organizational credit.

Sponsor remains available at `/sponsor/` but is intentionally absent from the main navigation. Login, account registration, public search controls, comments, stale registration links, and countdowns remain absent.

## Legacy source

The tracked Next.js `src/app` and related components remain in repository history and in the working tree as reference during the selective migration. Astro builds only `src/pages`. Removal or relocation can happen after feature/content parity is accepted.

## Dependency audit

The non-breaking `npm audit fix` updates are applied. The remaining npm report contains seven low/moderate transitive advisories in Astro's local development server and the optional Astro check/language tooling. npm's proposed fixes require breaking package downgrades, so they were not forced. The deployed output is static files and has no Node server runtime; recheck when upstream packages publish compatible fixes.
