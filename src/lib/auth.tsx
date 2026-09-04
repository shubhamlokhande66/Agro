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

type User = { username: string; password: string; role: Role };

/**
 * User credentials — ported 1:1 from the legacy dashboard.
 * To add / remove clients, edit this list.
 */
const USERS: User[] = [
  { username: "admin", password: "Agro@Admin2025", role: "admin" },
  { username: "client01", password: "Cotton@C01", role: "client" },
  { username: "client02", password: "Cotton@C02", role: "client" },
  { username: "client03", password: "Cotton@C03", role: "client" },
  { username: "client04", password: "Cotton@C04", role: "client" },
  { username: "client05", password: "Cotton@C05", role: "client" },
  { username: "client06", password: "Cotton@C06", role: "client" },
  { username: "client07", password: "Cotton@C07", role: "client" },
  { username: "client08", password: "Cotton@C08", role: "client" },
  { username: "client09", password: "Cotton@C09", role: "client" },
  { username: "client10", password: "Cotton@C10", role: "client" },
];

const K_AUTH = "cda_auth";
const K_ROLE = "cda_role";
const K_USER = "cda_user";

type AuthState = {
  ready: boolean;
  authed: boolean;
  role: Role | null;
  username: string | null;
  /** true only for the admin role — gates every upload / template control */
  canUpload: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    try {
      const a = sessionStorage.getItem(K_AUTH);
      const r = sessionStorage.getItem(K_ROLE) as Role | null;
      const u = sessionStorage.getItem(K_USER);
      if (a === "1" && r) {
        setRole(r);
        setUsername(u);
      }
    } catch {
      /* sessionStorage unavailable — treat as logged out */
    }
    setReady(true);
  }, []);

  const login = useCallback((u: string, p: string) => {
    const uNorm = u.trim().toLowerCase();
    const match = USERS.find(
      (x) => x.username.toLowerCase() === uNorm && x.password === p,
    );
    if (!match) return false;
    try {
      sessionStorage.setItem(K_AUTH, "1");
      sessionStorage.setItem(K_ROLE, match.role);
      sessionStorage.setItem(K_USER, match.username);
    } catch {
      /* ignore */
    }
    setRole(match.role);
    setUsername(match.username);
    return true;
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
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
