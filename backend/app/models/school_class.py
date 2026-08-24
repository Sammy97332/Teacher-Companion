from datetime import datetime, timezone
from app import db


class SchoolClass(db.Model):
    __tablename__ = "school_classes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)       # e.g. "Basic 5"
    academic_year = db.Column(db.String(20), nullable=False)  # e.g. "2026/2027"
    term = db.Column(db.String(20), nullable=False)        # e.g. "Term 1"

    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    students = db.relationship(
        "Student", backref="school_class", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self, include_students=False):
        data = {
            "id": self.id,
            "name": self.name,
            "academic_year": self.academic_year,
            "term": self.term,
            "teacher_id": self.teacher_id,
            "teacher_name": self.teacher.full_name if self.teacher else None,
            "student_count": len(self.students),
        }
        if include_students:
            data["students"] = [s.to_dict() for s in self.students]
        return data
