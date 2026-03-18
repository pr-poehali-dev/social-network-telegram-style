const AUTH_URL = "https://functions.poehali.dev/6a1ab67a-3bac-4c7a-8e41-bccf8a72b001";
const MSG_URL = "https://functions.poehali.dev/5039529d-20c4-4c88-b49d-f1a79ec48004";
const USERS_URL = "https://functions.poehali.dev/392c81af-0907-4205-a85c-9ffe5b602471";

function getToken() {
  return localStorage.getItem("sphere_token") || "";
}

async function req(base: string, path: string, method = "GET", body?: object) {
  const token = getToken();
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Session-Token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  // AUTH
  register: (data: { username: string; display_name: string; password: string; phone?: string }) =>
    req(AUTH_URL, "/register", "POST", data),
  login: (username: string, password: string) =>
    req(AUTH_URL, "/login", "POST", { username, password }),
  logout: () => req(AUTH_URL, "/logout", "POST"),
  me: () => req(AUTH_URL, "/me", "GET"),

  // CHATS
  getChats: () => req(MSG_URL, "/chats", "GET"),
  createChat: (user_id: number) => req(MSG_URL, "/chats", "POST", { user_id }),
  getMessages: (chat_id: number) => req(MSG_URL, `/chats/${chat_id}/messages`, "GET"),
  sendMessage: (chat_id: number, text: string) =>
    req(MSG_URL, `/chats/${chat_id}/messages`, "POST", { text }),
  markRead: (chat_id: number) => req(MSG_URL, `/chats/${chat_id}/read`, "POST"),

  // USERS
  searchUsers: (q: string) => req(USERS_URL, `/users/search?q=${encodeURIComponent(q)}`, "GET"),
  getUser: (id: number) => req(USERS_URL, `/users/${id}`, "GET"),
  updateMe: (data: { display_name: string; bio: string }) =>
    req(USERS_URL, "/users/me", "PUT", data),
  blockUser: (id: number) => req(USERS_URL, `/users/${id}/block`, "POST"),
  unblockUser: (id: number) => req(USERS_URL, `/users/${id}/unblock`, "POST"),
  getBlocked: () => req(USERS_URL, "/users/blocked", "GET"),
};
