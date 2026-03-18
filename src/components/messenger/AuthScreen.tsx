import { useState } from "react";
import { api } from "@/lib/api";
import { User } from "./types.tsx";

interface AuthScreenProps {
  onAuth: (user: User, token: string) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
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
            {(["login", "register"] as const).map(m => (
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
