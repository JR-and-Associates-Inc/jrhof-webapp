# CLAUDE.md

Claude Code reads this file. The shared guide for every tool is AGENTS.md; keep project rules there, not here.

@AGENTS.md

## Claude Code specifics

- `.claude/launch.json` defines the `dev` server (port 4321) for the built-in browser preview. Use it to check changed pages at desktop width and at 390px before reporting a visual change as done.
- `.claude/settings.json` pre-approves the routine checks and always asks before deploys, R2 uploads, and `wrangler r2` commands.
