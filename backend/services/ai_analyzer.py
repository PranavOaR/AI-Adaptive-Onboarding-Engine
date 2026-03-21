"""AI-powered analysis enhancement using Groq LLM."""
from __future__ import annotations

import json
import logging
import os
from typing import Any

try:
    from groq import Groq
    _client: Groq | None = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
except Exception:
    _client = None

MODEL = "llama-3.3-70b-versatile"
logger = logging.getLogger("ai-analyzer")


def _call_groq(system_prompt: str, user_prompt: str, max_tokens: int = 1024) -> str | None:
    """Make a single Groq API call. Returns None on failure."""
    if not _client or not os.environ.get("GROQ_API_KEY", "").strip():
        return None
    try:
        resp = _client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return resp.choices[0].message.content
    except Exception as e:
        logger.warning(f"Groq API call failed: {e}")
        return None


def enhance_skill_extraction(
    resume_text: str,
    jd_text: str,
    heuristic_resume_skills: list[dict],
    heuristic_jd_skills: list[dict],
) -> dict[str, Any]:
    """
    Use AI to find skills that heuristic extraction missed and validate existing ones.
    Returns dict with 'additional_resume_skills' and 'additional_jd_skills'.
    """
    existing_resume = [s["skill"] for s in heuristic_resume_skills]
    existing_jd = [s["skill"] for s in heuristic_jd_skills]

    system = (
        "You are an expert technical recruiter and skills analyst. "
        "Analyze documents to extract technical and professional skills. "
        "Return ONLY valid JSON, no markdown formatting."
    )

    user = f"""Analyze the following resume and job description. The heuristic system already extracted these skills:

Resume skills found: {json.dumps(existing_resume)}
JD skills found: {json.dumps(existing_jd)}

RESUME TEXT (first 3000 chars):
{resume_text[:3000]}

JOB DESCRIPTION TEXT (first 2000 chars):
{jd_text[:2000] if jd_text else 'No JD provided'}

Find any ADDITIONAL skills that the heuristic system missed. Also identify the proficiency evidence for resume skills.
Return JSON with this exact structure:
{{
  "additional_resume_skills": ["skill1", "skill2"],
  "additional_jd_skills": ["skill1", "skill2"],
  "skill_insights": {{
    "skill_name": {{
      "proficiency_hint": "beginner|intermediate|advanced|expert",
      "evidence": "brief evidence from text"
    }}
  }}
}}"""

    raw = _call_groq(system, user, max_tokens=800)
    if not raw:
        return {"additional_resume_skills": [], "additional_jd_skills": [], "skill_insights": {}}

    try:
        # Strip markdown fences if present
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        return json.loads(cleaned)
    except (json.JSONDecodeError, KeyError):
        logger.warning(f"Failed to parse AI skill extraction response")
        return {"additional_resume_skills": [], "additional_jd_skills": [], "skill_insights": {}}


def generate_ai_summary(
    resume_text: str,
    jd_text: str,
    gaps: list[dict],
    roadmap: list[dict],
    summary: dict,
) -> dict[str, Any]:
    """
    Generate AI-powered narrative insights about the candidate's profile.
    Returns dict with 'strengths', 'improvement_areas', 'action_plan', 'overall_assessment'.
    """
    matched_skills = [g["skill"] for g in gaps if g["status"] == "matched"]
    missing_skills = [g["skill"] for g in gaps if g["status"] == "missing"]
    partial_skills = [g["skill"] for g in gaps if g["status"] == "partial"]
    roadmap_titles = [c.get("title", "") for c in roadmap[:8]]

    system = (
        "You are a senior career advisor providing personalized, actionable career guidance. "
        "Be specific, reference actual skills and data. Avoid generic advice. "
        "Return ONLY valid JSON, no markdown formatting."
    )

    user = f"""Analyze this candidate's profile against the job requirements and provide strategic insights.

TARGET ROLE: {summary.get('role_display_name', 'Unknown')}
READINESS SCORE: {summary.get('readiness_score', 0)}%
MATCHED SKILLS: {json.dumps(matched_skills)}
PARTIAL SKILLS: {json.dumps(partial_skills)}
MISSING SKILLS: {json.dumps(missing_skills)}
LEARNING ROADMAP: {json.dumps(roadmap_titles)}

RESUME EXCERPT (first 2000 chars):
{resume_text[:2000]}

JOB DESCRIPTION EXCERPT (first 1500 chars):
{jd_text[:1500] if jd_text else 'No JD provided'}

Return JSON with this exact structure:
{{
  "strengths": ["strength 1 with specific skill references", "strength 2"],
  "improvement_areas": ["area 1 with actionable suggestion", "area 2"],
  "action_plan": "A 2-3 sentence prioritized action plan for the next 30 days",
  "overall_assessment": "A 2-3 sentence professional assessment of fit for this role",
  "resume_tips": ["specific tip 1 for resume improvement", "tip 2"],
  "interview_focus": ["topic 1 to prepare for interviews", "topic 2"]
}}"""

    raw = _call_groq(system, user, max_tokens=1024)
    if not raw:
        return _fallback_summary(matched_skills, missing_skills, partial_skills, summary)

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        result = json.loads(cleaned)
        # Ensure all keys exist
        for key in ["strengths", "improvement_areas", "action_plan", "overall_assessment", "resume_tips", "interview_focus"]:
            if key not in result:
                result[key] = [] if key != "action_plan" and key != "overall_assessment" else ""
        return result
    except (json.JSONDecodeError, KeyError):
        logger.warning("Failed to parse AI summary response")
        return _fallback_summary(matched_skills, missing_skills, partial_skills, summary)


def _fallback_summary(matched: list, missing: list, partial: list, summary: dict) -> dict:
    """Generate a basic summary without AI."""
    role = summary.get("role_display_name", "the target role")
    score = summary.get("readiness_score", 0)

    strengths = []
    if matched:
        strengths.append(f"Strong alignment in {', '.join(matched[:3])}")
    if score > 60:
        strengths.append(f"Overall readiness score of {score}% shows solid foundation")

    areas = []
    if missing:
        areas.append(f"Key gaps in {', '.join(missing[:3])} need attention")
    if partial:
        areas.append(f"Deepen expertise in {', '.join(partial[:3])}")

    return {
        "strengths": strengths or ["Profile shows relevant experience"],
        "improvement_areas": areas or ["Continue building technical depth"],
        "action_plan": f"Focus on closing the top skill gaps for {role} over the next 30 days through targeted learning.",
        "overall_assessment": f"Candidate shows {'strong' if score > 70 else 'moderate' if score > 40 else 'early-stage'} alignment with {role} requirements at {score}% readiness.",
        "resume_tips": ["Quantify achievements with metrics where possible", "Align skill keywords with job description language"],
        "interview_focus": missing[:3] if missing else ["General technical fundamentals"],
    }
