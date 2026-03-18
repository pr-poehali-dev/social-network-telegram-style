"""
Авторизация: регистрация, вход, выход, проверка сессии.
POST /register — регистрация с уникальным username
POST /login — вход по username + password
POST /logout — выход
GET /me — получить текущего пользователя по токену
"""
import json
import os
import hashlib
import secrets
import re
import psycopg2

S = "t_p15862673_social_network_teleg"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def ok(data: dict, status: int = 200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg: str, status: int = 400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Неверный JSON")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # --- REGISTER ---
        if path.endswith("/register") and method == "POST":
            username = (body.get("username") or "").strip().lower()
            display_name = (body.get("display_name") or "").strip()
            password = body.get("password") or ""
            phone = (body.get("phone") or "").strip()

            if not username or not display_name or not password:
                return err("username, display_name и password обязательны")
            if not re.match(r'^[a-z0-9_]{3,32}$', username):
                return err("username: 3-32 символа, только a-z, 0-9, _")
            if len(password) < 6:
                return err("Пароль минимум 6 символов")

            cur.execute(f"SELECT id FROM {S}.users WHERE username = %s", (username,))
            if cur.fetchone():
                return err("Этот username уже занят")

            token = secrets.token_hex(32)
            ph = hash_password(password)
            cur.execute(
                f"INSERT INTO {S}.users (username, display_name, phone, password_hash, session_token) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (username, display_name, phone, ph, token)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            return ok({"token": token, "user": {"id": user_id, "username": username, "display_name": display_name, "phone": phone, "bio": ""}})

        # --- LOGIN ---
        if path.endswith("/login") and method == "POST":
            username = (body.get("username") or "").strip().lower()
            password = body.get("password") or ""

            if not username or not password:
                return err("Введите username и пароль")

            ph = hash_password(password)
            cur.execute(f"SELECT id, username, display_name, phone, bio FROM {S}.users WHERE username = %s AND password_hash = %s", (username, ph))
            row = cur.fetchone()
            if not row:
                return err("Неверный username или пароль")

            token = secrets.token_hex(32)
            cur.execute(f"UPDATE {S}.users SET session_token = %s, online_at = NOW() WHERE id = %s", (token, row[0]))
            conn.commit()
            return ok({"token": token, "user": {"id": row[0], "username": row[1], "display_name": row[2], "phone": row[3] or "", "bio": row[4] or ""}})

        # --- ME ---
        if path.endswith("/me") and method == "GET":
            token = (event.get("headers") or {}).get("X-Session-Token") or (event.get("headers") or {}).get("x-session-token")
            if not token:
                return err("Не авторизован", 401)
            cur.execute(f"SELECT id, username, display_name, phone, bio FROM {S}.users WHERE session_token = %s", (token,))
            row = cur.fetchone()
            if not row:
                return err("Сессия недействительна", 401)
            cur.execute(f"UPDATE {S}.users SET online_at = NOW() WHERE id = %s", (row[0],))
            conn.commit()
            return ok({"user": {"id": row[0], "username": row[1], "display_name": row[2], "phone": row[3] or "", "bio": row[4] or ""}})

        # --- LOGOUT ---
        if path.endswith("/logout") and method == "POST":
            token = (event.get("headers") or {}).get("X-Session-Token") or (event.get("headers") or {}).get("x-session-token")
            if token:
                cur.execute(f"UPDATE {S}.users SET session_token = NULL WHERE session_token = %s", (token,))
                conn.commit()
            return ok({"ok": True})

        return err("Не найдено", 404)
    finally:
        cur.close()
        conn.close()
