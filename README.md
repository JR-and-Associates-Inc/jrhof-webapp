# JRHOF Web App

Static Astro foundation for the [Joe Rossi Hall of Fame](https://jrhof.org), a Colorado nonprofit honoring service to high school baseball and umpiring.

## Architecture

- Astro static output
- Cloudflare Pages target (`npm run build`, output directory `dist`)
- 150 candidate inductee records generated from the reconciled roster and original source files
- No server runtime, accounts, comments, payments, registration, or database in Phase 1

## Local development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run content:generate
python3 scripts/generate_redirects.py
npm run check
npm run build
npm run validate
npm run preview
```

The generated `src/data/inductees.json` is committed. Cloudflare Pages does not need Python during a normal build.

## Documentation

Start with the active governance set:

- `docs/REPO_GOVERNANCE.md`
- `docs/JRHOF_MASTER_STATUS.md`
- `docs/PROJECT_CONTROL.md`
- `docs/IMPLEMENTATION_GUARDRAILS.md`
- `docs/CONTENT_MODEL.md`
- `docs/DECISIONS.md`
- `docs/DOCUMENTATION_INDEX.md`
- `docs/launch/LAUNCH_READINESS_CHECKLIST.md`
- `docs/launch/SEO_AND_AD_GRANTS_READINESS.md`
- `docs/launch/SECURITY_HARDENING_CHECKLIST.md`

Historical implementation notes live in `docs/archive/`. Migration evidence remains under `docs/`, `_migration/`, and `content/`.

## License

Code is licensed under MIT. Content is covered by the repository's content license; original-source rights and publication approvals still require JRHOF review.
