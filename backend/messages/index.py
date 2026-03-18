"""
Сообщения и чаты: получить список чатов, создать чат, получить сообщения, отправить сообщение.
GET /chats — список всех чатов пользователя
POST /chats — создать или открыть чат с пользователем (по user_id)
GET /chats/{chat_id}/messages — сообщения чата
POST /chats/{chat_id}/messages — отправить сообщение
POST /chats/{chat_id}/read — отметить сообщения прочитанными
"""
import json
import os
import psycopg2
import re
import datetime

S = "t_p15862673_social_network_teleg"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    cur.execute(f"SELECT id, username, display_name FROM {S}.users WHERE session_token = %s", (token,))
    row = cur.fetchone()
    return {"id": row[0], "username": row[1], "display_name": row[2]} if row else None

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

        # GET /chats
        if re.match(r'^.*/chats$', path) and method == "GET":
            cur.execute(f"""
                SELECT c.id,
                       u.id, u.username, u.display_name,
                       u.online_at,
                       (SELECT text FROM {S}.messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg,
                       (SELECT created_at FROM {S}.messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_time,
                       (SELECT COUNT(*) FROM {S}.messages WHERE chat_id = c.id AND is_read = FALSE AND sender_id != %s) as unread
                FROM {S}.chats c
                JOIN {S}.chat_members cm ON cm.chat_id = c.id AND cm.user_id = %s
                JOIN {S}.chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id != %s
                JOIN {S}.users u ON u.id = cm2.user_id
                ORDER BY last_time DESC NULLS LAST
            """, (me["id"], me["id"], me["id"]))
            rows = cur.fetchall()
            chats = []
            for r in rows:
                chats.append({
                    "id": r[0],
                    "partner": {"id": r[1], "username": r[2], "display_name": r[3]},
                    "online": is_online(r[4]),
                    "last_msg": r[5] or "",
                    "last_time": r[6],
                    "unread": int(r[7]),
                })
            return ok({"chats": chats})

        # POST /chats — создать или найти личный чат
        if re.match(r'^.*/chats$', path) and method == "POST":
            partner_id = body.get("user_id")
            if not partner_id:
                return err("user_id обязателен")
            partner_id = int(partner_id)
            if partner_id == me["id"]:
                return err("Нельзя написать самому себе")

            cur.execute(f"SELECT 1 FROM {S}.blocked_users WHERE (blocker_id=%s AND blocked_id=%s) OR (blocker_id=%s AND blocked_id=%s)",
                        (me["id"], partner_id, partner_id, me["id"]))
            if cur.fetchone():
                return err("Нельзя написать этому пользователю")

            cur.execute(f"""
                SELECT c.id FROM {S}.chats c
                JOIN {S}.chat_members a ON a.chat_id = c.id AND a.user_id = %s
                JOIN {S}.chat_members b ON b.chat_id = c.id AND b.user_id = %s
            """, (me["id"], partner_id))
            row = cur.fetchone()
            if row:
                return ok({"chat_id": row[0]})

            cur.execute(f"INSERT INTO {S}.chats DEFAULT VALUES RETURNING id")
            chat_id = cur.fetchone()[0]
            cur.execute(f"INSERT INTO {S}.chat_members (chat_id, user_id) VALUES (%s, %s), (%s, %s)",
                        (chat_id, me["id"], chat_id, partner_id))
            conn.commit()
            return ok({"chat_id": chat_id})

        # GET /chats/{id}/messages
        m = re.match(r'^.*/chats/(\d+)/messages$', path)
        if m and method == "GET":
            chat_id = int(m.group(1))
            cur.execute(f"SELECT 1 FROM {S}.chat_members WHERE chat_id=%s AND user_id=%s", (chat_id, me["id"]))
            if not cur.fetchone():
                return err("Нет доступа", 403)
            cur.execute(f"""
                SELECT msg.id, msg.text, msg.sender_id, u.display_name, msg.created_at, msg.is_read
                FROM {S}.messages msg JOIN {S}.users u ON u.id = msg.sender_id
                WHERE msg.chat_id = %s ORDER BY msg.created_at ASC LIMIT 100
            """, (chat_id,))
            rows = cur.fetchall()
            msgs = [{"id": r[0], "text": r[1], "sender_id": r[2], "sender_name": r[3], "created_at": r[4], "is_read": r[5]} for r in rows]
            return ok({"messages": msgs, "my_id": me["id"]})

        # POST /chats/{id}/messages — отправить сообщение
        m = re.match(r'^.*/chats/(\d+)/messages$', path)
        if m and method == "POST":
            chat_id = int(m.group(1))
            text = (body.get("text") or "").strip()
            if not text:
                return err("Пустое сообщение")
            cur.execute(f"SELECT 1 FROM {S}.chat_members WHERE chat_id=%s AND user_id=%s", (chat_id, me["id"]))
            if not cur.fetchone():
                return err("Нет доступа", 403)
            cur.execute(f"INSERT INTO {S}.messages (chat_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
                        (chat_id, me["id"], text))
            row = cur.fetchone()
            conn.commit()
            return ok({"message": {"id": row[0], "text": text, "sender_id": me["id"], "created_at": row[1], "is_read": False}})

        # POST /chats/{id}/read
        m = re.match(r'^.*/chats/(\d+)/read$', path)
        if m and method == "POST":
            chat_id = int(m.group(1))
            cur.execute(f"UPDATE {S}.messages SET is_read=TRUE WHERE chat_id=%s AND sender_id!=%s AND is_read=FALSE",
                        (chat_id, me["id"]))
            conn.commit()
            return ok({"ok": True})

        return err("Не найдено", 404)
    finally:
        cur.close()
        conn.close()
