from fastapi import APIRouter, Query, Response, HTTPException
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
import csv, io

try:
    from backend.core.database import Database
except Exception:
    Database = None

router = APIRouter(prefix="/api/reports", tags=["reports"])

def _fetch_events(from_iso: str, to_iso: str) -> List[Dict[str, Any]]:
    if Database is None:
        return []
    db = Database()
    rows = db.fetch_all(
        "SELECT user_id, user_name, event_type, created_at FROM attendances "
        "WHERE created_at BETWEEN ? AND ? ORDER BY user_id, created_at ASC",
        (from_iso, to_iso)
    )
    events = []
    for r in rows:
        if isinstance(r, dict):
            user_id = r.get("user_id")
            user_name = r.get("user_name") or f"User {user_id}"
            event_type = r.get("event_type")
            created_at = r.get("created_at")
        else:
            user_id, user_name, event_type, created_at = r
            user_name = user_name or f"User {user_id}"
        if isinstance(created_at, datetime):
            created_iso = created_at.astimezone(timezone.utc).isoformat()
        else:
            created_iso = str(created_at)
        events.append({
            "user_id": user_id,
            "user_name": user_name,
            "event_type": event_type,
            "created_at_iso": created_iso
        })
    return events

def _pair_sessions(events: List[Dict[str, Any]]) -> Dict[int, List[Tuple[datetime, datetime]]]:
    from dateutil import parser
    sessions: Dict[int, List[Tuple[datetime, datetime]]] = {}
    open_check: Dict[int, datetime] = {}
    for ev in events:
        uid = int(ev["user_id"])
        t = parser.isoparse(ev["created_at_iso"])
        et = (ev.get("event_type") or "").lower()
        if et in ("check_in", "in"):
            open_check[uid] = t
        elif et in ("check_out", "out"):
            start = open_check.pop(uid, None)
            if start:
                sessions.setdefault(uid, []).append((start, t))
        elif et == "attendance":
            sessions.setdefault(uid, []).append((t, t))
    return sessions

@router.get("/payroll")
def payroll_csv(
    from_iso: str = Query(..., description="Start datetime ISO (inclusive)"),
    to_iso: str = Query(..., description="End datetime ISO (inclusive)")
) -> Response:
    try:
        events = _fetch_events(from_iso, to_iso)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB fetch failed: {e}")

    events_by_user: Dict[int, List[Dict[str, Any]]] = {}
    for e in events:
        events_by_user.setdefault(int(e["user_id"]), []).append(e)

    from dateutil import parser
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["user_id", "user_name", "sessions", "total_minutes"])
    for uid, user_events in events_by_user.items():
        user_name = user_events[0]["user_name"]
        sessions = _pair_sessions(user_events).get(uid, [])
        minutes = 0
        sess_strs = []
        for start, end in sessions:
            dur = int((end - start).total_seconds() // 60)
            minutes += max(dur, 0)
            sess_strs.append(f"{start.isoformat()} -> {end.isoformat()}")
        w.writerow([uid, user_name, "; ".join(sess_strs) or "-", minutes])
    csv_bytes = output.getvalue().encode("utf-8")
    return Response(content=csv_bytes, media_type="text/csv")
