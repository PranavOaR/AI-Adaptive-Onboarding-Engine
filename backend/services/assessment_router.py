"""
assessment_router.py — Semantic challenge routing for AI Onboarding Engine

Maps skill gaps to the most appropriate challenge based on:
  - Skill category (from taxonomy)
  - Challenge type (coding_dsa, coding_framework, mcq_concept, scenario_analysis, etc.)
  - Skill-specific overrides

Rules:
  - programming/dsa skills → coding_dsa
  - framework skills (fastapi, react, express) → coding_framework or debugging
  - SQL → query_writing
  - Docker/Git/AWS → practical_config or scenario_analysis
  - Security concepts → mcq_concept or scenario_analysis
  - Incident response / log analysis → scenario_analysis
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / "frontend" / "src" / "data"
_CHALLENGES = json.loads((DATA_DIR / "challenges.json").read_text(encoding="utf-8"))

# Category → preferred challenge types (in priority order)
CATEGORY_CHALLENGE_TYPES: dict[str, list[str]] = {
    "programming_language": ["coding_dsa", "coding_framework"],
    "frontend": ["coding_framework", "coding_dsa"],
    "backend": ["coding_framework", "coding_dsa"],
    "database": ["query_writing", "coding_dsa"],
    "data_analytics": ["coding_framework", "mcq_concept", "query_writing"],
    "ai_ml": ["coding_framework", "coding_dsa"],
    "devops_cloud": ["practical_config", "scenario_analysis", "mcq_concept"],
    "cybersecurity_appsec": ["scenario_analysis", "mcq_concept", "practical_config"],
}

# Per-skill forced overrides (skill_id -> challenge_id) for exact routing
SKILL_CHALLENGE_OVERRIDES: dict[str, str] = {
    "owasp_top_10": "CH009",        # OWASP MCQ
    "incident_response": "CH011",   # Log triage scenario
    "log_analysis": "CH011",        # Log triage scenario
    "threat_detection": "CH011",    # Log triage scenario
    "linux": "CH010",               # Linux MCQ
    "networking": "CH010",          # Routing networking to Linux MCQ context if no other fits
    "tcp_ip": "CH010",              # Routing tcp_ip to Linux MCQ
    "http": "CH009",                # Routing web basics to OWASP MCQ
    "fastapi": "CH003",             # Simple REST API
    "express": "CH003",             # Simple REST API
    "react": "CH004",               # React State Debugging
    "docker": "CH005",              # Dockerfile debug challenge
    "kubernetes": "CH006",          # K8s Ingress YAML Fix
    "pandas": "CH007",              # Pandas Data Cleaning
    "scikit_learn": "CH008",        # Scikit-Learn Classification
    "sql": "CH002",                 # SQL window functions
    "postgres": "CH002",            # SQL window functions
    "python": "CH001",              # Two Sum (coding DSA)
    "aws": "CH012",                 # AWS IAM Least Privilege
    "web_security": "CH009",        # OWASP umbrella
    "api_security": "CH009",        # OWASP umbrella
    "secure_coding": "CH009",       # Point to OWASP concepts
}


def _build_skill_to_challenge_map() -> dict[str, str]:
    """
    Build a mapping from skill_id to best challenge_id.
    First checks SKILL_CHALLENGE_OVERRIDES, then falls back to category matching.
    """
    # Build category-aware index from challenges
    # challenge -> {challenge_type, skills}
    type_index: dict[str, list[dict]] = {}
    for ch in _CHALLENGES:
        ctype = ch.get("challenge_type", "coding_dsa")
        type_index.setdefault(ctype, []).append(ch)

    return dict(SKILL_CHALLENGE_OVERRIDES)


# Pre-built map (skill_id -> challenge_id)
_SKILL_TO_CHALLENGE: dict[str, str] = _build_skill_to_challenge_map()

# Build challenge_id -> challenge object for quick lookup
_CHALLENGE_INDEX: dict[str, dict] = {ch["id"]: ch for ch in _CHALLENGES}


def route_challenge(skill_id: str, category: str = "") -> dict | None:
    """
    Route a skill gap to the most appropriate challenge.

    Args:
        skill_id: Canonical skill ID (e.g., 'fastapi', 'owasp_top_10')
        category: Skill category from taxonomy (e.g., 'framework', 'security_concept')

    Returns:
        Challenge dict or None if no suitable challenge found.
    """
    # 1. Check direct override
    if skill_id in _SKILL_TO_CHALLENGE:
        challenge_id = _SKILL_TO_CHALLENGE[skill_id]
        return _CHALLENGE_INDEX.get(challenge_id)

    # 2. Match by skill ID in challenge's skills list
    for ch in _CHALLENGES:
        if skill_id in ch.get("skills", []):
            return ch

    # 3. Category-based fallback: find any challenge of preferred type
    preferred_types = CATEGORY_CHALLENGE_TYPES.get(category, ["coding_dsa"])
    for ptype in preferred_types:
        candidates = [
            ch for ch in _CHALLENGES
            if ch.get("challenge_type") == ptype
        ]
        if candidates:
            return candidates[0]

    return None


def get_challenge_by_id(challenge_id: str) -> dict | None:
    """Return a challenge by its ID."""
    return _CHALLENGE_INDEX.get(challenge_id)
