import { useState } from "react";
import Icon from "@/components/ui/icon";

const MOCK_CHATS = [
  { id: 1, name: "Алексей Морозов", avatar: "АМ", lastMsg: "Привет! Как дела?", time: "14:32", unread: 3, online: true },
  { id: 2, name: "Мария Петрова", avatar: "МП", lastMsg: "Увидимся завтра 👋", time: "13:10", unread: 0, online: false },
  { id: 3, name: "Дмитрий Волков", avatar: "ДВ", lastMsg: "Отправил документы", time: "12:05", unread: 1, online: true },
  { id: 4, name: "Группа «Команда»", avatar: "КМ", lastMsg: "Встреча в 18:00", time: "11:45", unread: 7, online: false },
  { id: 5, name: "Анна Смирнова", avatar: "АС", lastMsg: "Спасибо большое!", time: "вчера", unread: 0, online: true },
  { id: 6, name: "Иван Козлов", avatar: "ИК", lastMsg: "Окей, понял 👍", time: "вчера", unread: 0, online: false },
];

const MOCK_MESSAGES: Record<number, { id: number; text: string; from: "me" | "other"; time: string }[]> = {
  1: [
    { id: 1, text: "Привет! Как дела?", from: "other", time: "14:30" },
    { id: 2, text: "Отлично! Работаю над новым проектом 🚀", from: "me", time: "14:31" },
    { id: 3, text: "Звучит интересно! Расскажи подробнее", from: "other", time: "14:32" },
  ],
  2: [
    { id: 1, text: "Привет! Ты свободна сегодня?", from: "me", time: "12:00" },
    { id: 2, text: "Нет, занята до вечера", from: "other", time: "12:05" },
    { id: 3, text: "Увидимся завтра 👋", from: "other", time: "13:10" },
  ],
  3: [
    { id: 1, text: "Дима, можешь прислать файлы?", from: "me", time: "11:50" },
    { id: 2, text: "Отправил документы", from: "other", time: "12:05" },
  ],
  4: [
    { id: 1, text: "Всем привет! Напоминаю: встреча в 18:00", from: "other", time: "11:40" },
    { id: 2, text: "Буду!", from: "me", time: "11:42" },
    { id: 3, text: "Встреча в 18:00", from: "other", time: "11:45" },
  ],
  5: [
    { id: 1, text: "Аня, спасибо за помощь вчера!", from: "me", time: "09:00" },
    { id: 2, text: "Спасибо большое!", from: "other", time: "09:15" },
  ],
  6: [
    { id: 1, text: "Иван, обновление прошло успешно", from: "me", time: "вчера" },
    { id: 2, text: "Окей, понял 👍", from: "other", time: "вчера" },
  ],
};

const MOCK_CONTACTS = [
  { id: 1, name: "Алексей Морозов", username: "@alex_morozov", online: true, blocked: false },
  { id: 2, name: "Мария Петрова", username: "@masha_p", online: false, blocked: false },
  { id: 3, name: "Дмитрий Волков", username: "@dmitry_v", online: true, blocked: false },
  { id: 4, name: "Анна Смирнова", username: "@anna_s", online: true, blocked: false },
  { id: 5, name: "Иван Козлов", username: "@ivan_k", online: false, blocked: false },
  { id: 6, name: "Сергей Тёмный", username: "@dark_sergey", online: false, blocked: true },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "message", text: "Алексей написал вам сообщение", time: "14:32", read: false },
  { id: 2, type: "contact", text: "Мария Петрова добавила вас в контакты", time: "13:00", read: false },
  { id: 3, type: "system", text: "Ваш профиль просмотрели 5 человек", time: "12:00", read: true },
  { id: 4, type: "message", text: "Дмитрий отправил документ", time: "11:50", read: true },
  { id: 5, type: "system", text: "Добро пожаловать в Sphere!", time: "вчера", read: true },
];

const avatarColors: Record<string, string> = {
  "АМ": "#4A90D9", "МП": "#E85D8C", "ДВ": "#5CAD6E",
  "КМ": "#F0A030", "АС": "#9B59B6", "ИК": "#E67E22",
};

type Tab = "chats" | "contacts" | "profile" | "settings" | "search" | "notifications";

function Avatar({ initials, size = 40, online = false }: { initials: string; size?: number; online?: boolean }) {
  const color = avatarColors[initials] || "#aab";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-semibold text-white select-none"
        style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
      >
        {initials}
      </div>
      {online && (
        <div
          className="absolute bottom-0 right-0 rounded-full border-2 border-white"
          style={{ width: size * 0.28, height: size * 0.28, background: "#4CAF50" }}
        />
      )}
    </div>
  );
}

function ContactItem({
  contact,
  onBlock,
}: {
  contact: typeof MOCK_CONTACTS[0];
  onBlock: () => void;
}) {
  const initials = contact.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors group ${contact.blocked ? "opacity-50" : ""}`}>
      <Avatar initials={initials} size={40} online={contact.online && !contact.blocked} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--text-main)]">{contact.name}</p>
        <p className="text-[12px] text-[var(--text-muted)]">{contact.username}</p>
      </div>
      {contact.blocked && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-medium">заблок.</span>
      )}
      <button
        onClick={onBlock}
        className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-red-100 hover:text-red-500 transition-all"
      >
        <Icon name={contact.blocked ? "UserCheck" : "UserX"} size={15} />
      </button>
    </div>
  );
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [openChat, setOpenChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBlockModal, setShowBlockModal] = useState<number | null>(null);

  const activeChat = MOCK_CHATS.find((c) => c.id === openChat);
  const chatMessages = openChat ? messages[openChat] || [] : [];

  function sendMessage() {
    if (!message.trim() || !openChat) return;
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages((prev) => ({
      ...prev,
      [openChat]: [
        ...(prev[openChat] || []),
        { id: Date.now(), text: message.trim(), from: "me", time: timeStr },
      ],
    }));
    setMessage("");
  }

  function toggleBlock(id: number) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, blocked: !c.blocked } : c)));
    setShowBlockModal(null);
  }

  const filteredChats = MOCK_CHATS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMsg.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems: { tab: Tab; icon: string; label: string }[] = [
    { tab: "chats", icon: "MessageCircle", label: "Чаты" },
    { tab: "contacts", icon: "Users", label: "Контакты" },
    { tab: "search", icon: "Search", label: "Поиск" },
    { tab: "notifications", icon: "Bell", label: "Уведомления" },
    { tab: "profile", icon: "User", label: "Профиль" },
    { tab: "settings", icon: "Settings", label: "Настройки" },
  ];

  const unreadNotif = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  const totalUnread = MOCK_CHATS.reduce((acc, c) => acc + c.unread, 0);

  return (
    <div className="sphere-app flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[68px] flex flex-col items-center py-5 gap-1 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-[var(--accent-blue)] flex items-center justify-center mb-4 flex-shrink-0 shadow-md">
          <span className="text-white font-bold text-lg leading-none">S</span>
        </div>
        {navItems.map(({ tab, icon, label }) => {
          const isActive = activeTab === tab;
          const badge =
            tab === "notifications" ? unreadNotif : tab === "chats" ? totalUnread : 0;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setOpenChat(null); }}
              title={label}
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200
                ${isActive
                  ? "bg-[var(--accent-blue)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]"
                }`}
            >
              <Icon name={icon} size={20} />
              {badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* List Panel */}
      <div className="w-[300px] flex flex-col bg-[var(--bg-panel)] border-r border-[var(--border-color)] flex-shrink-0">
        <div className="px-4 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-[15px] font-semibold text-[var(--text-main)] mb-3">
            {activeTab === "chats" && "Сообщения"}
            {activeTab === "contacts" && "Контакты"}
            {activeTab === "search" && "Поиск"}
            {activeTab === "notifications" && "Уведомления"}
            {activeTab === "profile" && "Мой профиль"}
            {activeTab === "settings" && "Настройки"}
          </h2>
          {(activeTab === "chats" || activeTab === "contacts" || activeTab === "search") && (
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[var(--bg-input)] text-[12.5px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* CHATS */}
          {activeTab === "chats" && (
            <div className="py-1">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setOpenChat(chat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors duration-150 text-left
                    ${openChat === chat.id ? "bg-[var(--bg-active)]" : "hover:bg-[var(--bg-hover)]"}`}
                >
                  <Avatar initials={chat.avatar} size={44} online={chat.online} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[13px] font-semibold text-[var(--text-main)] truncate">{chat.name}</span>
                      <span className="text-[11px] text-[var(--text-muted)] flex-shrink-0 ml-2">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text-muted)] truncate">{chat.lastMsg}</span>
                      {chat.unread > 0 && (
                        <span className="ml-2 min-w-[20px] h-5 rounded-full bg-[var(--accent-blue)] text-white text-[10px] font-bold flex items-center justify-center px-1.5 flex-shrink-0 leading-none">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* CONTACTS */}
          {activeTab === "contacts" && (
            <div className="py-1">
              {contacts.filter((c) => c.blocked).length > 0 && (
                <>
                  <div className="px-4 py-2">
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Черный список</span>
                  </div>
                  {contacts.filter((c) => c.blocked).map((contact) => (
                    <ContactItem key={contact.id} contact={contact} onBlock={() => setShowBlockModal(contact.id)} />
                  ))}
                  <div className="h-px bg-[var(--border-color)] mx-4 my-1" />
                </>
              )}
              <div className="px-4 py-2">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Все контакты</span>
              </div>
              {filteredContacts.filter((c) => !c.blocked).map((contact) => (
                <ContactItem key={contact.id} contact={contact} onBlock={() => setShowBlockModal(contact.id)} />
              ))}
            </div>
          )}

          {/* SEARCH */}
          {activeTab === "search" && (
            <div className="py-1">
              {searchQuery.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 text-[var(--text-muted)]">
                  <Icon name="Search" size={32} className="mb-3 opacity-20" />
                  <p className="text-[13px]">Введите имя или текст</p>
                </div>
              ) : (
                <>
                  {filteredChats.length > 0 && (
                    <>
                      <div className="px-4 py-2">
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Чаты</span>
                      </div>
                      {filteredChats.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => { setOpenChat(chat.id); setActiveTab("chats"); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
                        >
                          <Avatar initials={chat.avatar} size={40} online={chat.online} />
                          <div>
                            <p className="text-[13px] font-semibold text-[var(--text-main)]">{chat.name}</p>
                            <p className="text-[12px] text-[var(--text-muted)] truncate">{chat.lastMsg}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  {filteredContacts.length > 0 && (
                    <>
                      <div className="px-4 py-2 mt-1">
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Контакты</span>
                      </div>
                      {filteredContacts.map((contact) => (
                        <ContactItem key={contact.id} contact={contact} onBlock={() => setShowBlockModal(contact.id)} />
                      ))}
                    </>
                  )}
                  {filteredChats.length === 0 && filteredContacts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-52 text-[var(--text-muted)]">
                      <p className="text-[13px]">Ничего не найдено</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div>
              {MOCK_NOTIFICATIONS.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--border-color)] ${!notif.read ? "bg-blue-50/50" : ""}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.type === "message" ? "bg-blue-100 text-[var(--accent-blue)]" :
                    notif.type === "contact" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                  }`}>
                    <Icon
                      name={notif.type === "message" ? "MessageCircle" : notif.type === "contact" ? "UserPlus" : "Info"}
                      size={15}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12.5px] leading-relaxed ${!notif.read ? "text-[var(--text-main)] font-medium" : "text-[var(--text-muted)]"}`}>
                      {notif.text}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{notif.time}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] mt-1.5 flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <div className="p-5">
              <div className="flex flex-col items-center mb-5">
                <div className="w-20 h-20 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
                  ВА
                </div>
                <h3 className="text-[15px] font-semibold text-[var(--text-main)]">Владимир Андреев</h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">@vladimir_a</p>
                <div className="mt-2 px-3 py-1 rounded-full bg-green-100 text-green-600 text-[11px] font-medium">
                  В сети
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Имя", value: "Владимир Андреев" },
                  { label: "Ник", value: "@vladimir_a" },
                  { label: "Телефон", value: "+7 (999) 123-45-67" },
                  { label: "О себе", value: "Люблю хорошие разговоры ☕" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-[var(--bg-input)] px-4 py-3">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-[13px] text-[var(--text-main)]">{value}</p>
                  </div>
                ))}
                <button className="w-full py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-[13px] font-semibold hover:opacity-90 transition mt-1">
                  Редактировать профиль
                </button>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="p-3 space-y-1">
              {[
                { icon: "Bell", label: "Уведомления", desc: "Звуки и оповещения" },
                { icon: "Lock", label: "Приватность", desc: "Кто видит ваш профиль" },
                { icon: "Shield", label: "Безопасность", desc: "Двухфакторная аутентификация" },
                { icon: "Palette", label: "Оформление", desc: "Тема и шрифты" },
                { icon: "Globe", label: "Язык", desc: "Русский" },
                { icon: "HelpCircle", label: "Помощь", desc: "FAQ и поддержка" },
                { icon: "LogOut", label: "Выйти", desc: "Завершить сессию", danger: true },
              ].map(({ icon, label, desc, danger }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-left"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-100" : "bg-[var(--bg-input)]"}`}>
                    <Icon name={icon} size={16} className={danger ? "text-red-500" : "text-[var(--text-muted)]"} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[13px] font-medium ${danger ? "text-red-500" : "text-[var(--text-main)]"}`}>{label}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{desc}</p>
                  </div>
                  {!danger && <Icon name="ChevronRight" size={14} className="text-[var(--text-muted)]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat / Empty State */}
      <div className="flex-1 flex flex-col bg-[var(--bg-app)] min-w-0">
        {openChat && activeChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-[var(--bg-panel)] border-b border-[var(--border-color)]">
              <Avatar initials={activeChat.avatar} size={38} online={activeChat.online} />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[var(--text-main)]">{activeChat.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {activeChat.online ? "в сети" : "был(а) давно"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-hover)] transition text-[var(--text-muted)]">
                  <Icon name="Phone" size={17} />
                </button>
                <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-hover)] transition text-[var(--text-muted)]">
                  <Icon name="Video" size={17} />
                </button>
                <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-hover)] transition text-[var(--text-muted)]">
                  <Icon name="MoreVertical" size={17} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[68%] px-3.5 py-2 text-[13.5px] leading-relaxed
                      ${msg.from === "me"
                        ? "bg-[var(--accent-blue)] text-white rounded-2xl rounded-br-md"
                        : "bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-color)] rounded-2xl rounded-bl-md"
                      }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-0.5 text-right ${msg.from === "me" ? "text-blue-200" : "text-[var(--text-muted)]"}`}>
                      {msg.time}{msg.from === "me" && " ✓✓"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-[var(--bg-panel)] border-t border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition">
                  <Icon name="Paperclip" size={17} />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Написать сообщение..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--bg-input)] text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition"
                />
                <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition">
                  <Icon name="Smile" size={17} />
                </button>
                <button
                  onClick={sendMessage}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                    message.trim()
                      ? "bg-[var(--accent-blue)] text-white hover:opacity-90"
                      : "bg-[var(--bg-input)] text-[var(--text-muted)]"
                  }`}
                >
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
            <p className="text-[13px]">Начните общение с кем-нибудь</p>
          </div>
        )}
      </div>

      {/* Block Modal */}
      {showBlockModal !== null && (() => {
        const c = contacts.find((x) => x.id === showBlockModal);
        if (!c) return null;
        const initials = c.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowBlockModal(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 w-[300px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar initials={initials} size={40} />
                <div>
                  <p className="text-[14px] font-semibold text-[var(--text-main)]">{c.name}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{c.username}</p>
                </div>
              </div>
              <p className="text-[13px] text-[var(--text-muted)] mb-5 leading-relaxed">
                {c.blocked
                  ? `Разблокировать ${c.name}? Пользователь снова сможет писать вам.`
                  : `Заблокировать ${c.name}? Пользователь не сможет отправлять вам сообщения.`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBlockModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-[13px] font-medium text-gray-600 hover:bg-gray-200 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={() => toggleBlock(c.id)}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition ${
                    c.blocked ? "bg-green-500 hover:opacity-90" : "bg-red-500 hover:opacity-90"
                  }`}
                >
                  {c.blocked ? "Разблокировать" : "Заблокировать"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
