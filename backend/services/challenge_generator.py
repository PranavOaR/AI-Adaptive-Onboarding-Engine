"""AI-powered coding challenge content generator using Groq."""
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
logger = logging.getLogger("challenge-generator")

# In-memory cache so we don't regenerate the same challenge
_cache: dict[str, dict] = {}


def generate_challenge_content(challenge: dict) -> dict[str, Any]:
    """
    Generate full challenge content (examples, constraints, starter code, test cases)
    using Groq AI. Returns enhanced challenge dict.
    """
    cid = challenge.get("id", "")
    if cid in _cache:
        return _cache[cid]

    if not _client or not os.environ.get("GROQ_API_KEY", "").strip():
        result = _fallback_content(challenge)
        _cache[cid] = result
        return result

    challenge_type = challenge.get("challenge_type", "coding_dsa")
    title = challenge.get("title", "")
    description = challenge.get("description", "")
    difficulty = challenge.get("difficulty", "intermediate")
    skills = challenge.get("skills", [])

    system = (
        "You are an expert competitive programming problem setter and technical interviewer. "
        "Generate high-quality, well-structured coding challenge content. "
        "Return ONLY valid JSON, no markdown formatting or code fences."
    )

    if challenge_type in ("coding_dsa", "coding_framework"):
        user = f"""Generate complete coding challenge content for:

Title: {title}
Description: {description}
Difficulty: {difficulty}
Skills: {json.dumps(skills)}
Type: {challenge_type}

Return JSON with this EXACT structure:
{{
  "description": "A detailed problem statement (3-5 sentences). Include the problem context, what the function should do, and what it should return.",
  "examples": [
    {{
      "input": "nums = [2, 7, 11, 15], target = 9",
      "output": "[0, 1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }},
    {{
      "input": "nums = [3, 2, 4], target = 6",
      "output": "[1, 2]",
      "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."
    }}
  ],
  "constraints": [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "Only one valid answer exists"
  ],
  "starterCode": {{
    "python": "def solution(nums, target):\\n    # Your code here\\n    pass",
    "javascript": "function solution(nums, target) {{\\n  // Your code here\\n}}",
    "java": "class Solution {{\\n    public int[] solution(int[] nums, int target) {{\\n        // Your code here\\n        return new int[]{{}};\\n    }}\\n}}"
  }},
  "testCases": [
    {{
      "input": "2 7 11 15\\n9",
      "expectedOutput": "0 1"
    }},
    {{
      "input": "3 2 4\\n6",
      "expectedOutput": "1 2"
    }},
    {{
      "input": "3 3\\n6",
      "expectedOutput": "0 1"
    }}
  ],
  "tags": ["arrays", "hash-map"],
  "hints": [
    "Think about what data structure gives O(1) lookup",
    "Can you store complements as you iterate?"
  ]
}}

Make the problem realistic and well-structured. The starter code should include proper function signatures. Test case inputs should be formatted for stdin (one value per line or space-separated). Keep it appropriate for {difficulty} level."""

    elif challenge_type == "query_writing":
        user = f"""Generate complete SQL challenge content for:

Title: {title}
Description: {description}
Difficulty: {difficulty}
Skills: {json.dumps(skills)}

Return JSON with this EXACT structure:
{{
  "description": "A detailed problem statement explaining the database schema and what query to write.",
  "examples": [
    {{
      "input": "Table: daily_revenue\\n| date | revenue |\\n| 2024-01-01 | 1000 |",
      "output": "| date | rolling_avg |\\n| 2024-01-07 | 850.00 |",
      "explanation": "The 7-day rolling average for Jan 7 is the average of Jan 1-7 revenues."
    }}
  ],
  "constraints": [
    "Use window functions",
    "Round to 2 decimal places",
    "Handle edge cases for first 6 days"
  ],
  "starterCode": {{
    "python": "-- Write your SQL query below\\nSELECT ",
    "javascript": "-- Write your SQL query below\\nSELECT ",
    "java": "-- Write your SQL query below\\nSELECT "
  }},
  "testCases": [
    {{
      "input": "",
      "expectedOutput": ""
    }}
  ],
  "tags": ["sql", "window-functions"],
  "hints": [
    "Look into the OVER clause with ROWS BETWEEN",
    "AVG() can be used as a window function"
  ]
}}

Make it realistic for {difficulty} level."""
    else:
        result = _fallback_content(challenge)
        _cache[cid] = result
        return result

    try:
        resp = _client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=1500,
            temperature=0.4,
        )
        raw = resp.choices[0].message.content or ""

        # Strip markdown fences
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

        data = json.loads(cleaned)

        # Merge with original challenge data
        result = {**challenge, **data}
        _cache[cid] = result
        logger.info(f"[challenge-gen] Generated content for {cid}: {title}")
        return result

    except Exception as e:
        logger.warning(f"[challenge-gen] Groq generation failed for {cid}: {e}")
        result = _fallback_content(challenge)
        _cache[cid] = result
        return result


def _fallback_content(challenge: dict) -> dict[str, Any]:
    """Generate basic fallback content without AI."""
    title = challenge.get("title", "Challenge")
    desc = challenge.get("description", "")
    skills = challenge.get("skills", [])
    ctype = challenge.get("challenge_type", "coding_dsa")

    starter_python = "def solution():\n    # Write your solution here\n    pass"
    starter_js = "function solution() {\n  // Write your solution here\n}"
    starter_java = "class Solution {\n    public void solution() {\n        // Write your solution here\n    }\n}"

    if ctype == "query_writing":
        starter_python = "-- Write your SQL query below\nSELECT "
        starter_js = starter_python
        starter_java = starter_python

    return {
        **challenge,
        "description": desc,
        "examples": [
            {
                "input": "See problem description",
                "output": "Expected output",
                "explanation": "Follow the problem constraints to produce the correct output."
            }
        ],
        "constraints": [
            "Follow the problem description",
            f"Difficulty: {challenge.get('difficulty', 'intermediate')}",
            f"Time limit: {challenge.get('duration_minutes', 15)} minutes",
        ],
        "starterCode": {
            "python": starter_python,
            "javascript": starter_js,
            "java": starter_java,
        },
        "testCases": [],
        "tags": skills[:4],
        "hints": [f"Think about the core concept behind {title}"],
    }
