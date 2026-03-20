import asyncio
import json
from pathlib import Path

from services.jd_parser import parse_jd
from services.skill_extractor import extract_skills
from services.proficiency_estimator import estimate_level
from services.gap_analyzer import compute_gaps
from services.assessment_router import route_challenge
from services.roadmap_generator import generate_roadmap
from services.reasoning_service import build_trace
from main import detect_role

# Mock JD and Resume for Cybersecurity Intern

CYBER_JD = """
Job Title: Cybersecurity Intern
We are looking for a passionate intern to join our SOC team.
Responsibilities:
- Monitor security events and analyze logs
- Assist with vulnerability assessments
- Learn about incident response

Required Skills:
- Basic understanding of Networking and TCP/IP
- Familiarity with Linux command line
- Knowledge of Web Application Security and OWASP Top 10

Preferred Skills:
- Python scripting
- Understanding of Incident Response

Tools:
- SIEM (e.g., Splunk)
"""

CANDIDATE_RESUME = """
Jane Doe - Aspiring Security Professional

Education:
B.S. Computer Science (Graduating 2027)

Experience:
IT Helpdesk Intern
- Managed user accounts and resetting passwords.
- Basic troubleshooting of network issues (TCP/IP, DNS).
- Used Linux command line for basic server checks.

Projects:
- Personal Blog: Built a simple blog using Python and Flask.
- CTF Challenges: Participated in local hackathons, solving basic web security challenges.
  (Familiar with SQL injection and XSS from OWASP Top 10).

Skills:
Python, Linux, Networking, HTML/CSS
"""

async def run_smoke_test():
    print("=== RUNNING PIPELINE SMOKE TEST ===")

    # 1. Parse JD
    jd_parsed = parse_jd(CYBER_JD)
    print(f"JD Parsed Title: {jd_parsed.get('title')}")
    print(f"JD Sections Found: {[s['name'] for s in jd_parsed['sections']]}")

    # 2. Extract Skills
    jd_skills = extract_skills(CYBER_JD, "jd", jd_parsed["sections"])
    resume_skills = extract_skills(CANDIDATE_RESUME, "resume")
    print(f"\nExtracted JD Skills: {[s['skill'] for s in jd_skills]}")
    print(f"Extracted Resume Skills: {[s['skill'] for s in resume_skills]}")

    # Assertions
    assert "fastapi" not in [s["skill"] for s in jd_skills], "BUG: FastAPI should not be in a Cyber JD"
    assert "owasp_top_10" in [s["skill"] for s in jd_skills], "BUG: OWASP Top 10 should be extracted"
    assert "linux" in [s["skill"] for s in jd_skills], "BUG: Linux should be extracted"

    # 3. Detect Role
    role_id, role_template, role_confidence, top_candidates = detect_role(jd_parsed)
    print(f"\nDetected Role: {role_id} (Confidence: {role_confidence})")
    print(f"Top candidates: {[c['role_id'] for c in top_candidates]}")
    assert role_id == "cybersecurity_intern", f"BUG: Expected cybersecurity_intern, got {role_id}"

    # 4. Proficiency Estimation
    candidate_profile = []
    for s in resume_skills:
        est = estimate_level(s, CANDIDATE_RESUME)
        candidate_profile.append({**s, **est})

    # 5. Gap Analysis
    gaps = compute_gaps(candidate_profile, jd_skills, CYBER_JD, role_template, role_confidence)
    print("\nGaps:")
    for g in gaps:
        print(f"  - {g['skill']}: Req={g['required_level']} Cand={g['candidate_level']} Gap={g['gap']} Status={g['status']}")
        
    # Assertions
    missing_skills = [g["skill"] for g in gaps if g["status"] == "missing"]
    assert "siem" in missing_skills or "incident_response" in missing_skills, "BUG: Expected SIEM/IR as gaps"
    assert "fastapi" not in [g["skill"] for g in gaps], "BUG: FastAPI should never surface as a gap here"

    # 6. Assessment Routing
    for g in gaps:
        ch = route_challenge(g["skill"])
        if ch:
            g["challenge_id"] = ch["id"]
            g["challenge_type"] = ch["challenge_type"]
            
    # Check OWASP Top 10 challenge routing
    owasp_gap = next((g for g in gaps if g['skill'] == 'owasp_top_10'), None)
    if owasp_gap and "challenge_id" in owasp_gap:
        print(f"\nOWASP routed to: {owasp_gap['challenge_id']} ({owasp_gap['challenge_type']})")
        assert owasp_gap["challenge_id"] == "CH009", "BUG: OWASP should route to CH009"
        assert owasp_gap["challenge_type"] == "mcq_concept", "BUG: OWASP challenge should be MCQ"

    # 7. Roadmap Generation
    roadmap, _ = generate_roadmap(gaps, role_template)
    print("\nRoadmap (First 3):")
    for c in roadmap[:3]:
        print(f"  - [{c['phase']}] {c['title']} (Skills: {c['skills']})")

    # 8. Reasoning Traces
    jd_skill_map = {s["skill"]: s for s in jd_skills}
    resume_skill_map = {s["skill"]: s for s in candidate_profile}
    traces = [build_trace(c, gaps, jd_skill_map, resume_skill_map) for c in roadmap]
    print("\nReasoning Trace (First):")
    print(json.dumps(traces[0], indent=2))

    print("\n✅ SMOKE TEST PASSED!")

if __name__ == "__main__":
    asyncio.run(run_smoke_test())
