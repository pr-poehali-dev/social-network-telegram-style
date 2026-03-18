"""
Пользователи: поиск, профиль, блокировка, обновление профиля.
GET /users/search?q=... — поиск пользователей по username/display_name
GET /users/{id} — профиль пользователя
PUT /users/me — обновить свой профиль
POST /users/{id}/block — заблокировать пользователя
POST /users/{id}/unblock — разблокировать
GET /users/blocked — список заблокированных
"""
import json
import os
import psycopg2
import re
import datetime

S = "t_p15862673_social_network_teleg"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def get_user(cur, token):
    if not token:
        return None
    cur.execute(f"SELECT id, username, display_name, bio FROM {S}.users WHERE session_token = %s", (token,))
    row = cur.fetchone()
    return {"id": row[0], "username": row[1], "display_name": row[2], "bio": row[3] or ""} if row else None

def is_online(online_at):
    if not online_at:
        return False
    now = datetime.datetime.now(datetime.timezone.utc)
    dt = online_at.replace(tzinfo=datetime.timezone.utc) if online_at.tzinfo is None else online_at
    return (now - dt).total_seconds() < 120

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    token = headers.get("X-Session-Token") or headers.get("x-session-token")
    qs = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Неверный JSON")

    conn = get_conn()
    cur = conn.cursor()

    try:
        me = get_user(cur, token)
        if not me:
            return err("Не авторизован", 401)

        # GET /users/search
        if re.match(r'^.*/users/search$', path) and method == "GET":
            q = (qs.get("q") or "").strip()
            if len(q) < 2:
                return ok({"users": []})
            like = f"%{q.lower()}%"
            cur.execute(f"""
                SELECT id, username, display_name, bio, online_at FROM {S}.users
                WHERE id != %s AND (LOWER(username) LIKE %s OR LOWER(display_name) LIKE %s)
                LIMIT 20
            """, (me["id"], like, like))
            rows = cur.fetchall()
            cur.execute(f"SELECT blocked_id FROM {S}.blocked_users WHERE blocker_id = %s", (me["id"],))
            blocked_ids = {r[0] for r in cur.fetchall()}
            users = [
                {"id": r[0], "username": r[1], "display_name": r[2], "bio": r[3] or "", "online": is_online(r[4])}
                for r in rows if r[0] not in blocked_ids
            ]
            return ok({"users": users})

        # GET /users/blocked
        if re.match(r'^.*/users/blocked$', path) and method == "GET":
            cur.execute(f"""
                SELECT u.id, u.username, u.display_name FROM {S}.users u
                JOIN {S}.blocked_users b ON b.blocked_id = u.id WHERE b.blocker_id = %s
            """, (me["id"],))
            rows = cur.fetchall()
            return ok({"users": [{"id": r[0], "username": r[1], "display_name": r[2]} for r in rows]})

        # PUT /users/me
        if re.match(r'^.*/users/me$', path) and method == "PUT":
            display_name = (body.get("display_name") or "").strip()
            bio = (body.get("bio") or "").strip()
            if not display_name:
                return err("display_name обязателен")
            cur.execute(f"UPDATE {S}.users SET display_name=%s, bio=%s WHERE id=%s", (display_name, bio, me["id"]))
            conn.commit()
            return ok({"ok": True, "user": {"id": me["id"], "username": me["username"], "display_name": display_name, "bio": bio}})

        # POST /users/{id}/block
        m = re.match(r'^.*/users/(\d+)/block$', path)
        if m and method == "POST":
            target_id = int(m.group(1))
            if target_id == me["id"]:
                return err("Нельзя заблокировать себя")
            cur.execute(f"INSERT INTO {S}.blocked_users (blocker_id, blocked_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (me["id"], target_id))
            conn.commit()
            return ok({"ok": True})

        # POST /users/{id}/unblock
        m = re.match(r'^.*/users/(\d+)/unblock$', path)
        if m and method == "POST":
            target_id = int(m.group(1))
            cur.execute(f"DELETE FROM {S}.blocked_users WHERE blocker_id=%s AND blocked_id=%s", (me["id"], target_id))
            conn.commit()
            return ok({"ok": True})

        # GET /users/{id}
        m = re.match(r'^.*/users/(\d+)$', path)
        if m and method == "GET":
            uid = int(m.group(1))
            cur.execute(f"SELECT id, username, display_name, bio, online_at FROM {S}.users WHERE id=%s", (uid,))
            row = cur.fetchone()
            if not row:
                return err("Пользователь не найден", 404)
            cur.execute(f"SELECT 1 FROM {S}.blocked_users WHERE blocker_id=%s AND blocked_id=%s", (me["id"], uid))
            blocked = bool(cur.fetchone())
            return ok({"user": {"id": row[0], "username": row[1], "display_name": row[2], "bio": row[3] or "", "online": is_online(row[4]), "blocked": blocked}})

        return err("Не найдено", 404)
    finally:
        cur.close()
        conn.close()
