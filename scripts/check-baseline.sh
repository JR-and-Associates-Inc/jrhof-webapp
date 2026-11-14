#!/usr/bin/env bash
# Fails if the repository drifts from the TMCO baseline.
# Safe to run locally: it only reads files.
set -uo pipefail
fail=0
note() { echo "FAIL: $*"; fail=1; }

# 1. Required files
for f in SECURITY.md .github/CODEOWNERS .github/dependabot.yml .gitignore; do
  [ -f "$f" ] || note "missing $f"
done

# 2. No secret-style files tracked in git
bad=$(git ls-files | grep -iE '(^|/)\.env($|\.)|(^|/)\.dev\.vars$|\.pem$|\.p12$|\.pfx$|(^|/)id_(rsa|ed25519)$' | grep -viE '\.(example|sample|template)$' || true)
[ -z "$bad" ] || note "secret-style files are tracked: $(echo "$bad" | tr '\n' ' ')"

# 3. Workflow rules
shopt -s nullglob
for w in .github/workflows/*.yml .github/workflows/*.yaml; do
  # Drop full-line comments so commented-out examples are ignored.
  body=$(grep -vE '^[[:space:]]*#' "$w" || true)

  # Every third-party action pinned to a full commit SHA. Handles quoted keys
  # and values ("uses": "owner/repo@sha") and trailing comments.
  while IFS= read -r ref; do
    [ -n "$ref" ] || continue
    case "$ref" in ./*|docker://*) continue ;; esac
    echo "$ref" | grep -qE '@[0-9a-f]{40}$' || note "$w has an action not pinned to a commit SHA: $ref"
  done < <(echo "$body" \
    | grep -E "^[[:space:]]*-?[[:space:]]*[\"']?uses[\"']?[[:space:]]*:" \
    | sed -E "s/^[[:space:]]*-?[[:space:]]*[\"']?uses[\"']?[[:space:]]*:[[:space:]]*//; s/[[:space:]]+#.*$//; s/^[\"']//; s/[\"'][[:space:]]*$//; s/[[:space:]]+$//")

  # Explicit least-privilege token permissions
  echo "$body" | grep -qE "^[\"']?permissions[\"']?[[:space:]]*:" || note "$w has no top-level permissions block"

  # pull_request_target in any form (mapping key, scalar, or list item)
  echo "$body" | grep -qE '(^|[^A-Za-z0-9_])pull_request_target([^A-Za-z0-9_]|$)' && note "$w uses pull_request_target"
done

[ "$fail" -eq 0 ] && echo "Baseline check passed."
exit "$fail"
