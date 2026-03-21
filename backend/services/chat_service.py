"""AI chat service powered by Groq."""
from __future__ import annotations

import os
import json
from typing import Generator, Any

try:
    from groq import Groq
    _client: Groq | None = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
except Exception:
    _client = None

MODEL = "llama-3.3-70b-versatile"


def _build_system_prompt(analysis_context: dict[str, Any] | None) -> str:
    base = (
        "You are OnboardAI's career assistant. You help users understand their skill gaps, "
        "learning roadmap, and interview preparation. Be concise, specific, and actionable. "
        "When referencing skills or courses, use the user's actual data. "
        "Keep responses under 250 words unless asked for more detail."
    )

    if not analysis_context:
        return base

    summary = analysis_context.get("summary", {})
    role = summary.get("role_display_name") or summary.get("detected_role") or "General"
    readiness = summary.get("readiness_score", 0)
    top_gaps = summary.get("top_gaps", [])
    roadmap = analysis_context.get("roadmap", [])
    course_titles = [c.get("title", "") for c in roadmap[:6]]

    ctx = (
        f"\n\nUser's analysis context:\n"
        f"- Target role: {role}\n"
        f"- Readiness score: {readiness:.0f}%\n"
        f"- Top skill gaps: {', '.join(top_gaps) if top_gaps else 'None identified'}\n"
        f"- Roadmap highlights: {', '.join(course_titles) if course_titles else 'No roadmap'}\n"
        f"\nAnswer questions specifically about this user's situation."
    )
    return base + ctx


def stream_chat(
    message: str,
    history: list[dict[str, str]],
    analysis_context: dict[str, Any] | None = None,
) -> Generator[str, None, None]:
    """
    Stream chat completion from Groq.
    Yields text chunks as they arrive.
    Falls back to a static error message if Groq is unavailable.
    """
    if not _client:
        yield "⚠️ AI chat is not configured. Please add GROQ_API_KEY to backend/.env and restart the server."
        return

    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key or api_key.strip() == "":
        yield "⚠️ GROQ_API_KEY is not set. Add it to backend/.env and restart the server."
        return

    # Build message list
    messages = [{"role": "system", "content": _build_system_prompt(analysis_context)}]
    for h in history[-10:]:  # last 10 turns for context window management
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    try:
        stream = _client.chat.completions.create(
            model=MODEL,
            messages=messages,
            stream=True,
            max_tokens=512,
            temperature=0.7,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
    except Exception as e:
        yield f"⚠️ Chat error: {str(e)[:120]}"
