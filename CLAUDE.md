# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The shared agent guide for this repository is AGENTS.md (also read by Codex). Keep project guidance there so both tools stay in sync.

@AGENTS.md

## Claude Code specifics

- `.claude/launch.json` defines the `dev` server (port 4321, or the next free port when another session holds it; `astro.config.mjs` reads `PORT`) for the built-in browser preview. Use it to check changed pages at desktop width and at 390px (mobile preset) before reporting a visual change as done.
- `.claude/settings.json` pre-approves the routine checks and always asks before deploys, R2 uploads, and `wrangler r2` commands.
- `docs/private/` is gitignored and exists only on machines where the maintainer has placed it. When it is present, read `docs/private/ad-grants-audit-2026-09-25/README.md` before redesigning pages or touching tracking, links, or the donate flow, and the latest `docs/private/review-*/` notes before changing registration or security. Never commit these files or copy their account IDs into tracked files.
