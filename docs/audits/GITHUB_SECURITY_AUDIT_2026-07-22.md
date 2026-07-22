# GitHub Repository and Organization Security Audit — 2026-07-22

## Evidence boundary

The connected GitHub repository metadata verified that `JR-and-Associates-Inc/jrhof-webapp` and `JR-and-Associates-Inc/.github` are public, use `main`, and grant the connected identity administrative permission. The checked-out workflow verified `permissions: contents: read` and two unpinned GitHub-owned Actions. The settings interface was blocked by the environment's enterprise network policy, and the available GitHub connector has no repository-settings endpoints. No setting was changed without a readable before-state.

The following starting observations were supplied for this assignment and still require TJ to reconfirm in GitHub before applying changes:

| Setting | Supplied starting observation | Applied in this work |
|---|---|---|
| Rulesets/classic protection | None | No settings change |
| Workflow token default | Read-only | Preserved in workflow and checklist; no settings change |
| Allowed Actions | All third-party Actions allowed | Workflow references pinned; no settings change |
| Fork workflow approval | First-time external contributors require approval | No settings change |
| CodeQL | Not configured | No settings change |
| Secret Protection | Disabled | No settings change |
| Private vulnerability reporting | Disabled | Repository links prepared; no settings change |
| Dependency graph | Disabled | Dependabot file prepared; no settings change |
| Dependabot alerts | Enabled | No settings change |
| Dependabot security/grouped/version updates | Disabled | Grouped weekly config prepared; no settings change |
| Organization 2FA | Not required | Intentionally not changed |

## Repository file changes

This branch adds grouped weekly npm and GitHub Actions updates, an npm security-update group, CODEOWNERS for `@tib3r1us`, community health documents, pull-request guidance, structured issue forms, and a staged security checklist. GitHub-owned actions are pinned to reviewed release commits:

- `actions/checkout` v4.3.1 → `34e114876b0b11c390a56381ad16ebd13914f8d5`
- `actions/setup-node` v4.4.0 → `49933ea5288caeca8642d1e84afbd3f7d6820020`

No open-source license was added.

## Exact manual settings steps for TJ

Perform these only after this branch's pull request is validated and before merging if the setting depends on files in the default branch:

1. **Dependency graph and Dependabot:** repository **Settings → Advanced Security**. Capture a screenshot, enable Dependency graph, Dependabot security updates, and Grouped security updates. Keep Dependabot alerts enabled. After the PR merges, confirm `.github/dependabot.yml` is parsed without an error and produces weekly npm/Actions version updates.
2. **CodeQL:** **Security → Code scanning → Set up → Default**. Select JavaScript/TypeScript and the default branch; do not add a redundant advanced workflow. Confirm the first scan completes.
3. **Private reporting:** **Settings → Advanced Security → Private vulnerability reporting → Enable**. Open the private-report URL in a signed-out/private window far enough to confirm availability without submitting anything.
4. **Secret scanning:** in **Advanced Security**, enable Secret scanning and Push protection where GitHub shows them as available. Capture any plan/eligibility limitation rather than assuming success.
5. **Actions policy:** **Settings → Actions → General**. Choose “Allow select actions and reusable workflows,” allow GitHub-owned actions, and add only explicitly reviewed third parties when needed. Keep workflow permissions read-only and disable approval of pull requests by Actions. Require approval for all outside collaborators if the UI offers that stricter choice; otherwise retain at least first-time contributor approval.
6. **Main ruleset:** **Settings → Rules → Rulesets → New branch ruleset** targeting exactly `main`. Set Active. Require a pull request, zero required approvals, successful current validation context `Validate / site` (select it from completed checks rather than typing a guessed context), and resolved conversations. Block force pushes and branch deletion. Retain only the trusted organization-owner emergency bypass; do not add broad team/app bypasses.
7. **Fork secret check:** open a harmless fork PR that changes documentation only. Confirm the validation job runs only after the configured approval boundary and that no environment/repository/organization secrets are exposed to the fork job.
8. **Record after-state:** save screenshots of every changed panel, export or copy the ruleset JSON if GitHub offers it, record the CodeQL run URL, and update the table above with exact timestamps.

Do not enable organization-wide 2FA until the staged checklist in `docs/GITHUB_SECURITY_CHECKLIST.md` is complete and TJ gives explicit approval.

## Organization profile and repository discovery review

The `.github/profile/README.md` correction is isolated in the organization-profile repository branch. It removes the Next.js, nonexistent public repository, universal MIT-license, no-tracking, and blanket tax-deduction claims and replaces them with the current Astro/Cloudflare architecture, mission, contribution paths, private reporting, and transaction distinctions.

Repository descriptions, homepage fields, topics, social-preview images, pinned repositories, and GitHub Sponsors text were not changed because the settings interface could not be inspected. TJ should:

1. Confirm `jrhof-webapp` describes the Astro website and uses `https://jrhof.org/` as its homepage.
2. Keep topics factual and limited, for example `astro`, `cloudflare-workers`, `nonprofit`, `baseball-history`, and `accessibility`; remove Next.js/Tailwind topics if present.
3. Use a current approved Hall of Fame brand image for the repository social preview, with readable text at GitHub's crop sizes.
4. Pin only existing public repositories with accurate descriptions; do not present private or nonexistent repositories as public.
5. Review the public organization profile after the profile PR merges and verify every link in a signed-out window.
6. Review GitHub Sponsors wording separately. It must not call event payments sponsorships or guarantee tax deductibility; link charitable donors to jrhof.org and event sponsors to the contact page.
