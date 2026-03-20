from __future__ import annotations

"""
skill_extractor.py — Section-aware skill extraction for AI Onboarding Engine

Extracts skills from text using the rich taxonomy with alias matching.
When given JD sections (from jd_parser), skills found in "required" sections
carry higher weight than "preferred" or "nice-to-have".
"""

import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
TAXONOMY: dict = json.loads((DATA_DIR / "taxonomy.json").read_text())

# Build reverse alias map: alias_lower -> canonical_id
ALIAS_MAP: dict[str, str] = {}
for skill_id, skill_data in TAXONOMY.items():
    for alias in skill_data.get("aliases", []):
        ALIAS_MAP[alias.lower()] = skill_id


def _find_matches_in_text(text: str, alias: str) -> list[str]:
    """Return evidence snippets for each matching occurrence of alias in text."""
    pattern = r'\b' + re.escape(alias) + r'\b'
    snippets = []
    for m in re.finditer(pattern, text, re.IGNORECASE):
        start = max(0, m.start() - 80)
        end = min(len(text), m.end() + 80)
        snippet = text[start:end].strip().replace("\n", " ")
        if snippet not in snippets:
            snippets.append(snippet)
        if len(snippets) >= 3:
            break
    return snippets


def extract_skills(text: str, source: str, sections: list[dict] | None = None) -> list[dict]:
    """
    Extract skills from text with optional JD section weighting.

    Args:
        text: Full text to search.
        source: 'resume' or 'jd'.
        sections: Optional list of {name, content, weight} dicts from jd_parser.
                  When provided, each match's weight is the max section weight
                  in which the alias appears.

    Returns:
        List of skill dicts:
        {
          skill, mention_count, evidence_snippets, source,
          weight, category, domain_tags, challenge_type
        }
    """
    text_lower = text.lower()
    results: dict[str, dict] = {}

    for alias, canonical in ALIAS_MAP.items():
        pattern = r'\b' + re.escape(alias) + r'\b'
        matches_in_full = re.findall(pattern, text_lower)
        if not matches_in_full:
            continue

        # Determine section-aware weight
        skill_weight = 0.4  # default (appears in text but no explicit section)
        req_type = "general"

        if sections:
            for section in sections:
                section_content_lower = section['content'].lower()
                if re.search(pattern, section_content_lower):
                    if section['weight'] > skill_weight:
                        skill_weight = section['weight']
                        req_type = section['name']
        else:
            # For resumes: use count and context to set a base weight
            skill_weight = min(0.4 + len(matches_in_full) * 0.1, 1.0)
            req_type = "resume_mention"

        skill_meta = TAXONOMY.get(canonical, {})

        if canonical not in results:
            results[canonical] = {
                "skill": canonical,
                "mention_count": 0,
                "evidence_snippets": [],
                "source": source,
                "weight": skill_weight,
                "requirement_type": req_type,
                "category": skill_meta.get("category", ""),
                "domain_tags": skill_meta.get("domain_tags", []),
                "challenge_type": skill_meta.get("challenge_type", "coding_dsa"),
            }
        else:
            if skill_weight > results[canonical]["weight"]:
                results[canonical]["weight"] = skill_weight
                results[canonical]["requirement_type"] = req_type

        results[canonical]["mention_count"] += len(matches_in_full)

        # Gather evidence snippets (deduplicated)
        snippets = _find_matches_in_text(text, alias)
        for s in snippets:
            if s not in results[canonical]["evidence_snippets"]:
                results[canonical]["evidence_snippets"].append(s)
        # Cap at 3 snippets
        results[canonical]["evidence_snippets"] = results[canonical]["evidence_snippets"][:3]

    return list(results.values())
