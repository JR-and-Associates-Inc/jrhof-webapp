#!/usr/bin/env python3
"""Build the reviewable Astro inductee candidate dataset from reconciled sources.

This script is intentionally build-independent: the generated JSON is committed so
Cloudflare Pages only needs Node/Astro. It uses Python's standard library and reads
DOCX files as ZIP/XML without modifying the migration inputs.
"""

from __future__ import annotations

import csv
import json
import re
import shutil
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STATUS_PATH = ROOT / "_migration/source-reconciliation/updated-inductee-source-status.csv"
PRIOR_PATH = ROOT / "_migration/reconciliation/inductee-reconciliation.json"
OUTPUT_PATH = ROOT / "src/data/inductees.json"
PUBLIC_PORTRAITS = ROOT / "public/images/inductees"
PLACEHOLDER = "/images/inductees/missing_inductee.webp"
WP_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

PARAGRAPH_STARTS = {
    "Dan Weikle": ["While Dan’s resume", "During a career spanning six decades"],
    "Julius Carabello": [
        "Julius “Julie” Carabello was involved", "He continued his involvement", "After returning from his service",
        "As the co-founder", "His passion for sports", "Other colleges he worked", "Julie was invited",
        "Julie founded", "He was awarded", "In addition to coaching", "Carabello passed away",
    ],
    "Robert Schnabel": ["Robert Schnabel graduated", "Bob was an accomplished", "As an umpire", "Robert also worked"],
    "Warren Kettner": ["Warren Kettner may", "The native of Good Thunder", "After enlisting in the Army", "Warren then started", "Warren became the head baseball coach"],
}


def clean(value: object) -> str:
    return str(value or "").strip()


def slugify(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")


def sort_name(display_name: str) -> str:
    parts = [part.strip(",") for part in display_name.replace('"', "").split()]
    if parts and parts[-1].lower().rstrip(".") in {"jr", "sr", "ii", "iii", "iv"}:
        parts = parts[:-1]
    return f"{parts[-1]}, {' '.join(parts[:-1])}" if len(parts) > 1 else display_name


def docx_paragraphs(path: Path) -> list[str]:
    if not path.exists():
        return []
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    paragraphs: list[str] = []
    for paragraph in root.iter(WP_NS + "p"):
        text = "".join(node.text or "" for node in paragraph.iter(WP_NS + "t"))
        text = re.sub(r"\s+", " ", text).strip()
        if text and (not paragraphs or text != paragraphs[-1]):
            paragraphs.append(text)
    return paragraphs


def restore_known_paragraphs(display_name: str, paragraphs: list[str]) -> list[str]:
    """Restore paragraph boundaries flattened in four original DOCX files."""
    markers = PARAGRAPH_STARTS.get(display_name)
    if not markers or len(paragraphs) != 1:
        return paragraphs
    text = paragraphs[0]
    offsets = [0]
    for marker in markers:
        offset = text.find(marker)
        if offset <= offsets[-1]:
            raise ValueError(f"Paragraph marker not found for {display_name}: {marker}")
        offsets.append(offset)
    offsets.append(len(text))
    return [text[start:end].strip() for start, end in zip(offsets, offsets[1:])]


with STATUS_PATH.open(encoding="utf-8", newline="") as handle:
    statuses = list(csv.DictReader(handle))
with PRIOR_PATH.open(encoding="utf-8") as handle:
    prior_rows = json.load(handle)["inductees"]

prior_by_id = {f"jrhof-wp-{row['wordpress_id']}": row for row in prior_rows}
special_aliases = {
    "Bert Borgman": ["Bert Borgmann"],
    "Bill Fanning": ['William "Bill" Fanning'],
    "Dave Baker": ['Dave "Chick" Baker'],
    "Dick Reininger": ['Richard "Dick" Reininger'],
    "Gene Rozzelle": ["Gene Rozelle"],
    "Sam Corentino": ["Sam Corsentino"],
    "Steve Usecheck": ["Steve Usecheck Jr.", "Steve Usechek, Jr."],
    "Terry Garvey": ["Ray Garvey"],
}

records = []
for row in statuses:
    prior = prior_by_id[row["stable_id"]]
    display_name = row["csv_display_name"]
    canonical_slug = clean(row["wordpress_slug"]) or slugify(display_name).replace("-", "_")
    bio_source = clean(row["original_bio_file_match"])
    portrait_source = clean(row["canonical_photo_candidate"])
    paragraphs = docx_paragraphs(ROOT / bio_source) if bio_source else []
    paragraphs = restore_known_paragraphs(display_name, paragraphs)

    aliases = {
        clean(prior.get("repo_name")),
        clean(prior.get("wordpress_name")).replace("_", " "),
        clean(prior.get("live_card_name")),
        *special_aliases.get(display_name, []),
    }
    aliases = sorted(alias for alias in aliases if alias and alias != display_name)

    portrait_output_filename = ""
    portrait_url = PLACEHOLDER
    if portrait_source:
        source_path = ROOT / portrait_source
        portrait_output_filename = source_path.name
        destination = PUBLIC_PORTRAITS / portrait_output_filename
        if source_path.exists() and not destination.exists():
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, destination)
        if destination.exists():
            portrait_url = f"/images/inductees/{portrait_output_filename}"
        else:
            portrait_output_filename = ""

    redirect_sources = list(dict.fromkeys([
        *prior.get("redirect_sources", []),
        f"/{clean(prior.get('repo_slug'))}/" if clean(prior.get("repo_slug")) else "",
    ]))
    redirect_sources = [source for source in redirect_sources if source]

    board_review = (
        row["recommended_migration_lane"] in {"board_content_review", "identity_blocked"}
        or "display_name_review" in row["remaining_blockers"]
    )
    bio_available = bool(paragraphs)
    portrait_available = portrait_url != PLACEHOLDER
    current_wp_url = clean(prior.get("wordpress_url"))

    records.append({
        "stable_id": row["stable_id"],
        "display_name": display_name,
        "sort_name": sort_name(display_name),
        "aliases": aliases,
        "induction_year": int(row["csv_year_or_era"]) if row["csv_year_or_era"].isdigit() else None,
        "induction_era": row["csv_year_or_era"] if not row["csv_year_or_era"].isdigit() else None,
        "canonical_slug": canonical_slug,
        "current_wordpress_url": current_wp_url,
        "proposed_canonical_url": f"/inductees/{canonical_slug}/",
        "legacy_repo_url": f"/{clean(row['repo_slug'])}/" if clean(row["repo_slug"]) else "",
        "redirect_sources": redirect_sources,
        "bio_status": "available" if bio_available else "pending_review",
        "bio_source": bio_source,
        "biography": paragraphs,
        "portrait_status": "verified_candidate" if portrait_available else "pending_review",
        "portrait_source": portrait_source if portrait_available else "",
        "portrait_output_filename": portrait_output_filename,
        "portrait_url": portrait_url,
        "live_link_status": row["live_link_status"],
        "migration_lane": row["recommended_migration_lane"],
        "publication_status": "published_with_review_notice" if board_review else "published_candidate",
        "board_review_required": board_review,
        "reviewer_notes": row["reviewer_notes"],
        "source_provenance": {
            "control_roster": "content/All Inductees.csv",
            "reconciliation_status": "_migration/source-reconciliation/updated-inductee-source-status.csv",
            "original_biography": bio_source,
            "original_portrait": portrait_source,
            "repository_slug": clean(row["repo_slug"]),
            "wordpress_slug": clean(row["wordpress_slug"]),
            "live_card_name": clean(row["live_name"]),
        },
    })

records.sort(key=lambda item: (-(item["induction_year"] or 0), item["sort_name"]))
OUTPUT_PATH.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Wrote {len(records)} candidate inductees to {OUTPUT_PATH.relative_to(ROOT)}")
print(f"Biographies available: {sum(record['bio_status'] == 'available' for record in records)}")
print(f"Portraits available: {sum(record['portrait_status'] == 'verified_candidate' for record in records)}")
