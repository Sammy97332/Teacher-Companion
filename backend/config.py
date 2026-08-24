import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    # Swap this for your real PostgreSQL URL in production, e.g.:
    # postgresql://user:password@localhost:5432/teacher_companion
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'app.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-this")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
