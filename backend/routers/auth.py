from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta, timezone
import os

from passlib.context import CryptContext
from jose import jwt

from backend.core import auth_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

auth_db.init()

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGO = "HS256"
JWT_MINUTES = int(os.getenv("JWT_MINUTES", "120"))

class RegisterReq(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str

class LoginReq(BaseModel):
    identity: str
    password: str

class TokenResp(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_display: str

class FaceStartReq(BaseModel):
    identity: str

class FaceVerifyReq(BaseModel):
    face_token: str

def _issue_jwt(user_row) -> TokenResp:
    uid, email, username, _, full_name, _ = user_row
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=JWT_MINUTES)
    payload = {
        "sub": str(uid),
        "email": email,
        "username": username,
        "name": full_name,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp())
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)
    return TokenResp(access_token=token, user_display=full_name or username or email)

@router.post("/register", response_model=TokenResp)
def register(req: RegisterReq):
    if auth_db.get_user_by_email(req.email) or auth_db.get_user_by_username(req.username):
        raise HTTPException(status_code=409, detail="Email or username already exists")
    ph = pwd.hash(req.password)
    uid = auth_db.create_user(req.email, req.username, ph, req.full_name)
    row = auth_db.get_user_by_username(req.username)
    return _issue_jwt(row)

@router.post("/login", response_model=TokenResp)
def login(req: LoginReq):
    user = auth_db.get_user_by_email(req.identity) or auth_db.get_user_by_username(req.identity)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    _, email, username, password_hash, full_name, _ = user
    if not pwd.verify(req.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return _issue_jwt(user)

class FaceStartResp(BaseModel):
    face_session_id: str

@router.post("/face/start", response_model=FaceStartResp)
def face_start(req: FaceStartReq):
    import base64, os
    raw = f"{req.identity}:{os.urandom(8).hex()}".encode()
    return FaceStartResp(face_session_id=base64.urlsafe_b64encode(raw).decode())

def _verify_face_token(face_token: str) -> Optional[str]:
    face_token = (face_token or "").strip()
    return face_token or None

@router.post("/face/verify", response_model=TokenResp)
def face_verify(req: FaceVerifyReq):
    face_id = _verify_face_token(req.face_token)
    if not face_id:
        raise HTTPException(status_code=401, detail="Face verification failed")
    user = auth_db.get_user_by_face_id(face_id)
    if not user:
        raise HTTPException(status_code=404, detail="No user bound to this face")
    return _issue_jwt(user)
