"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

/** per-dashboard look of the shared sign-in screen */
const THEMES = {
  cotton: { title: "Cotton Terminal", bg: "#07100c", a: "#2dd08a", b: "#0b7d4e", glow: "15,157,99", text: "#05221a" },
  weather: { title: "Monsoon Monitor", bg: "#060b16", a: "#38bdf8", b: "#1d4ed8", glow: "37,99,235", text: "#04122e" },
} as const;

export function LoginScreen() {
  const { login, signup, app } = useAuth();
  const t = THEMES[app];
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (m: "login" | "signup") => {
    setMode(m);
    setError(null);
    setNotice(null);
    setPass("");
    setConfirm("");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === "signup" && pass !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    const err = mode === "login" ? await login(user, pass) : await signup(user, pass);
    setBusy(false);

    if (err) {
      setError(err);
      setPass("");
      setConfirm("");
      return;
    }
    if (mode === "signup") {
      setNotice("Request sent — an admin needs to approve your account before you can sign in.");
      setMode("login");
      setPass("");
      setConfirm("");
    }
  }

  return (
    <div
      className="relative grid min-h-screen place-items-center overflow-hidden p-4"
      style={{ background: t.bg, ["--lg-a" as string]: t.a, ["--lg-b" as string]: t.b }}
    >
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full blur-3xl" style={{ background: `rgba(${t.glow},0.2)` }} />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full blur-3xl" style={{ background: `rgba(${t.glow},0.2)` }} />
      <Link href="/" className="absolute left-4 top-4 text-[12px] font-medium text-white/45 hover:text-white">
        ← All dashboards
      </Link>

      <form
        onSubmit={submit}
        className="relative w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center backdrop-blur-xl sm:p-9"
        style={{ boxShadow: "0 40px 120px -20px rgba(0,0,0,0.6)" }}
      >
        <div className="mx-auto mb-5 inline-flex rounded-2xl bg-white px-7 py-4 shadow-[0_10px_30px_-8px_rgba(45,208,138,0.35)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/agrolytix-logo.jpg" alt="Agrolytix Research" className="h-16 w-auto" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white">{t.title}</h2>
        <p className="mb-6 mt-1 text-[13px] text-white/45">
          {mode === "login" ? "Sign in to your workspace" : "Request access to your workspace"}
        </p>

        <div className="mb-6 inline-flex rounded-xl bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={
              "rounded-lg px-4 py-1.5 text-[12.5px] font-semibold transition-colors " +
              (mode === "login" ? "bg-white/10 text-white" : "text-white/40")
            }
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={
              "rounded-lg px-4 py-1.5 text-[12.5px] font-semibold transition-colors " +
              (mode === "signup" ? "bg-white/10 text-white" : "text-white/40")
            }
          >
            Sign up
          </button>
        </div>

        <label className="mb-1.5 block text-left text-[11px] font-semibold uppercase tracking-wide text-white/50">
          Username
        </label>
        <input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          autoComplete="username"
          placeholder={mode === "login" ? "admin" : "pick a username"}
          className="mb-3.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[var(--lg-a)] focus:bg-white/[0.06]"
        />

        <label className="mb-1.5 block text-left text-[11px] font-semibold uppercase tracking-wide text-white/50">
          Password
        </label>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="••••••••"
          className={mode === "signup" ? "mb-3.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[var(--lg-a)] focus:bg-white/[0.06]" : "mb-4 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[var(--lg-a)] focus:bg-white/[0.06]"}
        />

        {mode === "signup" ? (
          <>
            <label className="mb-1.5 block text-left text-[11px] font-semibold uppercase tracking-wide text-white/50">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              className="mb-4 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[var(--lg-a)] focus:bg-white/[0.06]"
            />
          </>
        ) : null}

        {notice ? (
          <div className="mb-3.5 rounded-xl border border-[#2dd08a]/30 bg-[#2dd08a]/10 px-3.5 py-2.5 text-left text-xs font-medium text-[#8be8bd]">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="mb-3.5 rounded-xl border border-[#ff7a6b]/30 bg-[#ff7a6b]/10 px-3.5 py-2.5 text-left text-xs font-medium text-[#ff9c90]">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl py-3.5 text-[15px] font-semibold transition-opacity hover:opacity-95 disabled:opacity-60"
          style={{ background: `linear-gradient(to right, ${t.a}, ${t.b})`, color: t.text }}
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign in →" : "Request access →"}
        </button>

        <p className="mt-6 text-[11px] text-white/25">
          🔒 Protected · Agrolytix Research © 2025
        </p>
      </form>
    </div>
  );
}
