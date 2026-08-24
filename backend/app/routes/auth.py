from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from app import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "teacher")  # default every new signup to "teacher"

    if not full_name or not email or not password:
        return jsonify({"error": "full_name, email, and password are required"}), 400

    if role not in ("teacher", "admin"):
        return jsonify({"error": "role must be 'teacher' or 'admin'"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(full_name=full_name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(
        identity=str(user.id), additional_claims={"role": user.role}
    )
    return jsonify({"user": user.to_dict(), "access_token": token}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(
        identity=str(user.id), additional_claims={"role": user.role}
    )
    return jsonify({"user": user.to_dict(), "access_token": token}), 200
