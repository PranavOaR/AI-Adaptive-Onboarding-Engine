from pydantic import BaseModel
from typing import List, Optional, Literal, Dict, Any


class SkillMention(BaseModel):
    skill: str
    mention_count: int
    evidence_snippets: List[str]
    source: Literal["resume", "jd", "both"]
    weight: float = 0.4
    requirement_type: str = "general"
    category: str = ""
    domain_tags: List[str] = []
    challenge_type: str = "coding_dsa"


class SkillLevel(BaseModel):
    skill: str
    level: int
    confidence: float = 0.5
    evidence: List[str] = []
    evidence_sources: List[str] = []


class GapResult(BaseModel):
    skill: str
    candidate_level: int
    candidate_confidence: float = 0.5
    required_level: int
    gap: int
    status: Literal["matched", "partial", "missing", "irrelevant"]
    priority_score: float
    jd_importance: float
    requirement_type: str = "none"
    grounding_source_id: str = "resume"
    why_required: str = ""
    why_candidate_level: str = ""
    why_severity: str = ""
    resume_evidence: List[str] = []
    jd_evidence: List[str] = []
    challenge_id: Optional[str] = None
    challenge_type: Optional[str] = None


class RoleCandidate(BaseModel):
    role_id: str
    display_name: str
    confidence: float
    matched_skills: List[str]


class CourseRecommendation(BaseModel):
    id: Optional[str] = None
    course_id: Optional[str] = None
    title: str
    skills: Optional[List[str]] = None
    skills_addressed: Optional[List[str]] = None
    difficulty: str
    duration_hours: int
    phase: Literal["Foundation", "Core Role Skills", "Applied Practice", "Optional Stretch",
                   "Intermediate", "Role-Specific"]  # extras for backward compat
    prerequisites_needed: List[str] = []
    item_type: Literal["course", "assessment", "reading"] = "course"
    justification: str = ""


class ReasoningTrace(BaseModel):
    course_id: str
    skill_gap_trigger: str
    jd_evidence: List[str]
    resume_evidence: List[str]
    course_selection_reason: str
    ordering_reason: str
    phase_assignment_reason: str
    why_required: str = ""
    why_candidate_level: str = ""
    why_severity: str = ""
    assessment_reason: str = ""
    requirement_type: str = "none"
    candidate_confidence: float = 0.0


class AIInsights(BaseModel):
    strengths: List[str] = []
    improvement_areas: List[str] = []
    action_plan: str = ""
    overall_assessment: str = ""
    resume_tips: List[str] = []
    interview_focus: List[str] = []


class AnalysisSummary(BaseModel):
    total_skills_required: int
    matched_count: int
    partial_count: int
    missing_count: int
    readiness_score: float
    top_gaps: List[str]
    estimated_learning_hours: int
    detected_role: Optional[str] = None
    role_display_name: Optional[str] = None
    role_confidence: float = 0.0
    role_candidates: List[RoleCandidate] = []


class AnalysisResponse(BaseModel):
    candidate_profile: List[SkillLevel]
    required_profile: List[SkillLevel]
    gaps: List[GapResult]
    roadmap: List[CourseRecommendation]
    reasoning_trace: List[ReasoningTrace]
    summary: AnalysisSummary
    ai_insights: Optional[AIInsights] = None
