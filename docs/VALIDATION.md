# Validation

## Routine checks

From the repository root, run in this order:

```bash
npm run check
npm run build
npm run validate
git diff --check
```

- `npm run check` performs Astro/TypeScript validation.
- `npm run build` generates the static site and exposes build-time route or asset errors.
- `npm run validate` verifies the 150-record inductee invariants, sensitive biography guardrails, generated detail pages, archive links, internal links, and forbidden legacy UI/content. Run it after the build.
- `git diff --check` catches whitespace errors in the proposed patch.

The adapter-free static build writes directly to `dist/`. Before a release, confirm that directory contains `index.html`, `404.html`, `_headers`, `_redirects`, sitemap output, and representative gallery files. `npx wrangler deploy --dry-run --config wrangler.jsonc` may be added for deployment-configuration validation; it must not be confused with a real deploy. The explicit config path also avoids stale ignored `.wrangler` metadata from an older adapter build.

For a fresh environment, run `npm install` first. CI/deployment should prefer a lockfile-respecting clean install such as `npm ci` if that is the configured Cloudflare command.

## Additional release checks

- Review `git status --short` and ensure no original photo drop, secret, `.env`, build output, or local IDE/cache file is staged.
- Check representative production-like routes in a preview deployment, including `/`, `/inductees/`, an inductee detail page, event archives, the 2024 gallery, policy pages, and 404 behavior.
- Verify `public/_headers`, `public/_redirects`, the sitemap, robots file, canonical host, and important external links.
- For media work, compare manifest entries, R2 objects, dimensions, file sizes, and image orientation.

Content-generation commands are not part of routine validation. Run `npm run content:generate` or redirect generation only when their reviewed sources intentionally change, then inspect the generated diff.
