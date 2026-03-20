OWNERSHIP_VERBS = [
    "led", "built", "designed", "architected", "owned", "deployed",
    "developed", "implemented", "managed", "created", "engineered",
]
PROJECT_KEYWORDS = [
    "project", "production", "system", "platform", "pipeline",
    "application", "service", "api", "dashboard",
]
BASIC_VERBS = ["used", "worked with", "familiar", "exposure", "basic"]


def estimate_level(skill_data: dict, resume_text: str) -> int:
    count = skill_data["mention_count"]
    snippets = " ".join(skill_data["evidence_snippets"]).lower()

    if count == 0:
        return 0

    has_ownership = any(v in snippets for v in OWNERSHIP_VERBS)
    has_project = any(k in snippets for k in PROJECT_KEYWORDS)
    is_basic = any(v in snippets for v in BASIC_VERBS)

    if has_ownership and has_project:
        return 4
    if has_project and count >= 2:
        return 3
    if count >= 2 and not is_basic:
        return 2
    return 1
