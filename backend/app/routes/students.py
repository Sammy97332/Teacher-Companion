from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.school_class import SchoolClass
from app.models.student import Student
from app.utils.auth_helpers import current_user, is_admin

students_bp = Blueprint("students", __name__)


def _authorize_class_access(class_id, user):
    school_class = SchoolClass.query.get_or_404(class_id)
    if not is_admin() and school_class.teacher_id != user.id:
        return None
    return school_class


@students_bp.post("/classes/<int:class_id>/students")
@jwt_required()
def add_student(class_id):
    user = current_user()
    school_class = _authorize_class_access(class_id, user)
    if school_class is None:
        return jsonify({"error": "You don't have access to this class"}), 403

    data = request.get_json() or {}
    full_name = data.get("full_name", "").strip()
    if not full_name:
        return jsonify({"error": "full_name is required"}), 400

    dob_raw = data.get("date_of_birth")
    dob = datetime.strptime(dob_raw, "%Y-%m-%d").date() if dob_raw else None

    student = Student(
        full_name=full_name,
        admission_number=data.get("admission_number"),
        gender=data.get("gender"),
        date_of_birth=dob,
        guardian_name=data.get("guardian_name"),
        guardian_phone=data.get("guardian_phone"),
        class_id=school_class.id,
    )
    db.session.add(student)
    db.session.commit()

    return jsonify(student.to_dict()), 201


@students_bp.get("/classes/<int:class_id>/students")
@jwt_required()
def list_students(class_id):
    user = current_user()
    school_class = _authorize_class_access(class_id, user)
    if school_class is None:
        return jsonify({"error": "You don't have access to this class"}), 403

    return jsonify([s.to_dict() for s in school_class.students]), 200
