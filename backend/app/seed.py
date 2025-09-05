from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from .models import Account, Person, Attendance
from .auth import get_password_hash

def seed(db: Session):
    if not db.query(Account).filter_by(username="admin").first():
        db.add(Account(username="admin", password_hash=get_password_hash("admin123")))

    names = ["Alice Johnson", "Bob Smith", "Carol King"]
    persons = []
    for name in names:
        p = db.query(Person).filter_by(name=name).first()
        if not p:
            p = Person(name=name); db.add(p)
        persons.append(p)

    db.flush()
    emotions = ["Happy", "Neutral", "Surprised"]
    base_time = datetime.utcnow()
    for i, p in enumerate(persons):
        if not db.query(Attendance).filter(Attendance.person_id == p.id).first():
            db.add(Attendance(person_id=p.id, emotion=emotions[i % len(emotions)], timestamp=base_time - timedelta(minutes=10*(i+1))))
    db.commit()

    