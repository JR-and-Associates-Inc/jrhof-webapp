# Cloudflare Workers Deployment Runbook

## Production model

`https://jrhof.org` is the production Astro site. `npm run build` prerenders it into `dist/`, and Cloudflare Workers Static Assets serves that directory through the Worker `jrhof-webapp` in the JR and Associates account.

The application has no Astro server adapter, Worker `main` entrypoint, runtime database, or server session. `public/_headers` and `public/_redirects` are copied into the build and enforced by Workers Static Assets.

The repository and Cloudflare account have different responsibilities:

| Repository | Cloudflare account |
|---|---|
| Astro source, dependencies, `wrangler.jsonc`, static headers/redirects, build and validation scripts | GitHub/build connection, branch controls, deployed versions, production custom domain, DNS, preview access, Web Analytics, Zaraz, R2, secrets, and rollback actions |

`wrangler.jsonc` intentionally declares no routes or custom domains. That prevents a routine repository deploy from attaching, detaching, or rerouting `jrhof.org`; it does not mean the dashboard-managed production attachment is absent.

## Checked-in configuration

| Setting | Value | Meaning |
|---|---|---|
| Worker | `jrhof-webapp` | Must match the organization-owned production Worker. |
| Compatibility date | `2026-06-24` | Review deliberately with Wrangler upgrades. |
| Static directory | `./dist` | Direct Astro output. |
| HTML handling | `auto-trailing-slash` | Matches the site's trailing-slash URL contract. |
| Not-found handling | `404-page` | Serves the generated custom 404 page. |
| `workers_dev` / previews | enabled | Useful for review; protect before adding private data or bindings. |
| Worker entrypoint | none | Current delivery is static only. |
| Repository domain routes | none | Domain/DNS state is an account-side production control. |

## Branch and build flow

`main` is the production source branch. The intended account-side build uses the repository root, a Node version satisfying `package.json`, `npm ci`, `npm run build`, and a Wrangler deploy of `wrangler.jsonc`. Non-production branches should upload preview versions without promoting them.

Because account-side settings are not visible in Git, an authorized operator must read back the actual GitHub connection, commands, branch rules, preview policy, active version, and production-domain attachment after ownership or platform changes. Do not create a second Worker or a Cloudflare Pages project for this site.

A validation-only GitHub Actions workflow runs application checks on pull requests and `main`; it does not deploy and is not proof that the Cloudflare build succeeded.

## Release validation

Run locally before merge:

```bash
npm ci
npm run check
npm run build
npm run validate
npx wrangler deploy --dry-run --config wrangler.jsonc
git diff --check
```

Confirm `dist/` contains `index.html`, `404.html`, `_headers`, `_redirects`, sitemap output, `robots.txt`, `/.well-known/security.txt`, and representative assets. In a preview version, test `/`, `/inductees/`, one biography, event archives, the 2024 gallery, policy pages, a legacy redirect, and an unknown path. Verify both `/about` and `/about/` behavior.

After merge, verify the Cloudflare build/deployment and then smoke-test `https://jrhof.org` from a clean browser. Check the changed route, shared navigation, one redirect, the 404, security headers, and exactly one GTM container load. If the deployment did not originate from the reviewed commit, stop and resolve the account-side build configuration.

`npm run deploy` performs a real Worker deployment. It is not a preview command and requires explicit production approval, current credentials, and an identified rollback owner.

## Rollback

For a static release failure:

1. Record the failing commit and Cloudflare version/deployment ID, symptoms, and first observed time.
2. In the `jrhof-webapp` deployment history, restore the last verified version. A suitably authorized maintainer may instead use Wrangler rollback after confirming the exact version ID.
3. Verify `https://jrhof.org`, `www` redirect behavior, representative routes, redirects, and security headers.
4. Revert or fix the responsible Git commit so the next `main` build does not redeploy the failure.
5. Preserve the failed version and incident evidence for review.

A Worker rollback restores versioned code/assets/configuration. It does not roll back DNS, R2 objects, Stripe state, analytics settings, or future D1 data. Stateful features need their own forward/restore procedures before release.

## Production domain guardrails

- Keep `https://jrhof.org` canonical and preserve the approved `www` redirect.
- Do not change custom domains, DNS, certificates, proxy state, mail records, or registrar settings during routine repository work.
- Before any domain change, export DNS, identify the current Worker version, name validation/rollback owners, define a monitoring window, and preserve the prior routing until acceptance.
- Never create a second production Worker or Pages deployment to solve an account-ownership ambiguity.
- Keep previews public-data-only. Protect them with Cloudflare Access before introducing PII, secrets, admin routes, or write-capable bindings.

## Future runtime boundary

Eventbrite is temporary. The approved registration target is hosted Stripe Checkout backed by a narrow Worker API and D1. Before adding that runtime:

- add an explicit Worker entrypoint and narrow `assets.run_worker_first` paths such as `/api/*`;
- create separate preview and production D1 databases and migrations;
- use Stripe test mode in previews and Worker secrets for live credentials;
- verify webhook signatures and idempotency, server-side prices, reconciliation, backups, retention, privacy, and rollback;
- protect admin routes with approved access controls and prevent previews from writing to production resources;
- add `Cache-Control: no-store` to dynamic PII/admin responses.

R2 public media remains separate from this runtime. Original photography is not stored in the public bucket or repository.

Official references: [Astro on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/), [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [preview URLs](https://developers.cloudflare.com/workers/configuration/previews/), and [rollbacks](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/).
