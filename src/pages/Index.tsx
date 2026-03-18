import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Tab, User, Chat, Message } from "@/components/messenger/types.tsx";
import AuthScreen from "@/components/messenger/AuthScreen";
import Sidebar from "@/components/messenger/Sidebar";
import { ChatArea, BlockModal } from "@/components/messenger/ChatArea";

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

  const openChat = chats.find(c => c.id === openChatId);
  const totalUnread = chats.reduce((a, c) => a + c.unread, 0);

  if (!authChecked) {
    return (
      <div className="sphere-app flex items-center justify-center h-screen bg-[var(--bg-app)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!me) {
    return (
      <AuthScreen onAuth={(user, token) => { localStorage.setItem("sphere_token", token); setMe(user); }} />
    );
  }

  return (
    <div className="sphere-app flex h-screen overflow-hidden">
      <Sidebar
        me={me}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        chats={chats}
        openChatId={openChatId}
        setOpenChatId={setOpenChatId}
        totalUnread={totalUnread}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        blockedUsers={blockedUsers}
        setShowBlockModal={setShowBlockModal}
        onStartChat={startChat}
        onUnblock={(user) => setShowBlockModal({ ...user, blocked: true })}
        onLogout={logout}
        editProfile={editProfile}
        setEditProfile={setEditProfile}
        editName={editName}
        setEditName={setEditName}
        editBio={editBio}
        setEditBio={setEditBio}
        onSaveProfile={saveProfile}
      />

      <div className="flex-1 flex flex-col bg-[var(--bg-app)] min-w-0">
        <ChatArea
          me={me}
          openChat={openChat}
          messages={messages}
          message={message}
          setMessage={setMessage}
          loadingMsg={loadingMsg}
          onSend={sendMessage}
          onClose={() => setOpenChatId(null)}
          onBlockOpen={setShowBlockModal}
          onFindPeople={() => setActiveTab("search")}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {showBlockModal && (
        <BlockModal
          user={showBlockModal}
          onClose={() => setShowBlockModal(null)}
          onBlock={doBlock}
          onUnblock={doUnblock}
        />
      )}
    </div>
  );
}
