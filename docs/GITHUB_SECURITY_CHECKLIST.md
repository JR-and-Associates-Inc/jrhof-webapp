# GitHub Security Checklist

## Repository target

- Dependency graph enabled.
- Dependabot alerts, security updates, grouped security updates, and weekly grouped version updates enabled.
- CodeQL default setup enabled for JavaScript/TypeScript.
- Secret scanning and push protection enabled if the repository/plan supports them; verify status after activation.
- Private vulnerability reporting enabled and the public `SECURITY.md` points to it.
- Workflow token default remains read-only.
- Actions allow only GitHub-owned actions and explicitly approved third-party actions; every workflow reference is pinned to a reviewed full commit SHA.
- Workflows from untrusted external contributors require approval and receive no repository secrets.
- `main` ruleset requires a pull request, the exact current `site` validation check, and resolved conversations; zero approving reviews avoids single-maintainer lockout.
- Force pushes and deletion of `main` are blocked; one trusted organization-owner bypass remains for documented emergencies.

## Organization 2FA staged rollout

Do not activate organization-wide 2FA until TJ explicitly approves all stages:

1. Inventory members and outside collaborators who do not have 2FA.
2. Confirm recovery codes and at least two usable factors (preferably passkey/hardware key plus backup) for every owner.
3. Review which members, collaborators, forks, tokens, and automations would lose access when enforcement removes noncompliant accounts.
4. Designate and test a trusted emergency organization owner on a separate secured identity.
5. Schedule the change, notify affected people, record rollback/escalation contacts, and obtain TJ's written approval.
6. Enable enforcement, verify membership and critical integrations, and record the post-change snapshot.

## Emergency bypass use

Use owner bypass only to restore a broken production path or repair a ruleset that prevents legitimate maintenance. Record who used it, when, why, the exact commit/settings changed, validation evidence, and when normal protections were restored. Never use bypass for convenience.
