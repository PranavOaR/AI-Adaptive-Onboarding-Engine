"""
jd_parser.py — JD Section Parser for AI Onboarding Engine

Parses job description text into weighted sections:
  - title (detected from first line or explicit patterns)
  - required_skills
  - preferred_skills
  - nice_to_have
  - qualifications
  - responsibilities
  - tools_platforms

Skills extracted from higher-weight sections (required) carry more importance
than those from preferred/nice-to-have sections.
"""

import re
from pathlib import Path


# Section header patterns (regex) → section name → weight
SECTION_PATTERNS: list[tuple[re.Pattern, str, float]] = [
    (re.compile(
        r'(?:requirements?|required skills?|must have|mandatory|you (must|will) have|'
        r'what we(?:\'re| are) looking for|minimum qualifications?|essential skills?)',
        re.IGNORECASE
    ), 'required', 1.0),

    (re.compile(
        r'(?:preferred|preferred qualifications?|strong plus|desirable|'
        r'we(?:\'d| would) love|nice[- ]to[- ]have|bonus|plus if you have)',
        re.IGNORECASE
    ), 'preferred', 0.6),

    (re.compile(
        r'(?:qualifications?|education|degree|academic|bachelor|master|'
        r'diploma|gpa|grade)',
        re.IGNORECASE
    ), 'qualifications', 0.7),

    (re.compile(
        r'(?:responsibilities|what you(?:\'ll| will) do|your role|day[- ]to[- ]day|'
        r'key responsibilities|what you(?:\'ll| will) be doing|duties)',
        re.IGNORECASE
    ), 'responsibilities', 0.5),

    (re.compile(
        r'(?:tools?|platforms?|technologies|tech stack|tools? and technologies|'
        r'software|environment)',
        re.IGNORECASE
    ), 'tools', 0.7),
]


def _split_into_sections(text: str) -> list[tuple[str, str, float]]:
    """
    Split JD text into (section_name, content, weight) tuples.
    Lines before any recognized header are treated as 'general' (weight 0.4).
    """
    lines = text.splitlines()
    sections: list[tuple[str, str, float]] = []
    current_name = 'general'
    current_weight = 0.4
    current_lines: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            current_lines.append('')
            continue

        # Detect section headers: short lines that match a known pattern
        matched_section = None
        if len(stripped) < 80:  # headers are short
            for pattern, sname, weight in SECTION_PATTERNS:
                if pattern.search(stripped):
                    matched_section = (sname, weight)
                    break

        if matched_section:
            # Save current section
            if current_lines:
                sections.append((current_name, '\n'.join(current_lines), current_weight))
            current_name, current_weight = matched_section
            current_lines = []
        else:
            current_lines.append(stripped)

    if current_lines:
        sections.append((current_name, '\n'.join(current_lines), current_weight))

    return sections


def _extract_title(text: str) -> str:
    """
    Try to extract job title from first non-empty line or title-like patterns.
    """
    title_patterns = [
        r'(?:position|role|job title)[:\-\s]+([^\n]{3,60})',
        r'^([A-Z][A-Za-z\s,/\-]{5,60})(?:\n|$)',
    ]
    for pattern in title_patterns:
        m = re.search(pattern, text, re.MULTILINE)
        if m:
            return m.group(1).strip()

    # Fallback: first non-empty line
    for line in text.splitlines():
        stripped = line.strip()
        if stripped and len(stripped) >= 5:
            return stripped[:80]
    return ''


def parse_jd(jd_text: str) -> dict:
    """
    Parse a job description into structured sections.

    Returns:
        {
          'title': str,
          'sections': [{'name': str, 'content': str, 'weight': float}],
          'full_text': str,
        }
    """
    title = _extract_title(jd_text)
    raw_sections = _split_into_sections(jd_text)

    sections = [
        {'name': name, 'content': content, 'weight': weight}
        for name, content, weight in raw_sections
        if content.strip()
    ]

    return {
        'title': title,
        'sections': sections,
        'full_text': jd_text,
    }
