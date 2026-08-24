from datetime import datetime, timezone
from app import db


class Assessment(db.Model):
    __tablename__ = "assessments"

    id = db.Column(db.Integer, primary_key=True)

    # "quiz", "test", "exercise" (feed into CA score) or "exam" (separate, end-of-term)
    assessment_type = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(120), nullable=True)  # e.g. "Quiz 1 - Fractions"

    score = db.Column(db.Float, nullable=False)
    max_score = db.Column(db.Float, nullable=False, default=100.0)

    term = db.Column(db.String(20), nullable=False)  # e.g. "Term 1"

    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "assessment_type": self.assessment_type,
            "title": self.title,
            "score": self.score,
            "max_score": self.max_score,
            "term": self.term,
            "student_id": self.student_id,
            "subject_id": self.subject_id,
        }
