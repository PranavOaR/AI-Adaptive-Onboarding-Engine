"""PDF export service — generates a multi-page analysis report using ReportLab."""
from __future__ import annotations

import io
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# ── Colour palette (mirrors the dark-UI palette in hex) ───────────────────────
C_BG      = colors.HexColor("#111318")
C_SURFACE = colors.HexColor("#1A1D25")
C_BORDER  = colors.HexColor("#2E313A")
C_ACCENT  = colors.HexColor("#818CF8")
C_TEXT    = colors.HexColor("#F9FAFB")
C_MUTED   = colors.HexColor("#9CA3AF")
C_SUCCESS = colors.HexColor("#34D399")
C_WARNING = colors.HexColor("#FBBF24")
C_ERROR   = colors.HexColor("#F87171")
C_WHITE   = colors.white


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("title", parent=base["Normal"],
            fontSize=26, fontName="Helvetica-Bold", textColor=C_TEXT,
            spaceAfter=6, alignment=TA_LEFT),
        "subtitle": ParagraphStyle("subtitle", parent=base["Normal"],
            fontSize=11, fontName="Helvetica", textColor=C_MUTED,
            spaceAfter=4, alignment=TA_LEFT),
        "section": ParagraphStyle("section", parent=base["Normal"],
            fontSize=10, fontName="Helvetica-Bold", textColor=C_ACCENT,
            spaceBefore=14, spaceAfter=6, alignment=TA_LEFT),
        "body": ParagraphStyle("body", parent=base["Normal"],
            fontSize=9, fontName="Helvetica", textColor=C_MUTED,
            spaceAfter=3, leading=14, alignment=TA_LEFT),
        "bold": ParagraphStyle("bold", parent=base["Normal"],
            fontSize=9, fontName="Helvetica-Bold", textColor=C_TEXT,
            spaceAfter=2),
        "small": ParagraphStyle("small", parent=base["Normal"],
            fontSize=8, fontName="Helvetica", textColor=C_MUTED, spaceAfter=2),
        "badge_ok": ParagraphStyle("badge_ok", parent=base["Normal"],
            fontSize=8, fontName="Helvetica-Bold", textColor=C_SUCCESS, alignment=TA_CENTER),
        "badge_warn": ParagraphStyle("badge_warn", parent=base["Normal"],
            fontSize=8, fontName="Helvetica-Bold", textColor=C_WARNING, alignment=TA_CENTER),
        "badge_err": ParagraphStyle("badge_err", parent=base["Normal"],
            fontSize=8, fontName="Helvetica-Bold", textColor=C_ERROR, alignment=TA_CENTER),
    }


def generate_pdf(data: dict[str, Any]) -> bytes:
    """Generate analysis PDF and return raw bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2.2*cm, bottomMargin=2*cm,
    )

    S = _styles()
    story = []

    summary = data.get("summary", {})
    gaps = data.get("gaps", [])
    roadmap = data.get("roadmap", [])

    role = summary.get("role_display_name") or summary.get("detected_role") or "General Technical Role"
    readiness = summary.get("readiness_score", 0)
    matched = summary.get("matched_count", 0)
    partial = summary.get("partial_count", 0)
    missing = summary.get("missing_count", 0)

    # ── Cover ──────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("OnboardAI", ParagraphStyle("logo",
        fontSize=10, fontName="Helvetica-Bold", textColor=C_ACCENT)))
    story.append(Spacer(1, 0.8*cm))
    story.append(Paragraph("Skill Gap Analysis Report", S["title"]))
    story.append(Paragraph(f"Target role: {role}", S["subtitle"]))
    story.append(Spacer(1, 0.4*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=C_BORDER))
    story.append(Spacer(1, 0.6*cm))

    # Readiness score + counts
    ready_color = C_SUCCESS if readiness >= 70 else C_WARNING if readiness >= 40 else C_ERROR
    stat_data = [
        [
            Paragraph(f"{readiness:.0f}%", ParagraphStyle("big",
                fontSize=32, fontName="Helvetica-Bold", textColor=ready_color, alignment=TA_CENTER)),
            Paragraph(str(matched), ParagraphStyle("stat", fontSize=22,
                fontName="Helvetica-Bold", textColor=C_SUCCESS, alignment=TA_CENTER)),
            Paragraph(str(partial), ParagraphStyle("stat", fontSize=22,
                fontName="Helvetica-Bold", textColor=C_WARNING, alignment=TA_CENTER)),
            Paragraph(str(missing), ParagraphStyle("stat", fontSize=22,
                fontName="Helvetica-Bold", textColor=C_ERROR, alignment=TA_CENTER)),
        ],
        [
            Paragraph("Readiness", ParagraphStyle("lbl", fontSize=8, textColor=C_MUTED, alignment=TA_CENTER)),
            Paragraph("Matched", ParagraphStyle("lbl", fontSize=8, textColor=C_MUTED, alignment=TA_CENTER)),
            Paragraph("Partial", ParagraphStyle("lbl", fontSize=8, textColor=C_MUTED, alignment=TA_CENTER)),
            Paragraph("Missing", ParagraphStyle("lbl", fontSize=8, textColor=C_MUTED, alignment=TA_CENTER)),
        ],
    ]
    stat_table = Table(stat_data, colWidths=["25%","25%","25%","25%"])
    stat_table.setStyle(TableStyle([
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("BOX", (0,0), (-1,-1), 1, C_BORDER),
        ("INNERGRID", (0,0), (-1,-1), 0.5, C_BORDER),
        ("BACKGROUND", (0,0), (-1,-1), C_SURFACE),
        ("ROWPADDING", (0,0), (-1,-1), 8),
    ]))
    story.append(stat_table)
    story.append(Spacer(1, 0.8*cm))

    # ── Skill Gap Matrix ───────────────────────────────────────────────────────
    story.append(Paragraph("Skill Gap Analysis", S["section"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER))
    story.append(Spacer(1, 0.2*cm))

    if gaps:
        gap_header = ["Skill", "Your Level", "Required", "Gap", "Status", "Priority"]
        gap_rows = [gap_header]
        level_map = {0: "None", 1: "Beginner", 2: "Intermediate", 3: "Advanced", 4: "Expert"}
        for g in sorted(gaps, key=lambda x: -x.get("priority_score", 0)):
            status = g.get("status", "")
            style_key = "badge_ok" if status == "matched" else "badge_warn" if status == "partial" else "badge_err"
            gap_rows.append([
                Paragraph(g.get("skill","").replace("_"," "), S["small"]),
                Paragraph(level_map.get(g.get("candidate_level",0),"?"), S["small"]),
                Paragraph(level_map.get(g.get("required_level",0),"?"), S["small"]),
                Paragraph(str(g.get("gap",0)), S["small"]),
                Paragraph(status.upper(), S[style_key]),
                Paragraph(f"{g.get('priority_score',0):.2f}", S["small"]),
            ])
        gap_table = Table(gap_rows, colWidths=[5.5*cm, 2.8*cm, 2.8*cm, 1.5*cm, 2*cm, 2.5*cm])
        gap_table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), C_SURFACE),
            ("TEXTCOLOR", (0,0), (-1,0), C_ACCENT),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,0), 8),
            ("ALIGN", (0,0), (-1,-1), "LEFT"),
            ("ALIGN", (4,0), (5,-1), "CENTER"),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [C_BG, C_SURFACE]),
            ("GRID", (0,0), (-1,-1), 0.3, C_BORDER),
            ("ROWPADDING", (0,0), (-1,-1), 5),
        ]))
        story.append(gap_table)
    else:
        story.append(Paragraph("No gap data available.", S["body"]))

    story.append(Spacer(1, 0.8*cm))

    # ── Learning Roadmap ───────────────────────────────────────────────────────
    story.append(Paragraph("Personalised Learning Roadmap", S["section"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER))
    story.append(Spacer(1, 0.2*cm))

    phases = {}
    for c in roadmap:
        ph = c.get("phase","Other")
        phases.setdefault(ph, []).append(c)

    phase_order = ["Foundation", "Core Role Skills", "Applied Practice", "Optional Stretch"]
    for ph in phase_order:
        courses = phases.get(ph, [])
        if not courses:
            continue
        story.append(Paragraph(ph, ParagraphStyle("phase", fontSize=9,
            fontName="Helvetica-Bold", textColor=C_WARNING, spaceAfter=4, spaceBefore=8)))
        for c in courses:
            skills = c.get("skills") or c.get("skills_addressed") or []
            row = [
                Paragraph(c.get("title",""), S["bold"]),
                Paragraph(f"{c.get('duration_hours',0)}h · {c.get('difficulty','')}",
                    ParagraphStyle("r", fontSize=8, textColor=C_MUTED, alignment=TA_RIGHT)),
            ]
            t = Table([row], colWidths=["75%","25%"])
            t.setStyle(TableStyle([
                ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
                ("BACKGROUND",(0,0),(-1,-1),C_SURFACE),
                ("BOX",(0,0),(-1,-1),0.3,C_BORDER),
                ("LEFTPADDING",(0,0),(0,-1),6),
                ("ROWPADDING",(0,0),(-1,-1),5),
            ]))
            story.append(t)
            if skills:
                story.append(Paragraph("Skills: " + ", ".join(s.replace("_"," ") for s in skills[:6]),
                    ParagraphStyle("sk", fontSize=7.5, textColor=C_MUTED, spaceAfter=3, leftIndent=6)))
            if c.get("justification"):
                story.append(Paragraph(c["justification"][:180],
                    ParagraphStyle("just", fontSize=7.5, textColor=C_MUTED,
                        leftIndent=6, spaceAfter=4, leading=11)))

    story.append(Spacer(1, 0.6*cm))
    total_hours = sum(c.get("duration_hours", 0) for c in roadmap)
    story.append(Paragraph(f"Estimated total learning time: {total_hours} hours", S["body"]))

    # ── Footer note ────────────────────────────────────────────────────────────
    story.append(Spacer(1, cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "Generated by OnboardAI · Evidence-grounded skill gap analysis",
        ParagraphStyle("footer", fontSize=7.5, textColor=C_MUTED, alignment=TA_CENTER),
    ))

    doc.build(story)
    return buffer.getvalue()
