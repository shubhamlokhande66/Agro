"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Role = "admin" | "client";

type AuthState = {
  ready: boolean;
  authed: boolean;
  role: Role | null;
  username: string | null;
  /** true only for the admin role */
  canUpload: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.session) {
          setRole(d.session.role);
          setUsername(d.session.username);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
    });
    if (!res.ok) return false;
    const d = await res.json();
    setRole(d.role);
    setUsername(d.username);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setRole(null);
    setUsername(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      authed: role != null,
      role,
      username,
      canUpload: role === "admin",
      isAdmin: role === "admin",
      login,
      logout,
    }),
    [ready, role, username, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
