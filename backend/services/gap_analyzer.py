from __future__ import annotations

"""
gap_analyzer.py — Evidence-grounded gap analysis for AI Onboarding Engine

Critical rule: A skill is ONLY surfaced as a gap if it:
  1. Explicitly appears in the JD (extracted by skill_extractor), OR
  2. Is in the selected role template's required_skills with high template confidence

This prevents phantom gaps (e.g., FastAPI in a cybersecurity JD).
"""

import re
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

IMPORTANCE_SIGNALS = {
    "high": ["required", "must have", "essential", "mandatory", "must ", "you must"],
    "medium": ["preferred", "strong", "proficient", "experience with", "solid"],
    "low": ["plus", "nice to have", "familiarity", "bonus", "desirable"],
}


def compute_jd_importance(skill: str, jd_text: str, jd_weight: float = 0.4) -> float:
    """
    Compute importance of a skill based on JD context signals.
    jd_weight is the section weight from jd_parser (required=1.0, preferred=0.6, etc.)
    """
    jd_lower = jd_text.lower()
    skill_display = skill.replace("_", " ")

    # Find the skill in the JD text
    idx = jd_lower.find(skill_display)
    if idx == -1:
        # Try aliases from fallback
        return jd_weight * 0.5

    context = jd_lower[max(0, idx - 80): idx + 80]

    if any(s in context for s in IMPORTANCE_SIGNALS["high"]):
        base = 1.0
    elif any(s in context for s in IMPORTANCE_SIGNALS["medium"]):
        base = 0.7
    elif any(s in context for s in IMPORTANCE_SIGNALS["low"]):
        base = 0.35
    else:
        base = jd_weight  # use section weight as default

    return round(min(base, 1.0), 3)


def _explain_requirement(skill: str, jd_text: str, role_template: dict, is_role_implied: bool) -> str:
    """Produce a human-readable explanation for why this skill is required."""
    jd_lower = jd_text.lower()
    skill_display = skill.replace("_", " ")

    if skill_display in jd_lower:
        idx = jd_lower.find(skill_display)
        snippet = jd_text[max(0, idx - 80): idx + 80].strip().replace("\n", " ")
        return f'Mentioned in JD: "…{snippet}…"'

    if is_role_implied:
        min_level = role_template.get("required_skills", {}).get(skill, "")
        return (
            f"Required by the {role_template.get('display_name', 'detected role')} template "
            f"(min level {min_level})"
        )

    return f"Found in job description requirements."


def _explain_candidate_level(skill: str, level: int, confidence: float, sources: list[str]) -> str:
    """Produce a human-readable explanation for the candidate's estimated level."""
    if level == 0:
        return "Not found in resume."
    source_str = ", ".join(sources) if sources else "resume text"
    level_labels = {1: "beginner/exposure", 2: "working knowledge", 3: "applied in projects", 4: "advanced"}
    return (
        f"Estimated level {level} ({level_labels.get(level, '')}) "
        f"based on evidence in: {source_str}. Confidence: {confidence:.0%}."
    )


def _explain_severity(gap: int, required_level: int, candidate_level: int) -> str:
    """Produce a human-readable explanation for gap severity."""
    if gap == 0:
        return "Candidate meets or exceeds the requirement."
    if candidate_level == 0:
        return f"Skill is completely absent from resume — full {required_level}-level gap."
    return (
        f"Candidate is at level {candidate_level} but role requires level {required_level}. "
        f"Gap of {gap} level{'s' if gap > 1 else ''} to close."
    )


def compute_gaps(
    candidate_profiles: list[dict],
    jd_skills: list[dict],
    jd_text: str,
    role_template: dict,
    role_confidence: float,
) -> list[dict]:
    """
    Compute skill gaps between candidate and JD requirements.

    Only surfaces gaps for skills that:
      - Appear in jd_skills (directly extracted from JD), OR
      - Are in the role template's required_skills AND role_confidence > 0.5

    Args:
        candidate_profiles: List of {skill, level, confidence, evidence_snippets, evidence_sources}
        jd_skills: List of extracted JD skill dicts (from skill_extractor)
        jd_text: Full JD text
        role_template: Selected role template dict
        role_confidence: Confidence in role detection (0.0–1.0)

    Returns:
        Sorted list of gap dicts with explanations.
    """
    # Build maps for quick lookup
    candidate_map: dict[str, dict] = {p["skill"]: p for p in candidate_profiles}
    jd_skill_ids: set[str] = {s["skill"] for s in jd_skills}
    jd_skill_map: dict[str, dict] = {s["skill"]: s for s in jd_skills}

    # Determine the universe of required skills to check
    # Only include role-template skills if confidence is high enough
    skills_to_check: dict[str, float] = {}  # skill_id -> jd_importance

    # Skills directly in JD always included
    for s in jd_skills:
        importance = compute_jd_importance(s["skill"], jd_text, s.get("weight", 0.4))
        # Use the max of section weight and contextual importance
        skills_to_check[s["skill"]] = max(importance, s.get("weight", 0.4))

    # Role template required skills: only add if NOT already in JD and confidence > 0.5
    if role_confidence > 0.5 and role_template:
        for skill, min_level in role_template.get("required_skills", {}).items():
            if skill not in skills_to_check:
                # Only add role-implied skill if its domain is strongly relevant
                template_importance = 0.5 * role_confidence
                skills_to_check[skill] = template_importance

    # Candidate skills that are NOT in skills_to_check are irrelevant to the role/JD
    irrelevant_skills = {
        p["skill"]: p for p in candidate_profiles
        if p["skill"] not in skills_to_check
    }

    gaps = []
    for skill, jd_importance in skills_to_check.items():
        cand_data = candidate_map.get(skill, {})
        cand_level = cand_data.get("level", 0)
        cand_confidence = cand_data.get("confidence", 0.0)
        cand_sources = cand_data.get("evidence_sources", [])
        cand_snippets = cand_data.get("evidence_snippets", [])

        # Required level: from JD skill extraction or role template
        if skill in jd_skill_map:
            # Infer required level from JD importance (1=basic, 2=medium, 3=high)
            req_level = max(1, round(jd_importance * 3))
        elif role_template and skill in role_template.get("required_skills", {}):
            req_level = role_template["required_skills"][skill]
        else:
            req_level = 1

        gap = max(req_level - cand_level, 0)

        if gap == 0:
            status = "matched"
        elif cand_level > 0:
            status = "partial"
        else:
            status = "missing"

        is_role_implied = skill not in jd_skill_ids
        why_required = _explain_requirement(skill, jd_text, role_template, is_role_implied)
        why_candidate = _explain_candidate_level(skill, cand_level, cand_confidence, cand_sources)
        why_severity = _explain_severity(gap, req_level, cand_level)

        # Priority = weighted combination: gap magnitude + jd_importance + confidence adjustment
        confidence_factor = 1.0 - (cand_confidence * 0.3)  # lower confidence → slightly higher urgency
        priority = round((gap * 0.4) + (jd_importance * 0.4) + (confidence_factor * 0.2), 3)
        # Determine requirement type
        req_type = "role_implied"
        if skill in jd_skill_map:
            req_type = jd_skill_map[skill].get("requirement_type", "general")

        gaps.append({
            "skill": skill,
            "candidate_level": cand_level,
            "candidate_confidence": cand_confidence,
            "required_level": req_level,
            "gap": gap,
            "status": status,
            "priority_score": priority,
            "jd_importance": jd_importance,
            "requirement_type": req_type,
            "grounding_source_id": "jd" if skill in jd_skill_map else "role_template",
            "why_required": why_required,
            "why_candidate_level": why_candidate,
            "why_severity": why_severity,
            "resume_evidence": cand_snippets,
            "jd_evidence": jd_skill_map.get(skill, {}).get("evidence_snippets", []),
        })

    # Add irrelevant skills to the output
    for skill, cand_data in irrelevant_skills.items():
        cand_level = cand_data.get("level", 0)
        cand_confidence = cand_data.get("confidence", 0.0)
        gaps.append({
            "skill": skill,
            "candidate_level": cand_level,
            "candidate_confidence": cand_confidence,
            "required_level": 0,
            "gap": 0,
            "status": "irrelevant",
            "priority_score": -1.0,
            "jd_importance": 0.0,
            "requirement_type": "none",
            "grounding_source_id": "resume",
            "why_required": "Not required by JD or Role.",
            "why_candidate_level": _explain_candidate_level(skill, cand_level, cand_confidence, cand_data.get("evidence_sources", [])),
            "why_severity": "Skill is present but not relevant to this role.",
            "resume_evidence": cand_data.get("evidence_snippets", []),
            "jd_evidence": [],
        })

    return sorted(gaps, key=lambda x: -x["priority_score"])
