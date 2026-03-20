import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
COURSES = json.loads((DATA_DIR / "courses.json").read_text())

PHASE_MAP = {
    "beginner": "Foundation",
    "intermediate": "Intermediate",
    "advanced": "Role-Specific",
}


def build_skill_to_courses() -> dict:
    mapping = {}
    for c in COURSES:
        for skill in c["skills"]:
            mapping.setdefault(skill, []).append(c)
    return mapping


def generate_roadmap(gaps: list) -> tuple[list, list]:
    """Returns (roadmap, prerequisite_courses_added)"""
    skill_course_map = build_skill_to_courses()
    needed_skills = {g["skill"] for g in gaps if g["status"] in ("missing", "partial")}

    selected = {}  # course_id -> course
    visiting = set()  # guard against infinite recursion
    skill_order = {g["skill"]: g["priority_score"] for g in gaps}

    def add_course_for_skill(skill):
        if skill in visiting or skill not in skill_course_map:
            return
        visiting.add(skill)
        courses = sorted(skill_course_map[skill], key=lambda c: c["duration_hours"])
        course = courses[0]
        if course["id"] not in selected:
            # Recursively add prerequisites first
            for prereq in course.get("prerequisites", []):
                if prereq not in {s for c in selected.values() for s in c["skills"]}:
                    add_course_for_skill(prereq)
            selected[course["id"]] = course
        visiting.discard(skill)

    for skill in sorted(needed_skills, key=lambda s: -skill_order.get(s, 0)):
        add_course_for_skill(skill)

    # Assign phases and topological sort
    roadmap = []
    for course in selected.values():
        phase = PHASE_MAP.get(course["difficulty"], "Role-Specific")
        roadmap.append(
            {**course, "phase": phase, "prerequisites_needed": course.get("prerequisites", [])}
        )

    phase_order = {"Foundation": 0, "Intermediate": 1, "Role-Specific": 2}
    return sorted(roadmap, key=lambda c: phase_order[c["phase"]]), list(selected.keys())
