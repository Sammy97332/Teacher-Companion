from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from config import Config

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    CORS(app)

    from app.routes.auth import auth_bp
    from app.routes.classes import classes_bp
    from app.routes.students import students_bp
    from app.routes.attendance import attendance_bp
    from app.routes.subjects import subjects_bp
    from app.routes.assessments import assessments_bp
    from app.routes.report_card import report_card_bp
    from app.routes.report_card_pdf import report_card_pdf_bp
    from app.routes.admin import admin_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(classes_bp, url_prefix="/api/classes")
    app.register_blueprint(students_bp, url_prefix="/api")
    app.register_blueprint(attendance_bp, url_prefix="/api")
    app.register_blueprint(subjects_bp, url_prefix="/api")
    app.register_blueprint(assessments_bp, url_prefix="/api")
    app.register_blueprint(report_card_bp, url_prefix="/api")
    app.register_blueprint(report_card_pdf_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api")

    with app.app_context():
        from app.models.user import User
        from app.models.school_class import SchoolClass
        from app.models.student import Student
        from app.models.attendance import Attendance
        from app.models.subject import Subject
        from app.models.assessment import Assessment
        db.create_all()

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
