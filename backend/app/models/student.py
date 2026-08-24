from datetime import datetime, timezone
from app import db


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    admission_number = db.Column(db.String(40), nullable=True, index=True)
    gender = db.Column(db.String(10), nullable=True)  # "M" / "F" — kept simple
    date_of_birth = db.Column(db.Date, nullable=True)
    guardian_name = db.Column(db.String(120), nullable=True)
    guardian_phone = db.Column(db.String(30), nullable=True)

    class_id = db.Column(db.Integer, db.ForeignKey("school_classes.id"), nullable=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "admission_number": self.admission_number,
            "gender": self.gender,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "guardian_name": self.guardian_name,
            "guardian_phone": self.guardian_phone,
            "class_id": self.class_id,
        }
