from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Optional
import json, os, pathlib

router = APIRouter(prefix="/api/settings", tags=["settings"])

SETTINGS_DIR = pathlib.Path(os.getenv("SETTINGS_DIR", "backend/data"))
SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
SETTINGS_FILE = SETTINGS_DIR / "settings.json"

class IntegrationSettings(BaseModel):
    slack_webhook: Optional[HttpUrl] = None
    teams_webhook: Optional[HttpUrl] = None

def _load() -> dict:
    if SETTINGS_FILE.exists():
        try:
            return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"integrations": {"slack_webhook": None, "teams_webhook": None}}

def _save(data: dict) -> None:
    SETTINGS_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")

@router.get("/integrations", response_model=IntegrationSettings)
def get_integrations():
    data = _load()
    return IntegrationSettings(**data.get("integrations", {}))

@router.put("/integrations", response_model=IntegrationSettings)
def put_integrations(payload: IntegrationSettings):
    data = _load()
    data["integrations"] = payload.dict()
    try:
        _save(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {e}")
    return payload
