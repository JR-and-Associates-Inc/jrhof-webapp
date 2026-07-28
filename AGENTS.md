# Repository agent guidance

These rules apply to all work in this repository.

## Purpose and source of truth

- This is the production Astro site for the Joe Rossi Umpires Hall of Fame.
- Treat the active Astro application, current documentation, reviewed data, and redirects as authoritative.
- Preserve `_archive/` as historical evidence. Do not reactivate or casually rewrite archived code.
- Preserve historical facts and use verified organization-approved content. Do not invent names, dates, awards, testimonials, legal claims, or transaction details.

## Safety boundaries

- Never commit credentials, tokens, private intake media, donor or attendee data, or unapproved personal information.
- Do not change Cloudflare, DNS, R2, analytics, advertising, Stripe, Search Console, legal copy, or transaction behavior without explicit approval from the named owner.
- Do not run `npm run deploy` or any media upload command without explicit production approval and an identified rollback owner.
- Keep Google Tag Manager as the single Google loader. Do not add duplicate hardcoded measurement tags or enable competing injectors.
- Use `src/lib/media.ts` for public media URLs. Do not commit inductee portrait or event-photo binaries that belong in approved external storage.

## Setup and required checks

Use Node.js 22.12 or newer and install exactly from the lockfile:

```bash
npm ci
```

Before proposing a change, run:

```bash
npm test
npm run check
npm run build
npm run validate
git diff --check
```

`npm run validate` must run after the build because it inspects generated output.

## Change discipline

- Do not run `npm run content:generate` as routine setup; it rewrites committed data from reviewed migration inputs.
- Keep changes focused and preserve redirects, security headers, accessibility, structured data, and historical evidence.
- Do not commit `dist/`, local environment files, or generated media unless repository documentation explicitly requires the artifact.
- Update relevant documentation when behavior, operations, public routes, analytics, media handling, or deployment assumptions change.
