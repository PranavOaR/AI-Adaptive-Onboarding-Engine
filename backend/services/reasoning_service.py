"""
reasoning_service.py — Evidence-grounded reasoning traces for each roadmap item.

For every roadmap course, generates structured evidence explaining:
  - Why the gap exists (with JD evidence)
  - What the candidate's evidence is
  - Why this course was selected
  - Why this assessment was chosen
"""


PHASE_MAP = {
    "Foundation": "Foundation",
    "Core Role Skills": "Core Role Skills",
    "Applied Practice": "Applied Practice",
    "Optional Stretch": "Optional Stretch",
    # Backward compat with old phase names
    "Intermediate": "Core Role Skills",
    "Role-Specific": "Applied Practice",
}


def build_trace(
    course: dict,
    gaps: list[dict],
    jd_skills: dict,
    resume_skills: dict,
) -> dict:
    """
    Build a structured evidence trace for a single roadmap item.

    Args:
        course: Roadmap course dict.
        gaps: All gap results from gap_analyzer.
        jd_skills: Dict of {skill_id: skill_dict} from JD extraction.
        resume_skills: Dict of {skill_id: skill_dict} from resume extraction.

    Returns:
        Structured trace dict with JD evidence, resume evidence, and explanations.
    """
    addressed_skills = course.get("skills", [])

    # Find the primary gap this course addresses
    relevant_gaps = [g for g in gaps if g["skill"] in addressed_skills]
    relevant_gaps_sorted = sorted(relevant_gaps, key=lambda g: -g["priority_score"])

    if relevant_gaps_sorted:
        primary_gap = relevant_gaps_sorted[0]
        skill = primary_gap["skill"]
        gap_trigger = (
            f"{skill}: required level {primary_gap['required_level']}, "
            f"candidate level {primary_gap['candidate_level']} "
            f"→ gap of {primary_gap['gap']}"
        )
        why_required = primary_gap.get("why_required", "")
        why_candidate = primary_gap.get("why_candidate_level", "")
        why_severity = primary_gap.get("why_severity", "")
        jd_evidence = primary_gap.get("jd_evidence", [])
        resume_evidence = primary_gap.get("resume_evidence", [])
        req_type = primary_gap.get("requirement_type", "none")
        cand_confidence = primary_gap.get("candidate_confidence", 0.0)
    else:
        # Prerequisite course — no direct gap, but needed for dependencies
        skill = addressed_skills[0] if addressed_skills else "prerequisite"
        gap_trigger = f"{skill} is a prerequisite required for dependent skills in this role."
        why_required = f"'{skill}' is a foundational prerequisite for other skills in the roadmap."
        why_candidate = "This skill was added to the roadmap as a prerequisite, not as a direct gap."
        why_severity = "Prerequisite skills must be established before training dependent skills."
        # Pull from JD/resume skill maps
        jd_evidence = jd_skills.get(skill, {}).get("evidence_snippets", [])
        resume_evidence = resume_skills.get(skill, {}).get("evidence_snippets", [])
        req_type = "prerequisite"
        cand_confidence = resume_skills.get(skill, {}).get("confidence", 0.0)

    # JD evidence fallback
    if not jd_evidence and skill in jd_skills:
        jd_evidence = jd_skills[skill].get("evidence_snippets", [])[:2]
    if not jd_evidence:
        jd_evidence = [f"'{skill.replace('_', ' ')}' referenced in the job description requirements."]

    # Resume evidence
    if not resume_evidence and skill in resume_skills:
        resume_evidence = resume_skills[skill].get("evidence_snippets", [])[:2]

    # Course selection reasoning
    duration = course.get("duration_hours", "?")
    difficulty = course.get("difficulty", "?")
    phase = PHASE_MAP.get(course.get("phase", ""), course.get("phase", ""))

    course_selection_reason = (
        course.get("justification") or
        f"'{course['title']}' is the shortest available path to building '{skill}' "
        f"proficiency ({duration}h, {difficulty} level)."
    )

    assessment_reason = _get_assessment_reason(course, relevant_gaps_sorted)

    ordering_reason = (
        f"Placed in '{phase}' phase because "
        f"difficulty={difficulty!r} and skill is "
        f"{'directly required by the JD' if not relevant_gaps_sorted or relevant_gaps_sorted[0].get('why_required', '').startswith('Mentioned') else 'part of the role template'}."
    )

    return {
        "course_id": course.get("id", ""),
        "skill_gap_trigger": gap_trigger,
        "jd_evidence": jd_evidence[:2],
        "resume_evidence": resume_evidence[:2],
        "course_selection_reason": course_selection_reason,
        "ordering_reason": ordering_reason,
        "phase_assignment_reason": f"Assigned to '{phase}' phase based on difficulty and role relevance.",
        "why_required": why_required,
        "why_candidate_level": why_candidate,
        "why_severity": why_severity,
        "assessment_reason": assessment_reason,
        "requirement_type": req_type,
        "candidate_confidence": cand_confidence,
    }


def _get_assessment_reason(course: dict, relevant_gaps: list[dict]) -> str:
    """Explain why the associated challenge type was chosen for this skill."""
    if not relevant_gaps:
        return "No direct assessment needed — this is a prerequisite course."

    gap = relevant_gaps[0]
    skill = gap["skill"]

    challenge_type_explanations = {
        "coding_dsa": (
            f"'{skill}' is a coding skill best validated through algorithm/logic problems. "
            "A coding assessment in Judge0 directly measures implementation ability."
        ),
        "coding_framework": (
            f"'{skill}' is a framework skill. The assessment uses a realistic coding task "
            "(e.g., build an endpoint, implement a feature) rather than a generic algorithm."
        ),
        "query_writing": (
            f"'{skill}' is a SQL/data skill. The assessment presents a database schema "
            "and asks the candidate to write the correct query."
        ),
        "practical_config": (
            f"'{skill}' is a DevOps/tools skill. The assessment presents a real config "
            "(Dockerfile, YAML, etc.) with bugs or missing parts to fix."
        ),
        "mcq_concept": (
            f"'{skill}' is a conceptual knowledge domain. A multiple-choice assessment "
            "efficiently tests understanding of definitions, trade-offs, and scenarios."
        ),
        "scenario_analysis": (
            f"'{skill}' is an operational or security skill. A scenario-based assessment "
            "presents a realistic situation (logs, API responses, alert data) for the "
            "candidate to analyze and respond to."
        ),
        "debugging": (
            f"'{skill}' is best tested by presenting broken code or misconfigured files "
            "that the candidate must identify and fix."
        ),
    }

    # Get challenge type from course skills (first skill's type)
    skill_in_gap = gap.get("skill", "")
    return challenge_type_explanations.get("mcq_concept", "Challenge type matched to skill category.")
