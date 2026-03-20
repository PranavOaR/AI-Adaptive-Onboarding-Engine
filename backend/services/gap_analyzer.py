import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
ROLE_TEMPLATES = json.loads((DATA_DIR / "role_templates.json").read_text())

JD_IMPORTANCE_SIGNALS = {
    "high": ["required", "must have", "essential", "mandatory", "must"],
    "medium": ["preferred", "strong", "proficient", "experience with"],
    "low": ["plus", "nice to have", "familiarity", "bonus"],
}


def compute_jd_importance(skill: str, jd_text: str) -> float:
    jd_lower = jd_text.lower()
    skill_idx = jd_lower.find(skill.replace("_", " "))
    if skill_idx == -1:
        return 0.3  # present but no modifier found
    context = jd_lower[max(0, skill_idx - 60) : skill_idx + 60]
    if any(s in context for s in JD_IMPORTANCE_SIGNALS["high"]):
        return 1.0
    if any(s in context for s in JD_IMPORTANCE_SIGNALS["medium"]):
        return 0.7
    return 0.4


def compute_priority(gap: int, jd_importance: float, is_prerequisite: bool) -> float:
    prereq_bonus = 0.2 if is_prerequisite else 0.0
    return round((gap * 0.4) + (jd_importance * 0.4) + prereq_bonus, 3)


def compute_gaps(candidate_skills: dict, required_skills: dict, jd_text: str) -> list:
    gaps = []
    for skill, req_level in required_skills.items():
        cand_level = candidate_skills.get(skill, 0)
        gap = max(req_level - cand_level, 0)
        status = "matched" if gap == 0 else ("partial" if cand_level > 0 else "missing")
        jd_importance = compute_jd_importance(skill, jd_text)
        priority = compute_priority(gap, jd_importance, False)
        gaps.append(
            {
                "skill": skill,
                "candidate_level": cand_level,
                "required_level": req_level,
                "gap": gap,
                "status": status,
                "priority_score": priority,
                "jd_importance": jd_importance,
            }
        )
    return sorted(gaps, key=lambda x: -x["priority_score"])
