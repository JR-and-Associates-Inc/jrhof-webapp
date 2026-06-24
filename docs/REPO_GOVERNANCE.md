# Repo Governance

This repository is now an **Astro + Cloudflare** site. Treat the current Astro surface as the active implementation path.

## Active source of truth

- Active app surface: `src/pages/**`, `src/components/**`, `src/styles/**`, and the Astro build pipeline.
- Active guidance: `docs/JRHOF_MASTER_STATUS.md`, `docs/PROJECT_CONTROL.md`, `docs/IMPLEMENTATION_GUARDRAILS.md`, `docs/SITE_QUALITY_STANDARDS.md`, `docs/CONTENT_MODEL.md`, and `docs/DOCUMENTATION_INDEX.md`.
- Active launch planning: `docs/launch/LAUNCH_READINESS_CHECKLIST.md`, `docs/launch/SEO_AND_AD_GRANTS_READINESS.md`, and `docs/launch/SECURITY_HARDENING_CHECKLIST.md`.

## Do not treat as active implementation

- `src/app/**` is legacy Next.js reference only unless a dedicated branch explicitly restores it.
- `next.config.ts` is historical reference unless a dedicated Next.js branch is approved.
- `content/Bios/*.docx` and the migration source files are inputs to the content-generation workflow, not public pages.
- `src/data/inductees.json` is generated output and should not be hand-edited.
- `public/_redirects` is controlled by redirect governance and generator output, not ad hoc edits.

## Operational assumptions

- Privacy and Terms are board-review-ready drafts unless formally approved as final legal copy.
- Stripe is the intended donation/payment processor, but Checkout, webhooks, and D1-backed records remain future work unless they are built in a dedicated approved branch.
- Contact form delivery requires an approved provider, secrets, and server-side handling. A visible form must not imply delivery that is not configured.
- Google Ad Grants readiness depends on useful content, working donation/contact paths, HTTPS, mobile usability, approved analytics/conversion measurement, and policy-compliant landing pages.

## Publication guardrails

- Do not change public site behavior in a documentation branch.
- Do not rewrite content, redesign the site, or delete large areas of the repo without an explicit approved scope.
- When in doubt, treat generated data, migration evidence, and legacy Next.js artifacts as reference material rather than permission to ship.
