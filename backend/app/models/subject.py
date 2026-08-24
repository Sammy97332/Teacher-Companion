from app import db


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)  # e.g. "Mathematics"

    class_id = db.Column(db.Integer, db.ForeignKey("school_classes.id"), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "class_id": self.class_id}
