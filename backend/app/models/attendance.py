from datetime import datetime, date as date_cls, timezone
from app import db


class Attendance(db.Model):
    __tablename__ = "attendance_records"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, default=date_cls.today)
    status = db.Column(db.String(10), nullable=False)  # "present", "absent", "late"

    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("school_classes.id"), nullable=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint("student_id", "date", name="uq_student_date"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "status": self.status,
            "student_id": self.student_id,
            "class_id": self.class_id,
        }
