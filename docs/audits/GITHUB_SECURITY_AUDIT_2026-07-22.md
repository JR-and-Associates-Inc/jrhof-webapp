# GitHub Repository and Organization Security Audit — 2026-07-22

## Evidence boundary

The `tib3r1us` GitHub identity was authenticated with administrative access to `JR-and-Associates-Inc/jrhof-webapp` and `JR-and-Associates-Inc/.github`. Starting and ending settings were read through authenticated GitHub API and UI surfaces. No repository was made private, no license was added, no history was rewritten, and organization-wide 2FA was not enabled.

## Starting and ending settings

| Control | Verified starting state | Ending state |
|---|---|---|
| Rulesets / classic branch protection | No ruleset and no classic protection | Active `Protect main` ruleset targeting only `main` |
| Pull-request gate | None | Required; zero approving reviews; conversations must be resolved |
| Required validation | None | Exact current `site` check; strict/up-to-date branch required |
| Force push / deletion | Not blocked by a rule | Both blocked on `main` |
| Emergency bypass | None | Organization administrators only |
| Workflow token | Read-only; cannot approve PRs | Preserved |
| Actions allowlist | All actions allowed; SHA pinning not required | GitHub-owned actions only; reviewed full-SHA pinning required; no verified-creator blanket allowlist and no wildcard patterns |
| Fork workflow approval | First-time external contributors | All external contributors |
| CodeQL | Not configured | Default setup configured; JavaScript/TypeScript and detected Python; first run passed |
| Dependency graph | Disabled | Enabled |
| Dependabot alerts | Enabled | Preserved |
| Dependabot security / grouped updates | Disabled | Security updates and grouped security updates enabled |
| Secret scanning / push protection | Disabled | Both enabled |
| Private vulnerability reporting | Disabled | Enabled |
| Organization 2FA | Not required | Intentionally unchanged |

The first CodeQL default-setup run completed successfully on `main`: https://github.com/JR-and-Associates-Inc/jrhof-webapp/actions/runs/29949731094.

## Repository files

The default branch now contains:

- grouped weekly npm and GitHub Actions updates in `.github/dependabot.yml`;
- full-SHA-pinned GitHub-owned workflow actions maintained by Dependabot;
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`, a pull-request template, and structured bug, content-correction, historical-material, and security issue forms;
- `CODEOWNERS` assigning the real maintainer, `@tib3r1us`, without requiring a second reviewer;
- a public `SECURITY.md` path to private vulnerability reporting; and
- the staged organization-2FA and emergency-bypass checklist in `docs/GITHUB_SECURITY_CHECKLIST.md`.

No open-source license was added. Public source availability is not represented as an open-source grant.

## Organization profile and discovery

The organization-profile pull request was merged into `JR-and-Associates-Inc/.github` and its branch was deleted. The public profile now describes Astro and Cloudflare accurately, explains the Hall of Fame mission and JR and Associates, distinguishes charitable donations from event payments and GitHub sponsorship, and links to contribution and private-reporting paths. It no longer claims Next.js, universal MIT licensing, nonexistent public repositories, absence of measurement tools, or blanket tax deductibility.

The organization and repository descriptions and homepage URLs now point accurately to JRHOF. Repository topics are `accessibility`, `astro`, `baseball-history`, `cloudflare-workers`, and `nonprofit`. Only the real public web application is pinned. GitHub Sponsors is not configured, so no misleading Sponsors copy is live. A custom repository social-preview image was not changed because no separately approved brand asset was supplied; the repository continues to use its current/default preview.

## Controls intentionally left open

- Organization-wide 2FA remains off. Before activation, inventory noncompliant members and outside collaborators, confirm recovery codes and two usable factors for every owner, review removal impact on tokens and automation, designate a secured emergency owner, and obtain TJ's explicit approval.
- The Actions policy currently needs no third-party exception. Add an exception only for a reviewed action pinned to a full commit SHA.
- Run one harmless documentation-only fork PR to prove the external-contributor approval boundary and absence of secrets. Do not add secrets merely to test this.
- Review the CodeQL and Dependabot queues weekly and handle alerts through ordinary pull requests; do not use the emergency bypass for routine maintenance.

## Emergency rollback

An organization owner can use the documented bypass only to restore a broken production path or repair the ruleset itself. Record the actor, time, reason, exact commit/settings change, verification, and restoration of normal controls. Disable a malfunctioning security setting only long enough to recover, then restore it and document the exception.
