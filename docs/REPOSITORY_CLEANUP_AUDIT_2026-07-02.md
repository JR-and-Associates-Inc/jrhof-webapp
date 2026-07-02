# Repository Cleanup Audit

**Date:** July 2, 2026
**Scope:** Repository hygiene and handoff readiness only

This report records the evidence used for the cleanup in `chore/repo-handoff-cleanup`. It is written before any deletion so that removals are reviewable and reversible through Git.

## Baseline

- The branch started from a clean `main` worktree.
- The repository has 808 tracked files totaling about 36 MB in the current checkout.
- No tracked `.DS_Store`, `dist/`, `node_modules/`, `.astro/`, `.wrangler/`, IDE metadata, or local photo-drop directories were found.
- Local generated and source-media directories are present but ignored. They were not deleted because they may contain maintainer working state or original photography.
- `_archive/`, `docs/archive/`, dated audits, migration evidence, and redirects remain historical records and are not cleanup targets.

## Proven safe removals

| Path | Evidence | Action |
|---|---|---|
| `eslint.config.mjs` | Extends Next.js rules, imports `@eslint/eslintrc`, and has no matching script or dependency in `package.json`. The active application is Astro and `npm run check` is the maintained static-analysis command. | Remove as a dead Next.js root config. |
| `public/service-worker.js` | No source, layout, manifest, or documentation registers this worker. It only precaches a few icons and contains an unused push-notification placeholder. | Remove as an unregistered legacy public artifact. |
| `public/images/jrhof-social-share.png` | Byte-identical to the active `public/social-card-v2.png`; runtime and validation references use only `/social-card-v2.png`. | Point the brand generator at the active path, then remove the duplicate. |

Git history preserves all three files, so each removal can be restored independently without recovering an external archive.

## Intentionally retained

- `public/_redirects` and `public/_headers`: production controls; neither is a cleanup target.
- `public/ads.txt`: retained during the initial audit because account ownership was not then provable. JRHOF subsequently confirmed that it does not use AdSense, so the artifact was removed in the PR follow-up. Google Ad Grants and Google Ads documentation is separate and remains in scope.
- `src/data/events.ts` reference to `cdn.jrhof.org`: the current URL returns the flyer, while the proposed `media.jrhof.org` replacement path returns 404. Keep the working URL until the asset is uploaded and verified under separate media scope.
- `content/Bios/`, `content/Photos/`, and `_migration/`: tracked source and reconciliation evidence used by the inductee generation/audit workflow.
- Duplicate bytes between `content/Photos/` and `public/images/inductees/`: source inputs and public derivatives serve different roles. Remove only after the separate inductee-media migration and provenance review.
- `_archive/legacy-nextjs/`, `_archive/repo-cleanup-2026-06-29/`, `docs/archive/`, and dated audit documents: preserved history.
- Root and nested favicon copies: both are produced by the brand generator and support different public paths.
- Ignored local `2025 Golf Tournament Pictures/`, `2026 Golf Tournament Pictures/`, `.local-media/`, and `public/gallery/`: maintainer source/generated state, not tracked repository clutter.

## Stale references corrected in this pass

- Current documents that still described WordPress as production.
- Current deployment guidance that described `jrhof.org` cutover as pending.
- Root README language that incorrectly assigned GA4 to Zaraz.
- Cloudflare Pages wording in active generator comments.
- The live privacy-policy implementation's inaccurate statement that GA4 is loaded through Zaraz.

Historical audits, migration notes, and changelog entries keep their original period-specific language.

## Security and dependency hygiene

- No common private-key or live-token patterns were found in tracked text files.
- The static application has no request-time server, database, session, webhook, or committed secret.
- `npm audit fix` removed the moderate nested-YAML advisory and stale transitive packages without changing declared dependency ranges.
- Two low-severity esbuild findings remain through Astro's Windows development server. npm requires a breaking Astro 7 upgrade to remove them; the static production output is not affected. This is deferred to a tested major-version upgrade rather than forcing it into a handoff cleanup.
- See [SECURITY_AUDIT_2026-07-02.md](SECURITY_AUDIT_2026-07-02.md) for the review record.

## Remaining owner decisions

1. Licensing is deferred. No open-source license has been designated for this repository. Licensing decisions are reserved for JR and Associates, Inc.
2. Upload and verify the 2026 flyer under `media.jrhof.org` before replacing the working `cdn.jrhof.org` URL.
3. Confirm the organization-owned archive of record for original photography (Google Drive or SharePoint) and its access/retention policy.
4. Record private Cloudflare, registrar, GitHub, Stripe, and Google account owners outside this public repository.
5. Plan and test the Astro 7 major upgrade before accepting npm's forced remediation for the remaining low-severity Windows development-server advisory.

## Rollback

Documentation changes can be reverted as a unit. Each removed file can be restored from the parent commit. No DNS, Cloudflare dashboard, analytics, advertising, Stripe, Search Console, redirect, or production deployment state is changed by this cleanup.
