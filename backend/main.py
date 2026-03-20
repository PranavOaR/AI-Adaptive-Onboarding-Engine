import json
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from middleware.auth import verify_jwt

from services import (
    parser_service,
    skill_extractor,
    proficiency_estimator,
    gap_analyzer,
    roadmap_generator,
    reasoning_service,
)
from models import AnalysisResponse

app = FastAPI(title="AI Onboarding Engine")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / "data"
ROLE_TEMPLATES = json.loads((DATA_DIR / "role_templates.json").read_text())


def detect_role(jd_text: str) -> tuple[str, dict]:
    jd_lower = jd_text.lower()
    for role, skills in ROLE_TEMPLATES.items():
        if role.lower() in jd_lower:
            return role, skills
    # Fallback: return role with most keyword matches
    best, best_score = "backend engineer", 0
    for role, skills in ROLE_TEMPLATES.items():
        score = sum(1 for s in skills if s.replace("_", " ") in jd_lower)
        if score > best_score:
            best, best_score = role, score
    return best, ROLE_TEMPLATES[best]


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    resume_file: UploadFile = File(...),
    jd_file: UploadFile = File(None),
    jd_text: str = Form(""),
    _user=Depends(verify_jwt),
):
    # 1. Parse
    resume_text = parser_service.extract_text(
        await resume_file.read(), resume_file.filename
    )
    if jd_text:
        jd_raw = jd_text
    elif jd_file:
        jd_raw = parser_service.extract_text(
            await jd_file.read(), jd_file.filename
        )
    else:
        jd_raw = ""

    # 2. Extract skills
    resume_skills_raw = skill_extractor.extract_skills(resume_text, "resume")
    jd_skills_raw = skill_extractor.extract_skills(jd_raw, "jd")

    resume_map = {s["skill"]: s for s in resume_skills_raw}
    jd_map = {s["skill"]: s for s in jd_skills_raw}

    # 3. Estimate proficiency
    candidate_profile = [
        {
            "skill": s["skill"],
            "level": proficiency_estimator.estimate_level(s, resume_text),
            "evidence": s["evidence_snippets"],
        }
        for s in resume_skills_raw
    ]
    candidate_levels = {c["skill"]: c["level"] for c in candidate_profile}

    # 4. Detect role + required profile
    detected_role, required_levels = detect_role(jd_raw)
    # Supplement with JD-extracted skills at level 2 if not in template
    for s in jd_skills_raw:
        if s["skill"] not in required_levels:
            required_levels[s["skill"]] = 2

    required_profile = [
        {
            "skill": k,
            "level": v,
            "evidence": jd_map.get(k, {}).get("evidence_snippets", []),
        }
        for k, v in required_levels.items()
    ]

    # 5. Gap analysis
    gaps = gap_analyzer.compute_gaps(candidate_levels, required_levels, jd_raw)

    # 6. Roadmap generation
    roadmap, _ = roadmap_generator.generate_roadmap(gaps)

    # 7. Reasoning traces
    traces = [
        reasoning_service.build_trace(c, gaps, jd_map, resume_map) for c in roadmap
    ]

    # 8. Summary
    matched = sum(1 for g in gaps if g["status"] == "matched")
    partial = sum(1 for g in gaps if g["status"] == "partial")
    missing = sum(1 for g in gaps if g["status"] == "missing")

    readiness_raw = sum(
        (g["candidate_level"] / g["required_level"]) * g["jd_importance"]
        for g in gaps
        if g["required_level"] > 0
    )
    readiness_score = round((readiness_raw / max(len(gaps), 1)) * 100, 1)

    return AnalysisResponse(
        candidate_profile=candidate_profile,
        required_profile=required_profile,
        gaps=gaps,
        roadmap=roadmap,
        reasoning_trace=traces,
        summary={
            "total_skills_required": len(gaps),
            "matched_count": matched,
            "partial_count": partial,
            "missing_count": missing,
            "readiness_score": readiness_score,
            "top_gaps": [g["skill"] for g in gaps if g["status"] == "missing"][:3],
            "estimated_learning_hours": sum(c["duration_hours"] for c in roadmap),
            "detected_role": detected_role,
        },
    )
