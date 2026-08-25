from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app.models.student import Student
from app.models.subject import Subject
from app.models.assessment import Assessment
from app.models.school_class import SchoolClass
from app.utils.auth_helpers import current_user, is_admin

report_card_bp = Blueprint("report_card", __name__)

CA_TYPES = {"quiz", "test", "exercise"}

# Standard weighting: CA counts 30%, end-of-term exam counts 70%.
# Adjust these if your school uses a different split.
CA_WEIGHT = 0.30
EXAM_WEIGHT = 0.70


def grade_for(percentage):
    if percentage >= 80:
        return "A"
    elif percentage >= 70:
        return "B"
    elif percentage >= 60:
        return "C"
    elif percentage >= 50:
        return "D"
    elif percentage >= 40:
        return "E"
    else:
        return "F"


def authorize_student_access(student_id, user):
    student = Student.query.get_or_404(student_id)
    school_class = SchoolClass.query.get(student.class_id)
    if not is_admin() and school_class.teacher_id != user.id:
        return None
    return student


def compute_report_card(student, term):
    """Pure computation, reused by both the JSON endpoint and the PDF endpoint."""
    subjects = Subject.query.filter_by(class_id=student.class_id).all()
    subject_reports = []
    overall_percentages = []

    for subject in subjects:
        assessments = Assessment.query.filter_by(
            student_id=student.id, subject_id=subject.id, term=term
        ).all()

        ca_assessments = [a for a in assessments if a.assessment_type in CA_TYPES]
        exam_assessments = [a for a in assessments if a.assessment_type == "exam"]

        if ca_assessments:
            ca_percentage = sum(a.score / a.max_score * 100 for a in ca_assessments) / len(ca_assessments)
        else:
            ca_percentage = None

        if exam_assessments:
            exam = exam_assessments[-1]
            exam_percentage = exam.score / exam.max_score * 100
        else:
            exam_percentage = None

        if ca_percentage is not None and exam_percentage is not None:
            final_percentage = (ca_percentage * CA_WEIGHT) + (exam_percentage * EXAM_WEIGHT)
            grade = grade_for(final_percentage)
            overall_percentages.append(final_percentage)
        else:
            final_percentage = None
            grade = None

        subject_reports.append({
            "subject": subject.name,
            "ca_score": round(ca_percentage, 1) if ca_percentage is not None else None,
            "ca_components_count": len(ca_assessments),
            "exam_score": round(exam_percentage, 1) if exam_percentage is not None else None,
            "final_score": round(final_percentage, 1) if final_percentage is not None else None,
            "grade": grade,
            "status": "complete" if final_percentage is not None else "incomplete (missing CA or exam scores)",
        })

    overall_average = round(sum(overall_percentages) / len(overall_percentages), 1) if overall_percentages else None

    return {
        "student": student.to_dict(),
        "term": term,
        "weighting": {"ca_weight": CA_WEIGHT, "exam_weight": EXAM_WEIGHT},
        "subjects": subject_reports,
        "overall_average": overall_average,
        "overall_grade": grade_for(overall_average) if overall_average is not None else None,
    }


@report_card_bp.get("/students/<int:student_id>/report-card")
@jwt_required()
def generate_report_card(student_id):
    """Generate a termly report card, e.g. ?term=Term 1"""
    user = current_user()
    student = authorize_student_access(student_id, user)
    if student is None:
        return jsonify({"error": "You don't have access to this student"}), 403

    term = request.args.get("term")
    if not term:
        return jsonify({"error": "term query param is required, e.g. ?term=Term 1"}), 400

    return jsonify(compute_report_card(student, term)), 200
