from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app.models.user import User
from app.models.school_class import SchoolClass
from app.models.student import Student
from app.utils.auth_helpers import is_admin

admin_bp = Blueprint("admin", __name__)


def _require_admin():
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403
    return None


@admin_bp.get("/admin/overview")
@jwt_required()
def overview():
    denied = _require_admin()
    if denied:
        return denied

    teacher_count = User.query.filter_by(role="teacher").count()
    class_count = SchoolClass.query.count()
    student_count = Student.query.count()

    return jsonify({
        "teacher_count": teacher_count,
        "class_count": class_count,
        "student_count": student_count,
    }), 200


@admin_bp.get("/admin/teachers")
@jwt_required()
def list_teachers():
    """List all teachers with their classes, so an admin can drill into any of them."""
    denied = _require_admin()
    if denied:
        return denied

    teachers = User.query.filter_by(role="teacher").all()
    result = []
    for t in teachers:
        classes = SchoolClass.query.filter_by(teacher_id=t.id).all()
        result.append({
            "id": t.id,
            "full_name": t.full_name,
            "email": t.email,
            "classes": [c.to_dict() for c in classes],
        })

    return jsonify(result), 200
