from datetime import datetime, timedelta
from typing import Optional
try:
    from backend.core.database import Database
except Exception:
    Database = None

def is_duplicate_event(user_id: int, now: datetime, threshold_minutes: int = 2) -> bool:
    if Database is None:
        return False
    db = Database()
    cutoff = (now - timedelta(minutes=threshold_minutes)).isoformat()
    row = db.fetch_one(
        "SELECT id FROM attendances WHERE user_id=? AND created_at>=? ORDER BY created_at DESC LIMIT 1",
        (user_id, cutoff)
    )
    return row is not None
