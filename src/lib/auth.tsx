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
  /** returns null on success, or a message to show the user on failure */
  login: (username: string, password: string) => Promise<string | null>;
  /** returns null on success, or a message to show the user on failure */
  signup: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const DEVICE_ID_KEY = "cda_device_id";

/** a stable per-browser id, so the server can tell "this device" apart from others */
function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "unknown-device";
  }
}

/** best-effort "Chrome on Windows" style label for the admin's device list — not a security signal */
function getDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Unknown browser";
  return `${browser} on ${os}`;
}

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
      body: JSON.stringify({
        username: u,
        password: p,
        deviceId: getDeviceId(),
        deviceLabel: getDeviceLabel(),
      }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return d.error ?? "Sign in failed";
    setRole(d.role);
    setUsername(d.username);
    return null;
  }, []);

  const signup = useCallback(async (u: string, p: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return d.error ?? "Sign up failed";
    return null;
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
      signup,
      logout,
    }),
    [ready, role, username, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
