from datetime import datetime, timezone
from app import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # "teacher" or "admin" — admin can see across all classes, teacher only their own
    role = db.Column(db.String(20), nullable=False, default="teacher")

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # A teacher can own many classes; admins typically own none directly
    classes = db.relationship("SchoolClass", backref="teacher", lazy=True)

    def set_password(self, raw_password):
        self.password_hash = bcrypt.generate_password_hash(raw_password).decode("utf-8")

    def check_password(self, raw_password):
        return bcrypt.check_password_hash(self.password_hash, raw_password)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }
