# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The shared agent guide for this repository is AGENTS.md (also read by Codex). Keep project guidance there so both tools stay in sync.

@AGENTS.md

## Claude Code specifics

- `.claude/launch.json` defines the `dev` server (port 4321) for the built-in browser preview. Use it to check changed pages at desktop width and at 390px (mobile preset) before reporting a visual change as done.
- `.claude/settings.json` pre-approves the routine checks and always asks before deploys, R2 uploads, and `wrangler r2` commands.
