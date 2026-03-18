export type Tab = "chats" | "contacts" | "profile" | "settings" | "search";

export interface User {
  id: number;
  username: string;
  display_name: string;
  bio?: string;
  phone?: string;
  online?: boolean;
  blocked?: boolean;
}

export interface Chat {
  id: number;
  partner: User;
  online: boolean;
  last_msg: string;
  last_time: string | null;
  unread: number;
}

export interface Message {
  id: number;
  text: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
  is_read: boolean;
}

const avatarPalette = ["#4A90D9","#E85D8C","#5CAD6E","#F0A030","#9B59B6","#E67E22","#1ABC9C","#E74C3C","#3498DB","#8E44AD"];

export function getColor(str: string) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % avatarPalette.length;
  return avatarPalette[h];
}

export function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
}

export function fmtTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return "вчера";
}

export function Avatar({ name, size = 40, online = false }: { name: string; size?: number; online?: boolean }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-semibold text-white select-none"
        style={{ width: size, height: size, background: getColor(name), fontSize: size * 0.36 }}
      >
        {initials(name)}
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
