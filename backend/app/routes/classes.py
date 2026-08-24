from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.school_class import SchoolClass
from app.models.student import Student
from app.models.subject import Subject
from app.models.assessment import Assessment
from app.models.attendance import Attendance
from app.utils.auth_helpers import current_user, is_admin

classes_bp = Blueprint("classes", __name__)


@classes_bp.post("")
@jwt_required()
def create_class():
    user = current_user()
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    academic_year = data.get("academic_year", "").strip()
    term = data.get("term", "").strip()

    if not name or not academic_year or not term:
        return jsonify({"error": "name, academic_year, and term are required"}), 400

    school_class = SchoolClass(
        name=name, academic_year=academic_year, term=term, teacher_id=user.id
    )
    db.session.add(school_class)
    db.session.commit()

    return jsonify(school_class.to_dict()), 201


@classes_bp.get("")
@jwt_required()
def list_classes():
    user = current_user()
    if is_admin():
        classes = SchoolClass.query.all()
    else:
        classes = SchoolClass.query.filter_by(teacher_id=user.id).all()

    return jsonify([c.to_dict() for c in classes]), 200


@classes_bp.get("/<int:class_id>")
@jwt_required()
def get_class(class_id):
    user = current_user()
    school_class = SchoolClass.query.get_or_404(class_id)

    if not is_admin() and school_class.teacher_id != user.id:
        return jsonify({"error": "You don't have access to this class"}), 403

    return jsonify(school_class.to_dict(include_students=True)), 200


@classes_bp.delete("/<int:class_id>")
@jwt_required()
def delete_class(class_id):
    """Deletes a class and everything inside it: students, subjects,
    attendance records, and assessments. This cannot be undone."""
    user = current_user()
    school_class = SchoolClass.query.get_or_404(class_id)

    if not is_admin() and school_class.teacher_id != user.id:
        return jsonify({"error": "You don't have access to this class"}), 403

    student_ids = [s.id for s in school_class.students]
    subject_ids = [s.id for s in Subject.query.filter_by(class_id=class_id).all()]

    if student_ids:
        Assessment.query.filter(Assessment.student_id.in_(student_ids)).delete(synchronize_session=False)
        Attendance.query.filter(Attendance.student_id.in_(student_ids)).delete(synchronize_session=False)
    if subject_ids:
        Assessment.query.filter(Assessment.subject_id.in_(subject_ids)).delete(synchronize_session=False)

    Subject.query.filter_by(class_id=class_id).delete(synchronize_session=False)
    Student.query.filter_by(class_id=class_id).delete(synchronize_session=False)
    db.session.delete(school_class)
    db.session.commit()

    return jsonify({"message": "Class and all related records deleted"}), 200
