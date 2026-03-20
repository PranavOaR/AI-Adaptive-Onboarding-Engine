from __future__ import annotations

"""
roadmap_generator.py — 4-phase roadmap generation for AI Onboarding Engine

Phases:
  - Foundation: prerequisites and fundamentals
  - Core Role Skills: role-template required skills with gaps
  - Applied Practice: hands-on and advanced skills
  - Optional Stretch: nice-to-have skills

Rules:
  - Prerequisites come before dependent skills
  - Missing skills before partial
  - Role emphasis drives ordering within each phase
  - item_type: "course" | "assessment"
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
COURSES = json.loads((DATA_DIR / "courses.json").read_text(encoding="utf-8"))

# Canonical phase ordering
PHASE_ORDER = {
    "Foundation": 0,
    "Core Role Skills": 1,
    "Applied Practice": 2,
    "Optional Stretch": 3,
}

# Difficulty → default phase assignment (for courses without explicit phase)
DIFFICULTY_TO_PHASE = {
    "beginner": "Foundation",
    "intermediate": "Core Role Skills",
    "advanced": "Applied Practice",
}


def _build_skill_to_courses() -> dict[str, list[dict]]:
    mapping: dict[str, list[dict]] = {}
    for c in COURSES:
        for skill in c.get("skills", []):
            mapping.setdefault(skill, []).append(c)
    return mapping


def generate_roadmap(
    gaps: list[dict],
    role_template: dict | None = None,
) -> tuple[list[dict], list[str]]:
    """
    Generate a 4-phase learning roadmap from gap analysis.

    Args:
        gaps: List of gap dicts from gap_analyzer.compute_gaps()
        role_template: Selected role template for phase emphasis guidance

    Returns:
        (roadmap_items, course_ids_added)
    """
    skill_course_map = _build_skill_to_courses()

    # Skills that need improvement (missing or partial)
    needed_skills = {
        g["skill"]: g for g in gaps
        if g["status"] in ("missing", "partial")
    }
    skill_priority = {
        g["skill"]: g["priority_score"] for g in gaps
    }
    req_type_order = {
        "required": 0, "qualifications": 1, "tools": 2, "preferred": 3,
        "responsibilities": 4, "general": 5, "role_implied": 6, "none": 7
    }
    skill_req_type = {
        g["skill"]: req_type_order.get(g.get("requirement_type", "general"), 5) for g in gaps
    }

    selected: dict[str, dict] = {}  # course_id -> course
    visiting: set[str] = set()
    added_for_skills: set[str] = set()  # track which skills got a course

    role_emphasis = set(role_template.get("required_skills", {}).keys()) if role_template else set()
    optional_skills = set(role_template.get("optional_skills", {}).keys()) if role_template else set()

    def add_course_for_skill(skill: str, force_phase: str | None = None):
        if skill in visiting:
            return
        visiting.add(skill)

        courses = skill_course_map.get(skill, [])
        if not courses:
            visiting.discard(skill)
            return

        # Pick the lowest-difficulty course that covers the skill
        courses_sorted = sorted(courses, key=lambda c: (
            {"beginner": 0, "intermediate": 1, "advanced": 2}.get(c.get("difficulty", "intermediate"), 1),
            c.get("duration_hours", 5)
        ))
        course = courses_sorted[0]

        if course["id"] not in selected:
            # Recursively add prerequisites first
            for prereq_skill in course.get("prerequisites", []):
                if prereq_skill not in added_for_skills:
                    add_course_for_skill(prereq_skill, force_phase="Foundation")

            # Determine phase
            if force_phase:
                phase = force_phase
            elif skill in optional_skills:
                phase = "Optional Stretch"
            elif skill in role_emphasis and needed_skills.get(skill, {}).get("gap", 0) > 0:
                phase = "Core Role Skills"
            else:
                phase = course.get("phase") or DIFFICULTY_TO_PHASE.get(
                    course.get("difficulty", "intermediate"), "Core Role Skills"
                )

            selected[course["id"]] = {
                **course,
                "phase": phase,
                "item_type": course.get("item_type", "course"),
                "prerequisites_needed": course.get("prerequisites", []),
                "justification": course.get(
                    "justification",
                    f"Covers the '{skill}' skill gap identified in the JD."
                ),
            }
            added_for_skills.add(skill)

        visiting.discard(skill)

    # Add courses for missing/partial skills, ordered by priority
    for skill in sorted(needed_skills.keys(), key=lambda s: -skill_priority.get(s, 0)):
        force = "Optional Stretch" if skill in optional_skills else None
        add_course_for_skill(skill, force_phase=force)

    # Sort roadmap by phase then requirement type then priority
    roadmap = list(selected.values())
    roadmap.sort(key=lambda c: (
        PHASE_ORDER.get(c["phase"], 99),
        skill_req_type.get((c.get("skills") or [""])[0], 99),
        -skill_priority.get((c.get("skills") or [""])[0], 0)
    ))

    return roadmap, list(selected.keys())
