"""Interview preparation question generator."""
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).parent.parent / "data"
_TEMPLATES: dict | None = None


def _load() -> dict:
    global _TEMPLATES
    if _TEMPLATES is None:
        _TEMPLATES = json.loads((DATA_DIR / "interview_templates.json").read_text(encoding="utf-8"))
    return _TEMPLATES


def generate_questions(role: str | None, gaps: list[dict[str, Any]]) -> dict[str, list[dict]]:
    """
    Return categorised interview questions based on role and top skill gaps.

    Returns:
        {
          "technical": [{"question": "...", "hint": "..."}],
          "behavioral": [...],
          "scenario": [...],
          "role_specific": [...],
        }
    """
    templates = _load()
    defaults = templates.get("default", {})
    skill_qs = templates.get("skill_questions", {})
    role_qs = templates.get("role_questions", {})

    # Collect gap-specific questions for top 4 missing/partial skills
    top_skills = [
        g["skill"] for g in
        sorted(gaps, key=lambda x: -x.get("priority_score", 0))
        if g.get("status") in ("missing", "partial")
    ][:4]

    technical_pool: list[str] = list(defaults.get("technical", []))
    for skill in top_skills:
        # normalise: replace spaces/dashes with underscore, lower
        norm = skill.lower().replace(" ", "_").replace("-", "_")
        technical_pool.extend(skill_qs.get(norm, []))

    # Role-specific
    role_specific_raw: list[str] = []
    if role:
        norm_role = role.lower().replace(" ", "_")
        for key in role_qs:
            if key in norm_role or norm_role in key:
                role_specific_raw.extend(role_qs[key])
                break

    def _format(q_list: list[str], max_n: int = 5) -> list[dict]:
        seen, result = set(), []
        for q in q_list:
            if q not in seen and len(result) < max_n:
                seen.add(q)
                result.append({"question": q, "hint": _generate_hint(q)})
        return result

    return {
        "technical": _format(technical_pool, 6),
        "behavioral": _format(defaults.get("behavioral", []), 4),
        "scenario": _format(defaults.get("scenario", []), 3),
        "role_specific": _format(role_specific_raw, 4),
    }


def _generate_hint(question: str) -> str:
    """Generate a lightweight hint for a question using keyword matching."""
    q = question.lower()
    hints = {
        "bias-variance": "Think about underfitting vs overfitting. Bias = systematic error; Variance = sensitivity to training data.",
        "gil": "The GIL prevents true parallel thread execution in CPython. Use multiprocessing or async for CPU/IO-bound tasks.",
        "acid": "Atomicity, Consistency, Isolation, Durability. Each property ensures reliable transaction processing.",
        "cap theorem": "You can only guarantee 2 of 3: Consistency, Availability, Partition Tolerance. Most distributed systems choose AP or CP.",
        "index": "Indexes speed up reads at the cost of write performance and storage. Use on high-cardinality, frequently-queried columns.",
        "reconciliation": "React compares the virtual DOM tree with the previous one (diffing) and batches minimal DOM updates.",
        "regularization": "L1 (Lasso) produces sparse weights; L2 (Ridge) penalises large weights without zeroing them.",
        "generator": "Generators yield values lazily, saving memory. They're iterable but can only be traversed once.",
        "decorator": "A decorator is a function that takes a function and returns a new function, adding behaviour without modifying the original.",
        "class imbalance": "Strategies: oversampling (SMOTE), undersampling, class weights, or threshold tuning at inference.",
        "heap": "A heap is a complete binary tree satisfying the heap property. Use for priority queues and kth-element problems.",
    }
    for keyword, hint in hints.items():
        if keyword in q:
            return hint
    return "Think about trade-offs, real-world examples, and edge cases before answering."
