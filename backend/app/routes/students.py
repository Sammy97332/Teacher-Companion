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


def _authorize_student_access(student_id, user):
    student = Student.query.get_or_404(student_id)
    school_class = SchoolClass.query.get(student.class_id)
    if not is_admin() and school_class.teacher_id != user.id:
        return None
    return student


@students_bp.put("/students/<int:student_id>")
@jwt_required()
def update_student(student_id):
    user = current_user()
    student = _authorize_student_access(student_id, user)
    if student is None:
        return jsonify({"error": "You don't have access to this student"}), 403

    data = request.get_json() or {}

    if "full_name" in data:
        full_name = data["full_name"].strip()
        if not full_name:
            return jsonify({"error": "full_name cannot be empty"}), 400
        student.full_name = full_name

    if "admission_number" in data:
        student.admission_number = data["admission_number"]
    if "gender" in data:
        student.gender = data["gender"]
    if "guardian_name" in data:
        student.guardian_name = data["guardian_name"]
    if "guardian_phone" in data:
        student.guardian_phone = data["guardian_phone"]
    if "date_of_birth" in data:
        dob_raw = data["date_of_birth"]
        student.date_of_birth = datetime.strptime(dob_raw, "%Y-%m-%d").date() if dob_raw else None

    db.session.commit()
    return jsonify(student.to_dict()), 200


@students_bp.delete("/students/<int:student_id>")
@jwt_required()
def delete_student(student_id):
    """Deletes a student along with their attendance and assessment records."""
    from app.models.attendance import Attendance
    from app.models.assessment import Assessment

    user = current_user()
    student = _authorize_student_access(student_id, user)
    if student is None:
        return jsonify({"error": "You don't have access to this student"}), 403

    Attendance.query.filter_by(student_id=student_id).delete(synchronize_session=False)
    Assessment.query.filter_by(student_id=student_id).delete(synchronize_session=False)
    db.session.delete(student)
    db.session.commit()

    return jsonify({"message": "Student and related records deleted"}), 200
