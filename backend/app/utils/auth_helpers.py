from flask_jwt_extended import get_jwt, get_jwt_identity
from app.models.user import User


def current_user():
    user_id = get_jwt_identity()
    return User.query.get(int(user_id))


def is_admin():
    claims = get_jwt()
    return claims.get("role") == "admin"
