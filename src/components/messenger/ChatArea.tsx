import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { User, Chat, Message, Avatar, fmtTime } from "./types.tsx";

interface ChatAreaProps {
  me: User;
  openChat: Chat | undefined;
  messages: Message[];
  message: string;
  setMessage: (v: string) => void;
  loadingMsg: boolean;
  onSend: () => void;
  onClose: () => void;
  onBlockOpen: (user: User) => void;
  onFindPeople: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function ChatArea({
  me, openChat, messages, message, setMessage, loadingMsg,
  onSend, onClose, onBlockOpen, onFindPeople, messagesEndRef,
}: ChatAreaProps) {
  if (!openChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
        <div className="w-20 h-20 rounded-3xl bg-[var(--bg-panel)] border border-[var(--border-color)] flex items-center justify-center mb-4 shadow-sm">
          <Icon name="MessageCircle" size={34} className="text-[var(--accent-blue)] opacity-50" />
        </div>
        <p className="text-[15px] font-semibold text-[var(--text-main)] mb-1">Выберите чат</p>
        <p className="text-[13px] mb-3">или найдите человека</p>
        <button onClick={onFindPeople}
          className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-[13px] font-medium hover:opacity-90 transition">
          Найти людей
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-[var(--bg-panel)] border-b border-[var(--border-color)]">
        <button onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition text-[var(--text-muted)]">
          <Icon name="ArrowLeft" size={18} />
        </button>
        <Avatar name={openChat.partner.display_name} size={38} online={openChat.online} />
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-[var(--text-main)]">{openChat.partner.display_name}</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            @{openChat.partner.username} · {openChat.online ? "в сети" : "не в сети"}
          </p>
        </div>
        <button onClick={() => onBlockOpen(openChat.partner)}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-hover)] transition text-[var(--text-muted)]" title="Заблокировать">
          <Icon name="ShieldOff" size={17} />
        </button>
      </div>

      {/* Messages */}
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

      {/* Input */}
      <div className="px-4 py-3 bg-[var(--bg-panel)] border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <input type="text" value={message} onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && onSend()}
            placeholder="Написать сообщение..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--bg-input)] text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition" />
          <button onClick={onSend}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${message.trim() ? "bg-[var(--accent-blue)] text-white hover:opacity-90" : "bg-[var(--bg-input)] text-[var(--text-muted)]"}`}>
            <Icon name="Send" size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

interface BlockModalProps {
  user: User;
  onClose: () => void;
  onBlock: (user: User) => void;
  onUnblock: (user: User) => void;
}

export function BlockModal({ user, onClose, onBlock, onUnblock }: BlockModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-[300px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={user.display_name} size={40} />
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-main)]">{user.display_name}</p>
            <p className="text-[12px] text-[var(--text-muted)]">@{user.username}</p>
          </div>
        </div>
        <p className="text-[13px] text-[var(--text-muted)] mb-5 leading-relaxed">
          {user.blocked
            ? `Разблокировать ${user.display_name}?`
            : `Заблокировать ${user.display_name}? Он не сможет писать вам.`}
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-[13px] font-medium text-gray-600">Отмена</button>
          <button onClick={() => user.blocked ? onUnblock(user) : onBlock(user)}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition ${user.blocked ? "bg-green-500" : "bg-red-500"}`}>
            {user.blocked ? "Разблокировать" : "Заблокировать"}
          </button>
        </div>
      </div>
    </div>
  );
}
