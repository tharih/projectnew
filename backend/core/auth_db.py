import sqlite3, os, pathlib
from typing import Optional, Tuple, Dict, Any

DB_DIR = pathlib.Path(os.getenv("DB_DIR", "backend/data"))
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "auth.sqlite"

def _conn():
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def init():
    con = _conn()
    cur = con.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        password_hash TEXT,
        full_name TEXT,
        face_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    con.commit()
    con.close()

def create_user(email: str, username: str, password_hash: str, full_name: str) -> int:
    con = _conn()
    cur = con.cursor()
    cur.execute("INSERT INTO users(email, username, password_hash, full_name) VALUES(?,?,?,?)",
                (email, username, password_hash, full_name))
    con.commit()
    uid = cur.lastrowid
    con.close()
    return uid

def get_user_by_email(email: str) -> Optional[Tuple]:
    con = _conn()
    cur = con.cursor()
    cur.execute("SELECT id, email, username, password_hash, full_name, face_id FROM users WHERE email=?", (email,))
    row = cur.fetchone()
    con.close()
    return row

def get_user_by_username(username: str) -> Optional[Tuple]:
    con = _conn()
    cur = con.cursor()
    cur.execute("SELECT id, email, username, password_hash, full_name, face_id FROM users WHERE username=?", (username,))
    row = cur.fetchone()
    con.close()
    return row

def set_face_id(user_id: int, face_id: str) -> None:
    con = _conn()
    cur = con.cursor()
    cur.execute("UPDATE users SET face_id=? WHERE id=?", (face_id, user_id))
    con.commit()
    con.close()

def get_user_by_face_id(face_id: str) -> Optional[Tuple]:
    con = _conn()
    cur = con.cursor()
    cur.execute("SELECT id, email, username, password_hash, full_name, face_id FROM users WHERE face_id=?", (face_id,))
    row = cur.fetchone()
    con.close()
    return row
