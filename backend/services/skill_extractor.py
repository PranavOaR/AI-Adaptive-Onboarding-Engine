import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
TAXONOMY = json.loads((DATA_DIR / "taxonomy.json").read_text())

# Build reverse alias map: alias -> canonical
ALIAS_MAP = {}
for canonical, aliases in TAXONOMY.items():
    for alias in aliases:
        ALIAS_MAP[alias.lower()] = canonical


def extract_skills(text: str, source: str) -> list[dict]:
    text_lower = text.lower()
    results = {}
    for alias, canonical in ALIAS_MAP.items():
        pattern = r'\b' + re.escape(alias) + r'\b'
        matches = re.findall(pattern, text_lower)
        if matches:
            if canonical not in results:
                results[canonical] = {
                    "skill": canonical,
                    "mention_count": 0,
                    "evidence_snippets": [],
                    "source": source,
                }
            results[canonical]["mention_count"] += len(matches)
            # Extract surrounding sentence as evidence
            for m in re.finditer(pattern, text_lower):
                start = max(0, m.start() - 80)
                end = min(len(text), m.end() + 80)
                snippet = text[start:end].strip().replace("\n", " ")
                if snippet not in results[canonical]["evidence_snippets"]:
                    results[canonical]["evidence_snippets"].append(snippet)
                if len(results[canonical]["evidence_snippets"]) >= 3:
                    break
    return list(results.values())
