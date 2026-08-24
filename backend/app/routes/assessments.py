from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.student import Student
from app.models.subject import Subject
from app.models.assessment import Assessment
from app.models.school_class import SchoolClass
from app.utils.auth_helpers import current_user, is_admin

assessments_bp = Blueprint("assessments", __name__)

CA_TYPES = {"quiz", "test", "exercise"}
ALL_TYPES = CA_TYPES | {"exam"}


def _authorize_student_access(student_id, user):
    student = Student.query.get_or_404(student_id)
    school_class = SchoolClass.query.get(student.class_id)
    if not is_admin() and school_class.teacher_id != user.id:
        return None
    return student


@assessments_bp.post("/students/<int:student_id>/assessments")
@jwt_required()
def add_assessment(student_id):
    """Record a single CA score or exam score for a student in a subject."""
    user = current_user()
    student = _authorize_student_access(student_id, user)
    if student is None:
        return jsonify({"error": "You don't have access to this student"}), 403

    data = request.get_json() or {}
    assessment_type = data.get("assessment_type")
    subject_id = data.get("subject_id")
    score = data.get("score")
    max_score = data.get("max_score", 100.0)
    term = data.get("term", "").strip()
    title = data.get("title")

    if assessment_type not in ALL_TYPES:
        return jsonify({"error": f"assessment_type must be one of {sorted(ALL_TYPES)}"}), 400
    if not subject_id or score is None or not term:
        return jsonify({"error": "subject_id, score, and term are required"}), 400

    subject = Subject.query.get(subject_id)
    if not subject or subject.class_id != student.class_id:
        return jsonify({"error": "subject not found in this student's class"}), 400

    try:
        score = float(score)
        max_score = float(max_score)
    except (TypeError, ValueError):
        return jsonify({"error": "score and max_score must be numbers"}), 400

    if score < 0 or score > max_score:
        return jsonify({"error": "score must be between 0 and max_score"}), 400

    assessment = Assessment(
        assessment_type=assessment_type,
        title=title,
        score=score,
        max_score=max_score,
        term=term,
        student_id=student_id,
        subject_id=subject_id,
    )
    db.session.add(assessment)
    db.session.commit()
    return jsonify(assessment.to_dict()), 201


@assessments_bp.get("/students/<int:student_id>/assessments")
@jwt_required()
def list_assessments(student_id):
    """List all scores for a student, optionally filtered by ?term= and/or ?subject_id="""
    user = current_user()
    student = _authorize_student_access(student_id, user)
    if student is None:
        return jsonify({"error": "You don't have access to this student"}), 403

    query = Assessment.query.filter_by(student_id=student_id)

    term = request.args.get("term")
    if term:
        query = query.filter_by(term=term)

    subject_id = request.args.get("subject_id")
    if subject_id:
        query = query.filter_by(subject_id=subject_id)

    assessments = query.all()
    return jsonify([a.to_dict() for a in assessments]), 200
