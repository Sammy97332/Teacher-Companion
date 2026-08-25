from io import BytesIO

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

from app.utils.auth_helpers import current_user
from app.routes.report_card import authorize_student_access, compute_report_card

report_card_pdf_bp = Blueprint("report_card_pdf", __name__)

# Colors matching the frontend design tokens
CHALKBOARD = colors.HexColor("#1F3D2E")
AMBER = colors.HexColor("#C99A3A")
TERRACOTTA = colors.HexColor("#B5563C")
SLATE = colors.HexColor("#3D4A47")
LINE = colors.HexColor("#E4DFD3")

GRADE_COLORS = {
    "A": CHALKBOARD, "B": CHALKBOARD,
    "C": AMBER, "D": AMBER,
    "E": TERRACOTTA, "F": TERRACOTTA,
}


def _build_pdf(report):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=25 * mm, bottomMargin=25 * mm,
        leftMargin=25 * mm, rightMargin=25 * mm,
    )
    styles = getSampleStyleSheet()

    school_style = ParagraphStyle(
        "School", parent=styles["Normal"], alignment=TA_CENTER,
        fontSize=9, textColor=SLATE, spaceAfter=2, tracking=1,
    )
    title_style = ParagraphStyle(
        "Title", parent=styles["Title"], alignment=TA_CENTER,
        fontSize=16, textColor=CHALKBOARD, spaceAfter=0,
    )
    label_style = ParagraphStyle(
        "Label", parent=styles["Normal"], fontSize=8, textColor=SLATE, spaceAfter=1,
    )
    value_style = ParagraphStyle(
        "Value", parent=styles["Normal"], fontSize=11, textColor=CHALKBOARD,
    )
    value_style_right = ParagraphStyle(
        "ValueRight", parent=value_style, alignment=TA_RIGHT,
    )
    note_style = ParagraphStyle(
        "Note", parent=styles["Normal"], fontSize=8, textColor=TERRACOTTA, spaceBefore=8,
    )

    story = []
    story.append(Paragraph("BEST BRAIN FOUNDATION ACADEMY", school_style))
    story.append(Paragraph("Termly Report Card", title_style))
    story.append(Spacer(1, 4 * mm))

    # Divider line under header
    header_line = Table([[""]], colWidths=[160 * mm])
    header_line.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 1.5, CHALKBOARD)]))
    story.append(header_line)
    story.append(Spacer(1, 6 * mm))

    student_info = Table(
        [[
            Paragraph("STUDENT<br/>" + f"<b>{report['student']['full_name']}</b>", label_style),
            Paragraph("TERM<br/>" + f"<b>{report['term']}</b>", label_style),
        ]],
        colWidths=[100 * mm, 60 * mm],
    )
    student_info.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(student_info)
    story.append(Spacer(1, 6 * mm))

    # Subjects table
    table_data = [["Subject", "CA (30%)", "Exam (70%)", "Final", "Grade"]]
    row_colors = []
    for s in report["subjects"]:
        grade = s["grade"] or "—"
        table_data.append([
            s["subject"],
            str(s["ca_score"]) if s["ca_score"] is not None else "—",
            str(s["exam_score"]) if s["exam_score"] is not None else "—",
            str(s["final_score"]) if s["final_score"] is not None else "—",
            grade,
        ])
        row_colors.append(GRADE_COLORS.get(s["grade"], SLATE))

    col_widths = [60 * mm, 25 * mm, 28 * mm, 22 * mm, 25 * mm]
    subj_table = Table(table_data, colWidths=col_widths, repeatRows=1)

    style_commands = [
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), SLATE),
        ("LINEBELOW", (0, 0), (-1, 0), 1, CHALKBOARD),
        ("LINEBELOW", (0, 1), (-1, -1), 0.5, LINE),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("TEXTCOLOR", (0, 1), (0, -1), CHALKBOARD),
        ("FONTNAME", (3, 1), (3, -1), "Helvetica-Bold"),
        ("FONTNAME", (4, 1), (4, -1), "Helvetica-Bold"),
    ]
    for i, color in enumerate(row_colors, start=1):
        style_commands.append(("TEXTCOLOR", (4, i), (4, i), color))

    subj_table.setStyle(TableStyle(style_commands))
    story.append(subj_table)

    if any(s["status"] != "complete" for s in report["subjects"]):
        story.append(Paragraph(
            "Some subjects are missing CA or exam scores and show as \u2014 until recorded.",
            note_style,
        ))

    story.append(Spacer(1, 8 * mm))

    # Overall average row
    overall_avg = report["overall_average"]
    overall_grade = report["overall_grade"]
    grade_color = GRADE_COLORS.get(overall_grade, SLATE)
    grade_hex = "#%02x%02x%02x" % (
        int(grade_color.red * 255), int(grade_color.green * 255), int(grade_color.blue * 255)
    )
    overall_value_text = f"{overall_avg if overall_avg is not None else '—'}"
    if overall_grade:
        overall_value_text += f'  <font color="{grade_hex}"><b>{overall_grade}</b></font>'

    overall_table = Table(
        [[
            Paragraph("<b>Overall average</b>", ParagraphStyle("OA", parent=styles["Normal"], fontSize=12, textColor=CHALKBOARD)),
            Paragraph(overall_value_text, value_style_right),
        ]],
        colWidths=[100 * mm, 60 * mm],
    )
    overall_table.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 1.5, CHALKBOARD),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    story.append(overall_table)

    doc.build(story)
    buffer.seek(0)
    return buffer


@report_card_pdf_bp.get("/students/<int:student_id>/report-card/pdf")
@jwt_required()
def download_report_card_pdf(student_id):
    user = current_user()
    student = authorize_student_access(student_id, user)
    if student is None:
        return jsonify({"error": "You don't have access to this student"}), 403

    term = request.args.get("term")
    if not term:
        return jsonify({"error": "term query param is required, e.g. ?term=Term 1"}), 400

    report = compute_report_card(student, term)
    pdf_buffer = _build_pdf(report)

    safe_name = student.full_name.replace(" ", "_")
    safe_term = term.replace(" ", "_")
    filename = f"ReportCard_{safe_name}_{safe_term}.pdf"

    return send_file(
        pdf_buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename,
    )
