from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean, Index
from .database import Base
from datetime import datetime
Index  

class Account(Base):
    __tablename__ = "accounts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Person(Base):
    __tablename__ = "persons"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)

class Attendance(Base):
    __tablename__ = "attendance"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    person_id: Mapped[int] = mapped_column(ForeignKey("persons.id"), index=True)  # index=True helps
    emotion: Mapped[str] = mapped_column(String(30))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    person = relationship("Person")

    # Index("ix_attendance_person_time", Attendance.person_id, Attendance.timestamp)   
