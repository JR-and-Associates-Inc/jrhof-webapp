# Current State

> Superseded by [docs/JRHOF_MASTER_STATUS.md](/Users/tjolnhausen/Documents/JRHOF%20Website%20Rebuild/docs/JRHOF_MASTER_STATUS.md)
>
> Keep this file as historical implementation context only. Do not treat it as the authoritative project status summary.

## Branch and scope

- Branch: `codex/astro-static-foundation`
- See [docs/JRHOF_MASTER_STATUS.md](/Users/tjolnhausen/Documents/JRHOF%20Website%20Rebuild/docs/JRHOF_MASTER_STATUS.md) for the current authoritative status.
- Use [docs/SITE_QUALITY_STANDARDS.md](/Users/tjolnhausen/Documents/JRHOF%20Website%20Rebuild/docs/SITE_QUALITY_STANDARDS.md) for the standing quality baseline.
- Keep this file only for implementation history and migration context.

## Historical notes

- The tracked Next.js `src/app` and related components remain in repository history and in the working tree as reference during the selective migration.
- The non-breaking `npm audit fix` updates are applied, but the remaining advisory details should now be read through the master status doc and the audit files.
- Future changes must still run `npm run check`, `npm run build`, and `npm run validate`.
