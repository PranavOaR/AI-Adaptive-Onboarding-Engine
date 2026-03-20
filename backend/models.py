from pydantic import BaseModel
from typing import List, Optional, Literal


class SkillMention(BaseModel):
    skill: str
    mention_count: int
    evidence_snippets: List[str]
    source: Literal["resume", "jd", "both"]


class SkillLevel(BaseModel):
    skill: str
    level: int
    evidence: List[str]


class GapResult(BaseModel):
    skill: str
    candidate_level: int
    required_level: int
    gap: int
    status: Literal["matched", "partial", "missing"]
    priority_score: float
    jd_importance: float


class CourseRecommendation(BaseModel):
    course_id: Optional[str] = None
    id: Optional[str] = None
    title: str
    skills_addressed: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    difficulty: str
    duration_hours: int
    phase: Literal["Foundation", "Intermediate", "Role-Specific"]
    prerequisites_needed: List[str]


class ReasoningTrace(BaseModel):
    course_id: str
    skill_gap_trigger: str
    jd_evidence: List[str]
    resume_evidence: List[str]
    course_selection_reason: str
    ordering_reason: str
    phase_assignment_reason: str


class AnalysisSummary(BaseModel):
    total_skills_required: int
    matched_count: int
    partial_count: int
    missing_count: int
    readiness_score: float
    top_gaps: List[str]
    estimated_learning_hours: int
    detected_role: Optional[str]


class AnalysisResponse(BaseModel):
    candidate_profile: List[SkillLevel]
    required_profile: List[SkillLevel]
    gaps: List[GapResult]
    roadmap: List[CourseRecommendation]
    reasoning_trace: List[ReasoningTrace]
    summary: AnalysisSummary
