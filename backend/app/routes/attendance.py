from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.school_class import SchoolClass
from app.models.student import Student
from app.models.attendance import Attendance
from app.utils.auth_helpers import current_user, is_admin

attendance_bp = Blueprint("attendance", __name__)

VALID_STATUSES = {"present", "absent", "late"}


def _authorize_class_access(class_id, user):
    school_class = SchoolClass.query.get_or_404(class_id)
    if not is_admin() and school_class.teacher_id != user.id:
        return None
    return school_class


@attendance_bp.post("/classes/<int:class_id>/attendance")
@jwt_required()
def mark_attendance(class_id):
    """Bulk mark attendance for a class on a given date.

    Body: {
      "date": "2026-08-23",
      "records": [{"student_id": 1, "status": "present"}, ...]
    }
    """
    user = current_user()
    school_class = _authorize_class_access(class_id, user)
    if school_class is None:
        return jsonify({"error": "You don't have access to this class"}), 403

    data = request.get_json() or {}
    date_raw = data.get("date")
    records = data.get("records", [])

    if not date_raw or not records:
        return jsonify({"error": "date and records are required"}), 400

    try:
        att_date = datetime.strptime(date_raw, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "date must be in YYYY-MM-DD format"}), 400

    class_student_ids = {s.id for s in school_class.students}
    saved = []

    for rec in records:
        student_id = rec.get("student_id")
        status = rec.get("status")

        if student_id not in class_student_ids:
            return jsonify({"error": f"student_id {student_id} is not in this class"}), 400
        if status not in VALID_STATUSES:
            return jsonify({"error": f"status must be one of {sorted(VALID_STATUSES)}"}), 400

        existing = Attendance.query.filter_by(student_id=student_id, date=att_date).first()
        if existing:
            existing.status = status
            saved.append(existing)
        else:
            new_record = Attendance(
                date=att_date, status=status, student_id=student_id, class_id=class_id
            )
            db.session.add(new_record)
            saved.append(new_record)

    db.session.commit()
    return jsonify([r.to_dict() for r in saved]), 200


@attendance_bp.get("/classes/<int:class_id>/attendance")
@jwt_required()
def get_class_attendance(class_id):
    """Get attendance for a class on a specific date, e.g. ?date=2026-08-23"""
    user = current_user()
    school_class = _authorize_class_access(class_id, user)
    if school_class is None:
        return jsonify({"error": "You don't have access to this class"}), 403

    date_raw = request.args.get("date")
    if not date_raw:
        return jsonify({"error": "date query param is required, e.g. ?date=2026-08-23"}), 400

    try:
        att_date = datetime.strptime(date_raw, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "date must be in YYYY-MM-DD format"}), 400

    records = Attendance.query.filter_by(class_id=class_id, date=att_date).all()
    return jsonify([r.to_dict() for r in records]), 200


@attendance_bp.get("/students/<int:student_id>/attendance")
@jwt_required()
def get_student_attendance(student_id):
    """Full attendance history + summary stats for one student."""
    user = current_user()
    student = Student.query.get_or_404(student_id)
    school_class = _authorize_class_access(student.class_id, user)
    if school_class is None:
        return jsonify({"error": "You don't have access to this student"}), 403

    records = (
        Attendance.query.filter_by(student_id=student_id)
        .order_by(Attendance.date.desc())
        .all()
    )

    total = len(records)
    present = sum(1 for r in records if r.status == "present")
    absent = sum(1 for r in records if r.status == "absent")
    late = sum(1 for r in records if r.status == "late")

    return jsonify({
        "student_id": student_id,
        "total_days_recorded": total,
        "present": present,
        "absent": absent,
        "late": late,
        "attendance_rate": round((present / total) * 100, 1) if total else None,
        "records": [r.to_dict() for r in records],
    }), 200
