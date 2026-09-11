import random
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from app import db
from app.models.user import User
from app.utils.email import send_verification_email

auth_bp = Blueprint("auth", __name__)

MAX_ADMINS = 2
CODE_EXPIRY_MINUTES = 15


def _generate_code():
    return f"{random.randint(0, 999999):06d}"


def _issue_and_send_code(user):
    code = _generate_code()
    user.verification_code = code
    user.verification_code_expires = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRY_MINUTES)
    db.session.commit()
    try:
        send_verification_email(user.email, user.full_name, code)
    except Exception as e:
        print("=" * 50)
        print(f"Failed to send verification email: {e}")
        print(f"To: {user.email}")
        print(f"Verification code: {code}")
        print("=" * 50)


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

    if role == "admin":
        current_admin_count = User.query.filter_by(role="admin").count()
        if current_admin_count >= MAX_ADMINS:
            return jsonify({
                "error": f"The maximum number of admin accounts ({MAX_ADMINS}) has already been reached"
            }), 403

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(full_name=full_name, email=email, role=role, email_verified=False)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    _issue_and_send_code(user)

    return jsonify({
        "message": "Account created. Check your email for a verification code.",
        "email": user.email,
    }), 201


@auth_bp.post("/verify-email")
def verify_email():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    code = data.get("code", "").strip()

    if not email or not code:
        return jsonify({"error": "email and code are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "No account found for this email"}), 404

    if user.email_verified:
        return jsonify({"error": "This account is already verified"}), 400

    if not user.verification_code or user.verification_code != code:
        return jsonify({"error": "Incorrect verification code"}), 400

    expires = user.verification_code_expires
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if not expires or expires < datetime.now(timezone.utc):
        return jsonify({"error": "This code has expired. Request a new one."}), 400

    user.email_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    db.session.commit()

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"user": user.to_dict(), "access_token": token}), 200


@auth_bp.post("/resend-code")
def resend_code():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "No account found for this email"}), 404

    if user.email_verified:
        return jsonify({"error": "This account is already verified"}), 400

    _issue_and_send_code(user)
    return jsonify({"message": "A new verification code has been sent."}), 200


@auth_bp.get("/admin-availability")
def admin_availability():
    current_admin_count = User.query.filter_by(role="admin").count()
    return jsonify({
        "admin_slots_available": max(0, MAX_ADMINS - current_admin_count),
        "max_admins": MAX_ADMINS,
    }), 200


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.email_verified:
        return jsonify({
            "error": "Please verify your email before logging in.",
            "email_verified": False,
            "email": user.email,
        }), 403

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"user": user.to_dict(), "access_token": token}), 200