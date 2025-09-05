from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, List
from .database import get_db
from .models import Attendance, Person
from .auth import get_current_account, Account

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

def _utc_midnight(dt: datetime) -> datetime:
    return datetime(dt.year, dt.month, dt.day)

@router.get("/summary")
def summary(db: Session = Depends(get_db), _: Account = Depends(get_current_account)):
    now = datetime.utcnow()
    start_today = _utc_midnight(now)
    # Attendance today
    today_rows = (
        db.query(Attendance)
        .filter(Attendance.timestamp >= start_today, Attendance.timestamp <= now)
        .all()
    )
    attendance_today = len(today_rows)
    # Unique people today
    unique_people = len(set(a.person_id for a in today_rows))

    # Emotion distribution today
    emotions_today: Dict[str, int] = {}
    for a in today_rows:
        emotions_today[a.emotion] = emotions_today.get(a.emotion, 0) + 1

    # Total users
    total_users = db.query(Person).count()

    # Last attendance
    last_row = (
        db.query(Attendance)
        .join(Person, Attendance.person_id == Person.id)
        .order_by(Attendance.timestamp.desc())
        .first()
    )
    last_attendance = None
    if last_row:
        last_attendance = {
            "name": last_row.person.name,
            "emotion": last_row.emotion,
            "timestamp": last_row.timestamp.isoformat(),
        }

    return {
        "total_users": total_users,
        "attendance_today": attendance_today,
        "unique_people_today": unique_people,
        "emotions_today": emotions_today,
        "last_attendance": last_attendance,
    }

@router.get("/attendance_daily")
def attendance_daily(days: int = 7, db: Session = Depends(get_db), _: Account = Depends(get_current_account)):
    days = max(1, min(days, 30))
    end = datetime.utcnow()
    start = _utc_midnight(end - timedelta(days=days - 1))
    rows = (
        db.query(Attendance)
        .filter(Attendance.timestamp >= start, Attendance.timestamp <= end)
        .all()
    )
    
    buckets: Dict[str, int] = {}
    for i in range(days):
        d = start + timedelta(days=i)
        buckets[d.strftime("%Y-%m-%d")] = 0
    for a in rows:
        key = _utc_midnight(a.timestamp).strftime("%Y-%m-%d")
        if key in buckets:
            buckets[key] += 1
    return [{"date": k, "count": buckets[k]} for k in sorted(buckets.keys())]

@router.get("/emotions")
def emotions(days: int = 7, db: Session = Depends(get_db), _: Account = Depends(get_current_account)):
    days = max(1, min(days, 30))
    end = datetime.utcnow()
    start = end - timedelta(days=days)
    rows = (
        db.query(Attendance)
        .filter(Attendance.timestamp >= start, Attendance.timestamp <= end)
        .all()
    )
    agg: Dict[str, int] = {}
    for a in rows:
        agg[a.emotion] = agg.get(a.emotion, 0) + 1
    return {"days": days, "distribution": agg}

@router.get("/recent")
def recent(limit: int = 10, db: Session = Depends(get_db), _: Account = Depends(get_current_account)):
    limit = max(1, min(limit, 50))
    rows = (
        db.query(Attendance)
        .join(Person, Attendance.person_id == Person.id)
        .order_by(Attendance.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "name": r.person.name,
            "emotion": r.emotion,
            "timestamp": r.timestamp.isoformat(),
        }
        for r in rows
    ]
