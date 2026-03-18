import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";

type Tab = "chats" | "contacts" | "profile" | "settings" | "search";

interface User { id: number; username: string; display_name: string; bio?: string; phone?: string; online?: boolean; blocked?: boolean; }
interface Chat { id: number; partner: User; online: boolean; last_msg: string; last_time: string | null; unread: number; }
interface Message { id: number; text: string; sender_id: number; sender_name: string; created_at: string; is_read: boolean; }

const avatarPalette = ["#4A90D9","#E85D8C","#5CAD6E","#F0A030","#9B59B6","#E67E22","#1ABC9C","#E74C3C","#3498DB","#8E44AD"];
function getColor(str: string) { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % avatarPalette.length; return avatarPalette[h]; }
function initials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??"; }
function fmtTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
  return "вчера";
}

function Avatar({ name, size = 40, online = false }: { name: string; size?: number; online?: boolean }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div className="rounded-full flex items-center justify-center font-semibold text-white select-none"
        style={{ width: size, height: size, background: getColor(name), fontSize: size * 0.36 }}>
        {initials(name)}
      </div>
      {online && <div className="absolute bottom-0 right-0 rounded-full border-2 border-white"
        style={{ width: size * 0.28, height: size * 0.28, background: "#4CAF50" }} />}
    </div>
  );
}

function AuthScreen({ onAuth }: { onAuth: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = mode === "login"
        ? await api.login(username.trim(), password)
        : await api.register({ username: username.trim(), display_name: displayName.trim(), password });
      if (res.error) { setError(res.error); return; }
      onAuth(res.user, res.token);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sphere-app flex items-center justify-center min-h-screen bg-[var(--bg-app)]">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-[var(--accent-blue)] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">Sphere</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">Общайся с реальными людьми</p>
        </div>
        <div className="bg-[var(--bg-panel)] rounded-2xl p-6 shadow-sm border border-[var(--border-color)]">
          <div className="flex rounded-xl bg-[var(--bg-app)] p-1 mb-5">
            {(["login","register"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-all ${mode === m ? "bg-white text-[var(--text-main)] shadow-sm" : "text-[var(--text-muted)]"}`}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {mode === "register" && (
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Имя и фамилия"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-app)] text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition" />
            )}
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="username (a-z, 0-9, _)"
              onKeyDown={e => e.key === "Enter" && submit()}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-app)] text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Пароль (мин. 6 символов)"
              onKeyDown={e => e.key === "Enter" && submit()}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-app)] text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition" />
          </div>
          {error && <p className="text-[12px] text-red-500 mt-3 text-center">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full mt-5 py-3 rounded-xl bg-[var(--accent-blue)] text-white text-[13px] font-semibold hover:opacity-90 transition disabled:opacity-50">
            {loading ? "..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [me, setMe] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [chats, setChats] = useState<Chat[]>([]);
  const [openChatId, setOpenChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [showBlockModal, setShowBlockModal] = useState<User | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("sphere_token");
    if (!token) { setAuthChecked(true); return; }
    api.me().then(res => {
      if (res.user) setMe(res.user);
      else localStorage.removeItem("sphere_token");
      setAuthChecked(true);
    });
  }, []);

  const loadChats = useCallback(async () => {
    const res = await api.getChats();
    if (res.chats) setChats(res.chats);
  }, []);

  useEffect(() => {
    if (!me) return;
    loadChats();
    const t = setInterval(loadChats, 5000);
    return () => clearInterval(t);
  }, [me, loadChats]);

  const loadMessages = useCallback(async (chatId: number) => {
    setLoadingMsg(true);
    const res = await api.getMessages(chatId);
    if (res.messages) setMessages(res.messages);
    api.markRead(chatId);
    setLoadingMsg(false);
  }, []);

  useEffect(() => {
    if (openChatId) loadMessages(openChatId);
  }, [openChatId, loadMessages]);

  useEffect(() => {
    if (!openChatId) return;
    const t = setInterval(() => loadMessages(openChatId), 3000);
    return () => clearInterval(t);
  }, [openChatId, loadMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const res = await api.searchUsers(searchQuery);
      if (res.users) setSearchResults(res.users);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === "contacts" && me) {
      api.getBlocked().then(res => { if (res.users) setBlockedUsers(res.users); });
    }
  }, [activeTab, me]);

  async function sendMessage() {
    if (!message.trim() || !openChatId) return;
    const text = message.trim();
    setMessage("");
    await api.sendMessage(openChatId, text);
    await loadMessages(openChatId);
    loadChats();
  }

  async function startChat(userId: number) {
    const res = await api.createChat(userId);
    if (res.chat_id) {
      setOpenChatId(res.chat_id);
      setActiveTab("chats");
      loadChats();
    }
  }

  async function doBlock(user: User) {
    await api.blockUser(user.id);
    setBlockedUsers(prev => [...prev, user]);
    setShowBlockModal(null);
  }

  async function doUnblock(user: User) {
    await api.unblockUser(user.id);
    setBlockedUsers(prev => prev.filter(u => u.id !== user.id));
    setShowBlockModal(null);
  }

  async function saveProfile() {
    const res = await api.updateMe({ display_name: editName, bio: editBio });
    if (res.user) { setMe(prev => prev ? { ...prev, ...res.user } : res.user); setEditProfile(false); }
  }

  async function logout() {
    await api.logout();
    localStorage.removeItem("sphere_token");
    setMe(null); setChats([]); setMessages([]);
  }

  const openChat_ = chats.find(c => c.id === openChatId);
  const totalUnread = chats.reduce((a, c) => a + c.unread, 0);

  const navItems: { tab: Tab; icon: string; label: string }[] = [
    { tab: "chats", icon: "MessageCircle", label: "Чаты" },
    { tab: "contacts", icon: "ShieldOff", label: "Контакты" },
    { tab: "search", icon: "Search", label: "Поиск" },
    { tab: "profile", icon: "User", label: "Профиль" },
    { tab: "settings", icon: "Settings", label: "Настройки" },
  ];

  if (!authChecked) {
    return (
      <div className="sphere-app flex items-center justify-center h-screen bg-[var(--bg-app)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!me) {
    return <AuthScreen onAuth={(user, token) => { localStorage.setItem("sphere_token", token); setMe(user); }} />;
  }

  return (
    <div className="sphere-app flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[68px] flex flex-col items-center py-5 gap-1 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-[var(--accent-blue)] flex items-center justify-center mb-4 shadow-md flex-shrink-0">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        {navItems.map(({ tab, icon, label }) => {
          const isActive = activeTab === tab;
          const badge = tab === "chats" ? totalUnread : 0;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} title={label}
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${isActive ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]"}`}>
              <Icon name={icon} size={20} />
              {badge > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">{badge > 99 ? "99+" : badge}</span>}
            </button>
          );
        })}
      </aside>

      {/* List Panel */}
      <div className="w-[300px] flex flex-col bg-[var(--bg-panel)] border-r border-[var(--border-color)] flex-shrink-0">
        <div className="px-4 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-[15px] font-semibold text-[var(--text-main)] mb-3">
            {activeTab === "chats" && "Сообщения"}
            {activeTab === "contacts" && "Чёрный список"}
            {activeTab === "search" && "Найти людей"}
            {activeTab === "profile" && "Мой профиль"}
            {activeTab === "settings" && "Настройки"}
          </h2>
          {(activeTab === "search") && (
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" placeholder="Поиск по username или имени..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[var(--bg-input)] text-[12.5px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* CHATS */}
          {activeTab === "chats" && (
            <div className="py-1">
              {chats.length === 0 && (
                <div className="flex flex-col items-center justify-center h-52 text-[var(--text-muted)]">
                  <Icon name="MessageCircle" size={32} className="mb-3 opacity-20" />
                  <p className="text-[13px] mb-2">Нет чатов</p>
                  <button onClick={() => setActiveTab("search")} className="text-[12px] text-[var(--accent-blue)] font-medium">Найти людей</button>
                </div>
              )}
              {chats.map(chat => (
                <button key={chat.id} onClick={() => setOpenChatId(chat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${openChatId === chat.id ? "bg-[var(--bg-active)]" : "hover:bg-[var(--bg-hover)]"}`}>
                  <Avatar name={chat.partner.display_name} size={44} online={chat.online} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[13px] font-semibold text-[var(--text-main)] truncate">{chat.partner.display_name}</span>
                      <span className="text-[11px] text-[var(--text-muted)] flex-shrink-0 ml-2">{fmtTime(chat.last_time)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text-muted)] truncate">{chat.last_msg || "Начните общение"}</span>
                      {chat.unread > 0 && <span className="ml-2 min-w-[20px] h-5 rounded-full bg-[var(--accent-blue)] text-white text-[10px] font-bold flex items-center justify-center px-1.5 flex-shrink-0">{chat.unread}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* SEARCH */}
          {activeTab === "search" && (
            <div className="py-1">
              {searchQuery.length < 2 ? (
                <div className="flex flex-col items-center justify-center h-52 text-[var(--text-muted)]">
                  <Icon name="Users" size={32} className="mb-3 opacity-20" />
                  <p className="text-[13px]">Введите минимум 2 символа</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 text-[var(--text-muted)]">
                  <p className="text-[13px]">Никого не найдено</p>
                </div>
              ) : (
                searchResults.map(user => (
                  <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors group">
                    <Avatar name={user.display_name} size={42} online={user.online} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text-main)]">{user.display_name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">@{user.username}{user.online ? " · в сети" : ""}</p>
                    </div>
                    <button onClick={() => startChat(user.id)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-lg bg-[var(--accent-blue)] text-white text-[11px] font-medium transition-all">
                      Написать
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CONTACTS / BLACK LIST */}
          {activeTab === "contacts" && (
            <div className="py-1">
              {blockedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 text-[var(--text-muted)]">
                  <Icon name="ShieldCheck" size={32} className="mb-3 opacity-20" />
                  <p className="text-[13px]">Список пуст</p>
                </div>
              ) : (
                blockedUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3 px-4 py-3 opacity-60 group hover:bg-[var(--bg-hover)] transition-colors">
                    <Avatar name={user.display_name} size={40} />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[var(--text-main)]">{user.display_name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">@{user.username}</p>
                    </div>
                    <button onClick={() => setShowBlockModal({ ...user, blocked: true })}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-lg text-green-600 hover:bg-green-50 text-[11px] font-medium transition-all">
                      Разблок.
                    </button>
                  </div>
                ))
              )}
              <div className="px-4 py-3 text-center">
                <button onClick={() => setActiveTab("search")} className="text-[12px] text-[var(--accent-blue)]">Найти людей для общения</button>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <div className="p-5">
              <div className="flex flex-col items-center mb-5">
                <Avatar name={me.display_name} size={72} />
                <h3 className="text-[15px] font-semibold text-[var(--text-main)] mt-3">{me.display_name}</h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">@{me.username}</p>
                <div className="mt-2 px-3 py-1 rounded-full bg-green-100 text-green-600 text-[11px] font-medium">В сети</div>
              </div>
              {!editProfile ? (
                <div className="space-y-2">
                  {[{ label: "Имя", value: me.display_name }, { label: "Username", value: "@" + me.username }, { label: "О себе", value: me.bio || "Не указано" }].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-[var(--bg-input)] px-4 py-3">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="text-[13px] text-[var(--text-main)]">{value}</p>
                    </div>
                  ))}
                  <button onClick={() => { setEditName(me.display_name); setEditBio(me.bio || ""); setEditProfile(true); }}
                    className="w-full py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-[13px] font-semibold hover:opacity-90 transition mt-1">
                    Редактировать
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Имя"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] text-[13px] text-[var(--text-main)] outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition" />
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="О себе" rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] text-[13px] text-[var(--text-main)] outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setEditProfile(false)} className="flex-1 py-2.5 rounded-xl bg-[var(--bg-input)] text-[13px] font-medium text-[var(--text-muted)]">Отмена</button>
                    <button onClick={saveProfile} className="flex-1 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-[13px] font-semibold hover:opacity-90 transition">Сохранить</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="p-3 space-y-1">
              {[
                { icon: "Bell", label: "Уведомления", desc: "Звуки и оповещения", action: undefined },
                { icon: "Lock", label: "Приватность", desc: "Кто видит ваш профиль", action: undefined },
                { icon: "Shield", label: "Безопасность", desc: "Двухфакторная аутентификация", action: undefined },
                { icon: "ShieldOff", label: "Чёрный список", desc: "Заблокированные пользователи", action: () => setActiveTab("contacts") },
              ].map(({ icon, label, desc, action }) => (
                <button key={label} onClick={action}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-left">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-input)] flex-shrink-0">
                    <Icon name={icon} size={16} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-[var(--text-main)]">{label}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{desc}</p>
                  </div>
                  <Icon name="ChevronRight" size={14} className="text-[var(--text-muted)]" />
                </button>
              ))}
              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left mt-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-100 flex-shrink-0">
                  <Icon name="LogOut" size={16} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-red-500">Выйти</p>
                  <p className="text-[11px] text-[var(--text-muted)]">@{me.username}</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-app)] min-w-0">
        {openChatId && openChat_ ? (
          <>
            <div className="flex items-center gap-3 px-5 py-3 bg-[var(--bg-panel)] border-b border-[var(--border-color)]">
              <button onClick={() => setOpenChatId(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition text-[var(--text-muted)]">
                <Icon name="ArrowLeft" size={18} />
              </button>
              <Avatar name={openChat_.partner.display_name} size={38} online={openChat_.online} />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[var(--text-main)]">{openChat_.partner.display_name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">@{openChat_.partner.username} · {openChat_.online ? "в сети" : "не в сети"}</p>
              </div>
              <button onClick={() => setShowBlockModal(openChat_.partner)}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-hover)] transition text-[var(--text-muted)]" title="Заблокировать">
                <Icon name="ShieldOff" size={17} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
              {loadingMsg && <div className="text-center text-[12px] text-[var(--text-muted)] py-4">Загрузка...</div>}
              {messages.map(msg => {
                const isMe = msg.sender_id === me.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[68%] px-3.5 py-2 text-[13.5px] leading-relaxed ${isMe ? "bg-[var(--accent-blue)] text-white rounded-2xl rounded-br-md" : "bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-color)] rounded-2xl rounded-bl-md"}`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-0.5 text-right ${isMe ? "text-blue-200" : "text-[var(--text-muted)]"}`}>
                        {fmtTime(msg.created_at)}{isMe && " ✓✓"}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 bg-[var(--bg-panel)] border-t border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Написать сообщение..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--bg-input)] text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition" />
                <button onClick={sendMessage}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${message.trim() ? "bg-[var(--accent-blue)] text-white hover:opacity-90" : "bg-[var(--bg-input)] text-[var(--text-muted)]"}`}>
                  <Icon name="Send" size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <div className="w-20 h-20 rounded-3xl bg-[var(--bg-panel)] border border-[var(--border-color)] flex items-center justify-center mb-4 shadow-sm">
              <Icon name="MessageCircle" size={34} className="text-[var(--accent-blue)] opacity-50" />
            </div>
            <p className="text-[15px] font-semibold text-[var(--text-main)] mb-1">Выберите чат</p>
            <p className="text-[13px] mb-3">или найдите человека</p>
            <button onClick={() => setActiveTab("search")}
              className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-[13px] font-medium hover:opacity-90 transition">
              Найти людей
            </button>
          </div>
        )}
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowBlockModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-[300px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={showBlockModal.display_name} size={40} />
              <div>
                <p className="text-[14px] font-semibold text-[var(--text-main)]">{showBlockModal.display_name}</p>
                <p className="text-[12px] text-[var(--text-muted)]">@{showBlockModal.username}</p>
              </div>
            </div>
            <p className="text-[13px] text-[var(--text-muted)] mb-5 leading-relaxed">
              {showBlockModal.blocked
                ? `Разблокировать ${showBlockModal.display_name}?`
                : `Заблокировать ${showBlockModal.display_name}? Он не сможет писать вам.`}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowBlockModal(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-[13px] font-medium text-gray-600">Отмена</button>
              <button onClick={() => showBlockModal.blocked ? doUnblock(showBlockModal) : doBlock(showBlockModal)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition ${showBlockModal.blocked ? "bg-green-500" : "bg-red-500"}`}>
                {showBlockModal.blocked ? "Разблокировать" : "Заблокировать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
