import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";
import { Tab, User, Chat, Message, Avatar, fmtTime } from "./types.tsx";

interface SidebarProps {
  me: User;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  chats: Chat[];
  openChatId: number | null;
  setOpenChatId: (id: number | null) => void;
  totalUnread: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: User[];
  blockedUsers: User[];
  setShowBlockModal: (user: User | null) => void;
  onStartChat: (userId: number) => void;
  onUnblock: (user: User) => void;
  onLogout: () => void;
  editProfile: boolean;
  setEditProfile: (v: boolean) => void;
  editName: string;
  setEditName: (v: string) => void;
  editBio: string;
  setEditBio: (v: string) => void;
  onSaveProfile: () => void;
}

export default function Sidebar({
  me, activeTab, setActiveTab, chats, openChatId, setOpenChatId,
  totalUnread, searchQuery, setSearchQuery, searchResults, blockedUsers,
  setShowBlockModal, onStartChat, onUnblock, onLogout,
  editProfile, setEditProfile, editName, setEditName, editBio, setEditBio, onSaveProfile,
}: SidebarProps) {

  const navItems: { tab: Tab; icon: string; label: string }[] = [
    { tab: "chats", icon: "MessageCircle", label: "Чаты" },
    { tab: "contacts", icon: "ShieldOff", label: "Контакты" },
    { tab: "search", icon: "Search", label: "Поиск" },
    { tab: "profile", icon: "User", label: "Профиль" },
    { tab: "settings", icon: "Settings", label: "Настройки" },
  ];

  return (
    <>
      {/* Nav sidebar */}
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
              {badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* List panel */}
      <div className="w-[300px] flex flex-col bg-[var(--bg-panel)] border-r border-[var(--border-color)] flex-shrink-0">
        <div className="px-4 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-[15px] font-semibold text-[var(--text-main)] mb-3">
            {activeTab === "chats" && "Сообщения"}
            {activeTab === "contacts" && "Чёрный список"}
            {activeTab === "search" && "Найти людей"}
            {activeTab === "profile" && "Мой профиль"}
            {activeTab === "settings" && "Настройки"}
          </h2>
          {activeTab === "search" && (
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
                      {chat.unread > 0 && (
                        <span className="ml-2 min-w-[20px] h-5 rounded-full bg-[var(--accent-blue)] text-white text-[10px] font-bold flex items-center justify-center px-1.5 flex-shrink-0">
                          {chat.unread}
                        </span>
                      )}
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
                    <button onClick={() => onStartChat(user.id)}
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
                    <button onClick={() => onUnblock(user)}
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
                  {[
                    { label: "Имя", value: me.display_name },
                    { label: "Username", value: "@" + me.username },
                    { label: "О себе", value: me.bio || "Не указано" },
                  ].map(({ label, value }) => (
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
                    <button onClick={onSaveProfile} className="flex-1 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-[13px] font-semibold hover:opacity-90 transition">Сохранить</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="p-3 space-y-1">
              {[
                { icon: "Bell", label: "Уведомления", desc: "Звуки и оповещения", action: undefined as (() => void) | undefined },
                { icon: "Lock", label: "Приватность", desc: "Кто видит ваш профиль", action: undefined as (() => void) | undefined },
                { icon: "Shield", label: "Безопасность", desc: "Двухфакторная аутентификация", action: undefined as (() => void) | undefined },
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
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left mt-3">
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
    </>
  );
}
