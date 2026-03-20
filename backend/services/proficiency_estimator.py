"""
proficiency_estimator.py — Evidence-aware skill level calibration

Estimates candidate skill proficiency from resume text using section-aware
evidence signals. Anti-inflation rules prevent over-scoring from skills-list
mentions alone.

Level semantics:
  0 = absent
  1 = beginner / exposed (skills list only)
  2 = working knowledge (skills list + 1 project, or 2+ project mentions)
  3 = applied in projects (explicit project/experience usage + verbs)
  4 = advanced / deep (leadership or production-scale evidence, multiple roles)
"""

import re

# ─── Section detection patterns ───────────────────────────────────────────────
SECTION_PATTERNS = {
    "experience": re.compile(
        r'\b(experience|work history|employment|internship|intern at|worked at|'
        r'position at|role at)\b', re.IGNORECASE
    ),
    "projects": re.compile(
        r'\b(project|built|developed|created|implemented|architected|designed|'
        r'deployed|launched)\b', re.IGNORECASE
    ),
    "certifications": re.compile(
        r'\b(certification|certified|certificate|credential|ceh|cissp|aws certified|'
        r'google professional|comptia|passed|earned)\b', re.IGNORECASE
    ),
    "education": re.compile(
        r'\b(education|university|college|bachelor|master|b\.sc|m\.sc|b\.tech|gpa)\b',
        re.IGNORECASE
    ),
    "hackathons": re.compile(
        r'\b(hackathon|competition|contest|award|prize|finalist|winner)\b',
        re.IGNORECASE
    ),
}

# Section contribution weights (must sum ≤ 1 but are used as multipliers)
SECTION_WEIGHTS = {
    "experience": 0.40,
    "projects": 0.30,
    "certifications": 0.15,
    "hackathons": 0.10,
    "education": 0.05,
    "skills_list": 0.10,
}

OWNERSHIP_VERBS = [
    "led", "built", "designed", "architected", "owned", "deployed",
    "developed", "implemented", "managed", "created", "engineered",
    "maintained", "optimized", "refactored", "integrated",
]

PROJECT_KEYWORDS = [
    "project", "production", "system", "platform", "pipeline",
    "application", "service", "api", "dashboard", "tool", "repo",
    "capstone", "final year", "thesis",
]

BASIC_SIGNALS = [
    "familiar with", "exposure to", "basic", "introduced to", "learning",
    "beginner", "completed a course", "understanding of",
]

ADVANCED_SIGNALS = [
    "led", "owned", "architected", "senior", "principal", "production",
    "scale", "deployed to production", "millions of", "at scale",
]


def _detect_sections(resume_text: str) -> dict[str, bool]:
    """
    Detect which resume sections a given text contains.
    Returns dict of {section_name: True/False}.
    """
    return {
        name: bool(pattern.search(resume_text))
        for name, pattern in SECTION_PATTERNS.items()
    }


def estimate_level(skill_data: dict, resume_text: str) -> dict:
    """
    Estimate proficiency level for a single skill with anti-inflation rules.

    Args:
        skill_data: Dict with 'skill', 'mention_count', 'evidence_snippets'.
        resume_text: Full resume text.

    Returns:
        {level: int, confidence: float, evidence_snippets: list, evidence_sources: list}
    """
    count = skill_data.get("mention_count", 0)
    snippets = skill_data.get("evidence_snippets", [])
    snippet_text = " ".join(snippets).lower()
    full_text_lower = resume_text.lower()
    skill_name = skill_data.get("skill", "")

    if count == 0:
        return {
            "level": 0,
            "confidence": 0.0,
            "evidence_snippets": [],
            "evidence_sources": [],
        }

    # ── Signal detection ───────────────────────────────────────────────────
    has_ownership = any(v in snippet_text for v in OWNERSHIP_VERBS)
    has_project = any(k in snippet_text for k in PROJECT_KEYWORDS)
    is_basic_only = any(s in snippet_text for s in BASIC_SIGNALS)
    has_advanced = any(s in snippet_text for s in ADVANCED_SIGNALS)

    # Detect which sections mention this skill
    sections_detected = _detect_sections(resume_text)
    evidence_sources = [s for s, found in sections_detected.items() if found]

    # ── Count mentions in specific contexts ───────────────────────────────
    # Find skill mentions specifically in project/experience context
    skill_lower = skill_name.replace("_", " ")
    project_ctx = re.findall(
        rf'(?:project|built|developed|implemented)[^\n]{{0,200}}{re.escape(skill_lower)}|'
        rf'{re.escape(skill_lower)}[^\n]{{0,200}}(?:project|built|developed|implemented)',
        full_text_lower
    )
    experience_ctx = re.findall(
        rf'(?:intern|engineer|developer|analyst|worked)[^\n]{{0,200}}{re.escape(skill_lower)}|'
        rf'{re.escape(skill_lower)}[^\n]{{0,200}}(?:intern|engineer|developer|analyst|worked)',
        full_text_lower
    )

    cert_ctx = re.findall(
        rf'certif[^\n]{{0,60}}{re.escape(skill_lower)}|'
        rf'{re.escape(skill_lower)}[^\n]{{0,60}}certif',
        full_text_lower
    )

    project_hits = len(project_ctx)
    experience_hits = len(experience_ctx)
    cert_hits = len(cert_ctx)

    # ── Level assignment with anti-inflation rules ─────────────────────────
    # Rule: Skills-list only mention → max level 1
    skill_in_skills_section = bool(re.search(
        rf'(?:skills?|technologies|tools?)[^\n]{{0,200}}{re.escape(skill_lower)}',
        full_text_lower
    ))

    if is_basic_only:
        level = 1
        confidence = 0.5

    elif has_advanced and (experience_hits >= 2 or (has_ownership and has_project)):
        # Strong evidence: advanced signals + experience context
        level = 4
        confidence = 0.9

    elif has_ownership and has_project:
        # Ownership verb + project context
        level = 3
        confidence = 0.85

    elif project_hits >= 2 or experience_hits >= 1:
        # Multiple project hits or real experience context
        level = 3
        confidence = 0.75

    elif project_hits >= 1 or (skill_in_skills_section and count >= 3):
        # One project hit or repeated non-basic mentions
        level = 2
        confidence = 0.65

    elif cert_hits >= 1:
        # Certification is credible but not applied experience
        level = 2
        confidence = 0.70

    elif count >= 2 and not skill_in_skills_section:
        # Mentioned multiple times outside a skills list
        level = 2
        confidence = 0.55

    else:
        # Skills list only or single mention
        level = 1
        confidence = 0.40

    # ── Anti-inflation cap ─────────────────────────────────────────────────
    # If only skill section involvement, cap at 1
    if skill_in_skills_section and project_hits == 0 and experience_hits == 0:
        level = min(level, 1)
        confidence = min(confidence, 0.60)

    # Never assign 4 without some project/experience evidence
    if level == 4 and project_hits == 0 and experience_hits == 0:
        level = 3
        confidence = min(confidence, 0.75)

    return {
        "level": level,
        "confidence": round(confidence, 2),
        "evidence_snippets": snippets[:3],
        "evidence_sources": evidence_sources,
    }
