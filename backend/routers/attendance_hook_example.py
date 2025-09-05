from datetime import datetime, timezone
from .settings import _load
from ..integrations.alerts import send_attendance_alert

async def notify_attendance_event(*, user_name: str, emotion: str, event_type: str):
    data = _load()
    integrations = data.get("integrations", {})
    slack_webhook = integrations.get("slack_webhook")
    teams_webhook = integrations.get("teams_webhook")
    now_iso = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
    await send_attendance_alert(
        slack_webhook=slack_webhook,
        teams_webhook=teams_webhook,
        user_name=user_name,
        emotion=emotion,
        event_type=event_type,
        timestamp_iso=now_iso
    )
