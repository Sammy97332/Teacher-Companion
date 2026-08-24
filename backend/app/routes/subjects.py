from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.school_class import SchoolClass
from app.models.subject import Subject
from app.utils.auth_helpers import current_user, is_admin

subjects_bp = Blueprint("subjects", __name__)


def _authorize_class_access(class_id, user):
    school_class = SchoolClass.query.get_or_404(class_id)
    if not is_admin() and school_class.teacher_id != user.id:
        return None
    return school_class


@subjects_bp.post("/classes/<int:class_id>/subjects")
@jwt_required()
def add_subject(class_id):
    user = current_user()
    school_class = _authorize_class_access(class_id, user)
    if school_class is None:
        return jsonify({"error": "You don't have access to this class"}), 403

    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    subject = Subject(name=name, class_id=class_id)
    db.session.add(subject)
    db.session.commit()
    return jsonify(subject.to_dict()), 201


@subjects_bp.get("/classes/<int:class_id>/subjects")
@jwt_required()
def list_subjects(class_id):
    user = current_user()
    school_class = _authorize_class_access(class_id, user)
    if school_class is None:
        return jsonify({"error": "You don't have access to this class"}), 403

    subjects = Subject.query.filter_by(class_id=class_id).all()
    return jsonify([s.to_dict() for s in subjects]), 200
