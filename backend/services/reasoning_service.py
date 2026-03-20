PHASE_MAP = {
    "beginner": "Foundation",
    "intermediate": "Intermediate",
    "advanced": "Role-Specific",
}


def build_trace(course: dict, gaps: list, jd_skills: dict, resume_skills: dict) -> dict:
    addressed = course["skills"]
    relevant_gaps = [g for g in gaps if g["skill"] in addressed]

    if not relevant_gaps:
        trigger_skill = addressed[0]
        gap_trigger = f"{trigger_skill} is a prerequisite for role progression"
    else:
        g = relevant_gaps[0]
        gap_trigger = (
            f"{g['skill']}: required level {g['required_level']}, "
            f"candidate level {g['candidate_level']} \u2192 gap of {g['gap']}"
        )

    jd_evidence = jd_skills.get(addressed[0], {}).get("evidence_snippets", [])[:2]
    resume_evidence = resume_skills.get(addressed[0], {}).get("evidence_snippets", [])

    return {
        "course_id": course["id"],
        "skill_gap_trigger": gap_trigger,
        "jd_evidence": jd_evidence or ["Skill mentioned in JD requirements"],
        "resume_evidence": resume_evidence or [],
        "course_selection_reason": (
            f"'{course['title']}' is the lowest-friction path to '{addressed[0]}' "
            f"({course['duration_hours']}h, {course['difficulty']})"
        ),
        "ordering_reason": (
            f"Placed in {PHASE_MAP.get(course['difficulty'], 'Role-Specific')} phase "
            f"due to difficulty={course['difficulty']} and prerequisite chain"
        ),
        "phase_assignment_reason": (
            f"'{course['difficulty']}' difficulty maps to "
            f"'{PHASE_MAP.get(course['difficulty'], 'Role-Specific')}' phase"
        ),
    }
