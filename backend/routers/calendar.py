from fastapi import APIRouter, Query, Response, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timezone

try:
    from backend.core.database import Database
except Exception:
    Database = None

router = APIRouter(prefix="/api/calendar", tags=["calendar"])

def _fetch_checkins(from_iso: str, to_iso: str) -> List[Dict[str, Any]]:
    if Database is None:
        return []
    db = Database()
    rows = db.fetch_all(
        "SELECT user_id, user_name, created_at FROM attendances "
        "WHERE event_type IN ('check_in','in','attendance') AND created_at BETWEEN ? AND ? "
        "ORDER BY created_at ASC",
        (from_iso, to_iso)
    )
    out = []
    for r in rows:
        if isinstance(r, dict):
            uid = r.get("user_id")
            name = r.get("user_name") or f"User {uid}"
            created_at = r.get("created_at")
        else:
            uid, name, created_at = r
            name = name or f"User {uid}"
        if isinstance(created_at, datetime):
            iso = created_at.astimezone(timezone.utc).isoformat()
        else:
            iso = str(created_at)
        out.append({"user_id": uid, "user_name": name, "created_at_iso": iso})
    return out

@router.get("/attendance.ics")
def ics_feed(
    from_iso: str = Query(..., description="Start datetime ISO (inclusive)"),
    to_iso: str = Query(..., description="End datetime ISO (inclusive)")
) -> Response:
    try:
        events = _fetch_checkins(from_iso, to_iso)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB fetch failed: {e}")

    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FaceSense//Calendar//EN"]
    for ev in events:
        dt = datetime.fromisoformat(ev["created_at_iso"].replace("Z","+00:00"))
        dt_utc = dt.astimezone(timezone.utc)
        dtstamp = dt_utc.strftime("%Y%m%dT%H%M%SZ")
        uid = f"{ev['user_id']}-{dtstamp}@face-attendance"
        title = f"Attendance: {ev['user_name']}"
        lines += [
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{dtstamp}",
            f"DTSTART:{dtstamp}",
            f"DTEND:{dtstamp}",
            f"SUMMARY:{title}",
            "END:VEVENT"
        ]
    lines.append("END:VCALENDAR")
    ics = "\r\n".join(lines)
    return Response(content=ics, media_type="text/calendar")
