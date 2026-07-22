#!/usr/bin/env python3
"""Generate the draft Workers Static Assets redirect manifest from candidate data."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
records = json.loads((ROOT / "src/data/inductees.json").read_text(encoding="utf-8"))
rules: dict[str, str] = {}


def add(source: str, target: str) -> None:
    if not source.startswith("/") or source == target:
        return
    rules.setdefault(source, target)


for record in records:
    target = record["proposed_canonical_url"]
    for source in record["redirect_sources"]:
        add(source, target)
    repo_path = record["legacy_repo_url"]
    add(repo_path, target)
    add(repo_path.lower(), target)
    add("/" + record["canonical_slug"].replace("_", "-") + "/", target)
    # Gene was a known production root-path outlier.
    if record["display_name"] == "Gene Rozzelle":
        add("/gene_rozelle/", target)
        add("/Gene_Rozelle/", target)

for source, target in {
    "/security.txt": "/.well-known/security.txt",
    "/category/golf/": "/events/golf/",
    "/2024-joe-rossi-hall-of-fame-presents-the-umpires-cup-ii/": "/events/golf/2024-umpires-cup-ii/",
    "/2026-hof-golf-tournament/": "/events/golf/2026-umpires-cup-iv/",
    "/2026-hof-induction-banquet": "/events/induction-banquet/2026-hall-of-fame-induction-banquet/",
    "/2026-hof-induction-banquet/": "/events/induction-banquet/2026-hall-of-fame-induction-banquet/",
    "/privacy": "/privacy-policy/",
    "/privacy/": "/privacy-policy/",
    "/events/2026/hof-banquet": "/events/induction-banquet/2026-hall-of-fame-induction-banquet/",
    "/events/2026/hof-banquet/": "/events/induction-banquet/2026-hall-of-fame-induction-banquet/",
    "/events/2026/golf-tournament": "/events/golf/2026-umpires-cup-iv/",
    "/events/2026/golf-tournament/": "/events/golf/2026-umpires-cup-iv/",
    "/events/banquet-archive": "/events/induction-banquet/",
    "/events/banquet-archive/": "/events/induction-banquet/",
    "/events/golf-archive": "/events/golf/",
    "/events/golf-archive/": "/events/golf/",
    "/events/golf-tournament": "/events/golf/2026-umpires-cup-iv/",
    "/events/golf-tournament/": "/events/golf/2026-umpires-cup-iv/",
    "/events/induction-banquet/2026": "/events/induction-banquet/2026-hall-of-fame-induction-banquet/",
    "/events/induction-banquet/2026/": "/events/induction-banquet/2026-hall-of-fame-induction-banquet/",
    "/events/induction-banquet/2027": "/events/induction-banquet/2027-hall-of-fame-induction-banquet/",
    "/events/induction-banquet/2027/": "/events/induction-banquet/2027-hall-of-fame-induction-banquet/",
}.items():
    add(source, target)

lines = [
    "# Draft Workers Static Assets redirects generated from reconciled JRHOF sources.",
    "# Review in a preview deployment before production activation.",
]
lines.extend(f"{source} {target} 301" for source, target in sorted(rules.items(), key=lambda item: item[0].lower()))
(ROOT / "public/_redirects").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Wrote {len(rules)} direct redirect rules to public/_redirects")
