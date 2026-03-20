import json
import logging
import re
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from middleware.auth import verify_jwt
from services import (
    parser_service,
    skill_extractor,
    proficiency_estimator,
    gap_analyzer,
    roadmap_generator,
    reasoning_service,
    assessment_router,
)
from services.jd_parser import parse_jd
from models import (
    AnalysisResponse, AnalysisSummary, SkillLevel,
    GapResult, CourseRecommendation, ReasoningTrace, RoleCandidate
)

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("onboarding-engine")

# ─── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="AI Onboarding Engine", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Data loading ─────────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent / "data"
ROLE_TEMPLATES: dict = json.loads((DATA_DIR / "role_templates.json").read_text(encoding="utf-8"))
TAXONOMY: dict = json.loads((DATA_DIR / "taxonomy.json").read_text(encoding="utf-8"))

# ─── Constants ────────────────────────────────────────────────────────────────
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


# ─── Rate limiting (simple in-memory) ─────────────────────────────────────────
from collections import defaultdict
import time as _time

_request_counts: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60   # seconds
RATE_LIMIT_MAX = 10       # requests per window per IP


def _check_rate_limit(ip: str):
    now = _time.time()
    window_start = now - RATE_LIMIT_WINDOW
    _request_counts[ip] = [t for t in _request_counts[ip] if t > window_start]
    if len(_request_counts[ip]) >= RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait before trying again."
        )
    _request_counts[ip].append(now)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _validate_upload(file: UploadFile, content: bytes, label: str):
    """Validate file size and extension."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"{label}: unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"{label}: file too large (max 5 MB)."
        )


def detect_role(jd_parsed: dict) -> tuple[str, dict, float, list[dict]]:
    """
    Detect the most likely role from the parsed JD.

    Uses a cluster matching approach:
      - Extract all skills from the JD
      - Compare with each role template's required + preferred skills
      - Score = intersection / union (Jaccard-like)
      - Bonus for title keyword match

    Returns:
        (role_id, role_template, confidence, top_3_candidates)
    """
    jd_text = jd_parsed["full_text"]
    jd_title = jd_parsed.get("title", "").lower()

    # Extract JD skills without section weighting for broad detection
    jd_skills_flat = skill_extractor.extract_skills(jd_text, "jd")
    jd_skill_ids = {s["skill"] for s in jd_skills_flat}

    candidates: list[dict] = []

    for role_id, template in ROLE_TEMPLATES.items():
        required = set(template.get("required_skills", {}).keys())
        preferred = set(template.get("preferred_skills", {}).keys())
        optional = set(template.get("optional_skills", {}).keys())
        all_template_skills = required | preferred

        if not all_template_skills:
            continue

        # Jaccard similarity: intersection / union
        intersection = jd_skill_ids & all_template_skills
        union = jd_skill_ids | all_template_skills
        jaccard = len(intersection) / len(union) if union else 0.0

        # Required skills precision: % of template's required skills found in JD
        required_precision = len(jd_skill_ids & required) / len(required) if required else 0.0

        # Title keyword bonus
        title_bonus = 0.0
        for kw in template.get("title_keywords", []):
            if kw.lower() in jd_title:
                title_bonus = 0.25
                break

        # Domain tag match
        jd_domains = {tag for s in jd_skills_flat for tag in s.get("domain_tags", [])}
        template_domains = set(template.get("domain_tags", []))
        domain_overlap = len(jd_domains & template_domains) / max(len(template_domains), 1)

        confidence = round(
            jaccard * 0.3 +
            required_precision * 0.35 +
            title_bonus +
            domain_overlap * 0.1,
            3
        )

        candidates.append({
            "role_id": role_id,
            "display_name": template.get("display_name", role_id),
            "confidence": confidence,
            "matched_skills": list(intersection),
        })

    candidates.sort(key=lambda c: -c["confidence"])
    top_3 = candidates[:3]

    if not candidates or candidates[0]["confidence"] < 0.15:
        # Fallback: generic role
        fallback = {
            "role_id": "general_technical",
            "display_name": "General Technical Role",
            "confidence": 0.1,
            "matched_skills": [],
        }
        return "general_technical", {}, 0.1, [fallback]

    best = candidates[0]
    return (
        best["role_id"],
        ROLE_TEMPLATES[best["role_id"]],
        best["confidence"],
        top_3,
    )


# ─── Main endpoint ─────────────────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    request: Request,
    resume_file: UploadFile = File(...),
    jd_file: UploadFile = File(None),
    jd_text: str = Form(""),
    _user=Depends(verify_jwt),
):
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)

    logger.info(f"[analyze] Request from {client_ip}, resume={resume_file.filename}")

    # ── 1. Read and validate uploads ──────────────────────────────────────
    resume_bytes = await resume_file.read()
    _validate_upload(resume_file, resume_bytes, "Resume")

    jd_raw = ""
    if jd_text.strip():
        jd_raw = jd_text.strip()
    elif jd_file and jd_file.filename:
        jd_bytes = await jd_file.read()
        _validate_upload(jd_file, jd_bytes, "Job Description")
        jd_raw = parser_service.extract_text(jd_bytes, jd_file.filename)

    # ── 2. Parse documents ─────────────────────────────────────────────────
    try:
        resume_text = parser_service.extract_text(resume_bytes, resume_file.filename)
    except Exception as e:
        logger.error(f"[analyze] Resume parse error: {e}")
        raise HTTPException(status_code=422, detail=f"Could not parse resume: {str(e)}")

    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="Resume appears to be empty or unreadable.")

    # ── 3. Parse JD into sections ──────────────────────────────────────────
    jd_parsed = parse_jd(jd_raw) if jd_raw else {"title": "", "sections": [], "full_text": ""}

    # ── 4. Extract skills ──────────────────────────────────────────────────
    resume_skills_raw = skill_extractor.extract_skills(resume_text, "resume")
    jd_skills_raw = skill_extractor.extract_skills(
        jd_raw, "jd", sections=jd_parsed.get("sections")
    ) if jd_raw else []

    # ── 5. Detect role ─────────────────────────────────────────────────────
    detected_role_id, role_template, role_confidence, role_candidates = detect_role(jd_parsed)
    logger.info(f"[analyze] Detected role: {detected_role_id} (confidence={role_confidence:.2f})")

    # ── 6. Estimate proficiency from resume ────────────────────────────────
    candidate_profile: list[dict] = []
    resume_skill_map: dict[str, dict] = {}

    for s in resume_skills_raw:
        result = proficiency_estimator.estimate_level(s, resume_text)
        entry = {
            "skill": s["skill"],
            "level": result["level"],
            "confidence": result["confidence"],
            "evidence": result["evidence_snippets"],
            "evidence_sources": result["evidence_sources"],
        }
        candidate_profile.append(entry)
        resume_skill_map[s["skill"]] = {**s, **result}

    candidate_levels = {c["skill"]: c["level"] for c in candidate_profile}

    # ── 7. Build required profile from JD skills ───────────────────────────
    jd_skill_map: dict[str, dict] = {s["skill"]: s for s in jd_skills_raw}

    required_profile = [
        {
            "skill": s["skill"],
            "level": max(1, round(s.get("weight", 0.4) * 3)),
            "confidence": 1.0,
            "evidence": s.get("evidence_snippets", []),
            "evidence_sources": ["jd"],
        }
        for s in jd_skills_raw
    ]

    # ── 8. Gap analysis ────────────────────────────────────────────────────
    # Build per-skill dict with level+confidence for gap_analyzer
    candidate_profiles_for_gap = candidate_profile

    gaps = gap_analyzer.compute_gaps(
        candidate_profiles=candidate_profiles_for_gap,
        jd_skills=jd_skills_raw,
        jd_text=jd_raw,
        role_template=role_template,
        role_confidence=role_confidence,
    )

    # ── 9. Route challenges to gaps ────────────────────────────────────────
    for gap in gaps:
        skill = gap["skill"]
        category = TAXONOMY.get(skill, {}).get("category", "")
        challenge = assessment_router.route_challenge(skill, category)
        if challenge:
            gap["challenge_id"] = challenge["id"]
            gap["challenge_type"] = challenge.get("challenge_type", "coding_dsa")

    # ── 10. Generate roadmap ───────────────────────────────────────────────
    roadmap, _ = roadmap_generator.generate_roadmap(gaps, role_template=role_template)

    # ── 11. Build reasoning traces ─────────────────────────────────────────
    traces = [
        reasoning_service.build_trace(course, gaps, jd_skill_map, resume_skill_map)
        for course in roadmap
    ]

    # ── 12. Compute summary ────────────────────────────────────────────────
    matched = sum(1 for g in gaps if g["status"] == "matched")
    partial = sum(1 for g in gaps if g["status"] == "partial")
    missing = sum(1 for g in gaps if g["status"] == "missing")

    total_required = max(len(gaps), 1)
    readiness_raw = sum(
        (g["candidate_level"] / g["required_level"]) * g["jd_importance"]
        for g in gaps
        if g["required_level"] > 0
    )
    readiness_score = round((readiness_raw / total_required) * 100, 1)
    readiness_score = min(max(readiness_score, 0.0), 100.0)

    top_gaps = [g["skill"] for g in gaps if g["status"] == "missing"][:3]
    total_hours = sum(c.get("duration_hours", 0) for c in roadmap)

    role_display = role_template.get("display_name", detected_role_id) if role_template else "General Technical Role"

    summary = {
        "total_skills_required": len(gaps),
        "matched_count": matched,
        "partial_count": partial,
        "missing_count": missing,
        "readiness_score": readiness_score,
        "top_gaps": top_gaps,
        "estimated_learning_hours": total_hours,
        "detected_role": detected_role_id,
        "role_display_name": role_display,
        "role_confidence": round(role_confidence, 2),
        "role_candidates": role_candidates,
    }

    logger.info(
        f"[analyze] Done. Role={detected_role_id}, confidence={role_confidence:.2f}, "
        f"gaps={missing} missing / {partial} partial / {matched} matched, "
        f"readiness={readiness_score}%"
    )

    return AnalysisResponse(
        candidate_profile=[SkillLevel(**c) for c in candidate_profile],
        required_profile=[SkillLevel(**r) for r in required_profile],
        gaps=[GapResult(**g) for g in gaps],
        roadmap=[CourseRecommendation(**c) for c in roadmap],
        reasoning_trace=[ReasoningTrace(**t) for t in traces],
        summary=AnalysisSummary(**summary),
    )


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
