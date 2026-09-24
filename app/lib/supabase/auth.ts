export type AuthUser = { id: string; email?: string };
export type AuthSession = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  user: AuthUser;
};

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: AuthUser;
  error?: string | { message?: string };
  error_description?: string;
  msg?: string;
  message?: string;
};

const SESSION_KEY = "anatomy101:auth-session";

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Hesap sistemi henüz yapılandırılmadı. Uygulamayı misafir olarak kullanabilirsin.");
  }
  return { url, key };
}

function errorMessage(data: AuthResponse, fallback: string) {
  if (typeof data.error === "string") return data.error_description || data.error;
  return data.error?.message || data.msg || data.message || data.error_description || fallback;
}

async function request(
  path: string,
  body: object,
  options: { method?: "POST" | "PUT"; token?: string } = {},
): Promise<AuthResponse> {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: options.method ?? "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${options.token ?? key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({})) as AuthResponse;
  if (!response.ok) throw new Error(errorMessage(data, "Kimlik doğrulama isteği başarısız."));
  return data;
}

function toSession(data: AuthResponse): AuthSession | null {
  if (!data.access_token || !data.user) return null;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
    user: data.user,
  };
}

function storeSession(data: AuthResponse) {
  const session = toSession(data);
  if (!session || typeof window === "undefined") return session;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("anatomy101:auth-change"));
  return session;
}

export const auth = {
  isConfigured: () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  getSession: (): AuthSession | null => {
    if (typeof window === "undefined") return null;
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as AuthSession | null;
      if (!session?.access_token || !session.user?.id) return null;
      if (session.expires_at <= Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },
  signUp: async (email: string, password: string) => {
    const response = await request("signup", { email, password });
    return { response, session: storeSession(response) };
  },
  signIn: async (email: string, password: string) => {
    const response = await request("token?grant_type=password", { email, password });
    return { response, session: storeSession(response) };
  },
  forgotPassword: (email: string, redirectTo: string) => request("recover", { email, redirect_to: redirectTo }),
  updatePassword: async (password: string, accessToken: string) => {
    const response = await request("user", { password }, { method: "PUT", token: accessToken });
    if (response.user) {
      const current = auth.getSession();
      if (current) localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, user: response.user }));
    }
    return response;
  },
  signOut: async () => {
    const session = auth.getSession();
    try {
      if (session?.access_token) await request("logout", {}, { token: session.access_token });
    } catch {
      // Uzak oturum kapanmasa bile yerel oturum temizlenir.
    } finally {
      localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event("anatomy101:auth-change"));
    }
  },
};
