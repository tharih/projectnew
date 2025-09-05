from pydantic import BaseModel, Field
from datetime import datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    token: str

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)

class UserOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class AttendanceOut(BaseModel):
    id: int
    name: str
    emotion: str
    timestamp: datetime
