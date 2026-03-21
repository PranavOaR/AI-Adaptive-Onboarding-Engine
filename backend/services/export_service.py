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

# ── Colour palette (Light Theme Corporate) ──────────────────────────────────
C_BG      = colors.white
C_SURFACE = colors.HexColor("#F8FAFC")
C_BORDER  = colors.HexColor("#E2E8F0")
C_PRIMARY = colors.HexColor("#0F172A")
C_ACCENT  = colors.HexColor("#4338CA")
C_TEXT    = colors.HexColor("#334155")
C_MUTED   = colors.HexColor("#64748B")
C_SUCCESS = colors.HexColor("#059669")
C_WARNING = colors.HexColor("#D97706")
C_ERROR   = colors.HexColor("#DC2626")
C_WHITE   = colors.white

def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("title", parent=base["Normal"],
            fontSize=24, leading=30, fontName="Helvetica-Bold", textColor=C_PRIMARY,
            spaceAfter=12, alignment=TA_LEFT),
        "subtitle": ParagraphStyle("subtitle", parent=base["Normal"],
            fontSize=12, leading=16, fontName="Helvetica", textColor=C_MUTED,
            spaceAfter=12, alignment=TA_LEFT),
        "section": ParagraphStyle("section", parent=base["Normal"],
            fontSize=14, leading=18, fontName="Helvetica-Bold", textColor=C_ACCENT,
            spaceBefore=16, spaceAfter=8, alignment=TA_LEFT),
        "body": ParagraphStyle("body", parent=base["Normal"],
            fontSize=10, fontName="Helvetica", textColor=C_TEXT,
            spaceAfter=4, leading=14, alignment=TA_LEFT),
        "bold": ParagraphStyle("bold", parent=base["Normal"],
            fontSize=10, fontName="Helvetica-Bold", textColor=C_PRIMARY,
            spaceAfter=2),
        "small": ParagraphStyle("small", parent=base["Normal"],
            fontSize=9, fontName="Helvetica", textColor=C_TEXT, spaceAfter=2),
        "badge_ok": ParagraphStyle("badge_ok", parent=base["Normal"],
            fontSize=8, fontName="Helvetica-Bold", textColor=C_SUCCESS, alignment=TA_CENTER),
        "badge_warn": ParagraphStyle("badge_warn", parent=base["Normal"],
            fontSize=8, fontName="Helvetica-Bold", textColor=C_WARNING, alignment=TA_CENTER),
        "badge_err": ParagraphStyle("badge_err", parent=base["Normal"],
            fontSize=8, fontName="Helvetica-Bold", textColor=C_ERROR, alignment=TA_CENTER),
        "logo": ParagraphStyle("logo", parent=base["Normal"],
            fontSize=12, leading=16, fontName="Helvetica-Bold", textColor=C_ACCENT, alignment=TA_LEFT),
        "phase": ParagraphStyle("phase", parent=base["Normal"], 
            fontSize=11, leading=15, fontName="Helvetica-Bold", textColor=C_PRIMARY, spaceAfter=6, spaceBefore=10),
        "lbl": ParagraphStyle("lbl", parent=base["Normal"], fontSize=9, leading=12, fontName="Helvetica", textColor=C_MUTED, alignment=TA_CENTER),
        "stat": ParagraphStyle("stat", parent=base["Normal"], fontSize=22, leading=28, fontName="Helvetica-Bold", alignment=TA_CENTER),
        "big": ParagraphStyle("big", parent=base["Normal"], fontSize=32, leading=38, fontName="Helvetica-Bold", alignment=TA_CENTER),
        "r": ParagraphStyle("r", parent=base["Normal"], fontSize=9, textColor=C_MUTED, alignment=TA_RIGHT),
        "sk": ParagraphStyle("sk", parent=base["Normal"], fontSize=8, textColor=C_MUTED, spaceAfter=4, leftIndent=6),
        "just": ParagraphStyle("just", parent=base["Normal"], fontSize=8, textColor=C_MUTED, leftIndent=6, spaceAfter=6, leading=12),
        "footer": ParagraphStyle("footer", parent=base["Normal"], fontSize=8, textColor=C_MUTED, alignment=TA_CENTER),
    }

def generate_pdf(data: dict[str, Any]) -> bytes:
    """Generate analysis PDF and return raw bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
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
    story.append(Paragraph("AI Adaptive Onboarding Engine", S["logo"]))
    story.append(Spacer(1, 0.8*cm))
    story.append(Paragraph("Skill Gap Analysis Report", S["title"]))
    story.append(Paragraph(f"Target role: {role}", S["subtitle"]))
    story.append(Spacer(1, 0.4*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=C_BORDER))
    story.append(Spacer(1, 0.6*cm))

    # Readiness score + counts
    ready_color = C_SUCCESS if readiness >= 70 else C_WARNING if readiness >= 40 else C_ERROR
    stat_style_success = ParagraphStyle("stat_succ", parent=S["stat"], textColor=C_SUCCESS)
    stat_style_warn = ParagraphStyle("stat_warn", parent=S["stat"], textColor=C_WARNING)
    stat_style_err = ParagraphStyle("stat_err", parent=S["stat"], textColor=C_ERROR)
    stat_style_main = ParagraphStyle("stat_main", parent=S["big"], textColor=ready_color)

    stat_data = [
        [
            Paragraph(f"{readiness:.0f}%", stat_style_main),
            Paragraph(str(matched), stat_style_success),
            Paragraph(str(partial), stat_style_warn),
            Paragraph(str(missing), stat_style_err),
        ],
        [
            Paragraph("Readiness", S["lbl"]),
            Paragraph("Matched", S["lbl"]),
            Paragraph("Partial", S["lbl"]),
            Paragraph("Missing", S["lbl"]),
        ],
    ]
    stat_table = Table(stat_data, colWidths=["25%","25%","25%","25%"])
    stat_table.setStyle(TableStyle([
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("BOX", (0,0), (-1,-1), 1, C_BORDER),
        ("INNERGRID", (0,0), (-1,-1), 0.5, C_BORDER),
        ("BACKGROUND", (0,0), (-1,-1), C_SURFACE),
        ("ROWPADDING", (0,0), (-1,-1), 10),
    ]))
    story.append(stat_table)
    story.append(Spacer(1, 1*cm))

    # ── Skill Gap Matrix ───────────────────────────────────────────────────────
    story.append(Paragraph("Skill Gap Matrix", S["section"]))
    story.append(HRFlowable(width="100%", thickness=1, color=C_BORDER))
    story.append(Spacer(1, 0.4*cm))

    if gaps:
        gap_header = ["Skill", "Your Level", "Required", "Gap", "Status", "Priority"]
        gap_rows = [[Paragraph(h, ParagraphStyle("th", parent=S["small"], textColor=C_PRIMARY, fontName="Helvetica-Bold")) for h in gap_header]]
        level_map = {0: "None", 1: "Beginner", 2: "Intermediate", 3: "Advanced", 4: "Expert"}
        for i, g in enumerate(sorted(gaps, key=lambda x: -x.get("priority_score", 0))):
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
        gap_table = Table(gap_rows, colWidths=[5.5*cm, 2.5*cm, 2.8*cm, 1.5*cm, 2.5*cm, 2.2*cm])
        gap_table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), C_SURFACE),
            ("ALIGN", (0,0), (-1,-1), "LEFT"),
            ("ALIGN", (4,0), (5,-1), "CENTER"),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [C_BG, C_SURFACE]),
            ("BOX", (0,0), (-1,-1), 0.5, C_BORDER),
            ("INNERGRID", (0,0), (-1,-1), 0.5, C_BORDER),
            ("ROWPADDING", (0,0), (-1,-1), 6),
        ]))
        story.append(gap_table)
    else:
        story.append(Paragraph("No gap data available.", S["body"]))

    story.append(Spacer(1, 1*cm))

    # ── Learning Roadmap ───────────────────────────────────────────────────────
    story.append(Paragraph("Personalised Learning Roadmap", S["section"]))
    story.append(HRFlowable(width="100%", thickness=1, color=C_BORDER))
    story.append(Spacer(1, 0.4*cm))

    phases = {}
    for c in roadmap:
        ph = c.get("phase","Other")
        phases.setdefault(ph, []).append(c)

    phase_order = ["Foundation", "Core Role Skills", "Applied Practice", "Optional Stretch"]
    for ph in phase_order:
        courses = phases.get(ph, [])
        if not courses:
            continue
        story.append(Paragraph(ph, S["phase"]))
        for c in courses:
            skills = c.get("skills") or c.get("skills_addressed") or []
            row = [
                Paragraph(c.get("title",""), S["bold"]),
                Paragraph(f"{c.get('duration_hours',0)}h · {c.get('difficulty','')}", S["r"]),
            ]
            t = Table([row], colWidths=["75%","25%"])
            t.setStyle(TableStyle([
                ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
                ("BACKGROUND",(0,0),(-1,-1),C_SURFACE),
                ("BOX",(0,0),(-1,-1),0.5,C_BORDER),
                ("LEFTPADDING",(0,0),(0,-1),8),
                ("RIGHTPADDING",(1,0),(1,-1),8),
                ("ROWPADDING",(0,0),(-1,-1),6),
            ]))
            story.append(t)
            if skills:
                story.append(Paragraph("Skills: " + ", ".join(s.replace("_"," ") for s in skills[:6]), S["sk"]))
            if c.get("justification"):
                story.append(Paragraph(c["justification"][:180], S["just"]))
            story.append(Spacer(1, 0.2*cm))

    story.append(Spacer(1, 0.6*cm))
    total_hours = sum(c.get("duration_hours", 0) for c in roadmap)
    story.append(Paragraph(f"Estimated total learning time: <b>{total_hours} hours</b>", S["body"]))

    # ── Footer note ────────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.5*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "Generated by AI Adaptive Onboarding Engine · Evidence-grounded skill gap analysis",
        S["footer"],
    ))

    doc.build(story)
    return buffer.getvalue()
