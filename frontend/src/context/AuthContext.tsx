import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Role, TokenResponse } from "../api/client";
import { login as apiLogin, signup as apiSignup } from "../api/client";

const STORAGE_KEY = "job_portal_auth";

type StoredAuth = {
  token: string;
  role: Role;
  name: string;
  userId: string;
};

function readStored(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredAuth;
    if (p?.token && (p.role === "user" || p.role === "host")) return p;
  } catch {
    /* ignore */
  }
  return null;
}

type AuthContextValue = {
  token: string | null;
  role: Role | null;
  name: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<TokenResponse>;
  signup: (args: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => Promise<TokenResponse>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredAuth | null>(() => readStored());

  const persist = useCallback((t: TokenResponse) => {
    const next: StoredAuth = {
      token: t.access_token,
      role: t.role as Role,
      name: t.name,
      userId: t.user_id,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setStored(next);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const t = await apiLogin({ email, password });
      persist(t);
      return t;
    },
    [persist]
  );

  const signup = useCallback(
    async (args: { name: string; email: string; password: string; role: Role }) => {
      const t = await apiSignup(args);
      persist(t);
      return t;
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStored(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: stored?.token ?? null,
      role: stored?.role ?? null,
      name: stored?.name ?? null,
      userId: stored?.userId ?? null,
      isAuthenticated: Boolean(stored?.token),
      login,
      signup,
      logout,
    }),
    [stored, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
