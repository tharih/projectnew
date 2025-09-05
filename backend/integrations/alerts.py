from typing import Optional
import httpx

async def _post_webhook(url: str, payload: dict) -> None:
    timeout = httpx.Timeout(10.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            await client.post(url, json=payload)
        except Exception:
            print("Webhook post failed:", url)

async def send_attendance_alert(
    slack_webhook: Optional[str],
    teams_webhook: Optional[str],
    *, 
    user_name: str,
    emotion: str,
    event_type: str,
    timestamp_iso: str
) -> None:
    slack_payload = {
        "text": f":bell: Attendance {event_type.replace('_',' ').title()}\n"
                f"*User:* {user_name}\n*Emotion:* {emotion}\n*Time:* {timestamp_iso}"
    }
    teams_payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "summary": "Attendance event",
        "themeColor": "0076D7",
        "title": f"Attendance {event_type.replace('_',' ').title()}",
        "sections": [{
            "facts": [
                {"name": "User", "value": user_name},
                {"name": "Emotion", "value": emotion},
                {"name": "Time", "value": timestamp_iso},
            ]
        }]
    }
    tasks = []
    if slack_webhook:
        tasks.append(_post_webhook(slack_webhook, slack_payload))
    if teams_webhook:
        tasks.append(_post_webhook(teams_webhook, teams_payload))
    if tasks:
        import asyncio
        await asyncio.gather(*tasks, return_exceptions=True)
