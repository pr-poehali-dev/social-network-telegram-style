
CREATE TABLE IF NOT EXISTS t_p15862673_social_network_teleg.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(32) UNIQUE NOT NULL,
  display_name VARCHAR(64) NOT NULL,
  phone VARCHAR(20),
  bio TEXT DEFAULT '',
  password_hash VARCHAR(256) NOT NULL,
  session_token VARCHAR(128),
  online_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p15862673_social_network_teleg.chats (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p15862673_social_network_teleg.chat_members (
  chat_id INTEGER REFERENCES t_p15862673_social_network_teleg.chats(id),
  user_id INTEGER REFERENCES t_p15862673_social_network_teleg.users(id),
  PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS t_p15862673_social_network_teleg.messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES t_p15862673_social_network_teleg.chats(id),
  sender_id INTEGER REFERENCES t_p15862673_social_network_teleg.users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_p15862673_social_network_teleg.blocked_users (
  blocker_id INTEGER REFERENCES t_p15862673_social_network_teleg.users(id),
  blocked_id INTEGER REFERENCES t_p15862673_social_network_teleg.users(id),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON t_p15862673_social_network_teleg.messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON t_p15862673_social_network_teleg.chat_members(user_id);
