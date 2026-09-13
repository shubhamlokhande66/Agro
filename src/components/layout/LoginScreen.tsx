"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

export function LoginScreen() {
  const { login, signup } = useAuth();
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
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07100c] p-4">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#0f9d63]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-[#0b7d4e]/20 blur-3xl" />

      <form
        onSubmit={submit}
        className="relative w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center backdrop-blur-xl sm:p-9"
        style={{ boxShadow: "0 40px 120px -20px rgba(0,0,0,0.6)" }}
      >
        <div className="mx-auto mb-5 inline-flex rounded-2xl bg-white px-7 py-4 shadow-[0_10px_30px_-8px_rgba(45,208,138,0.35)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/agrolytix-logo.jpg" alt="Agrolytix Research" className="h-16 w-auto" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white">Cotton Terminal</h2>
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
          className="mb-3.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#2dd08a] focus:bg-white/[0.06]"
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
          className={mode === "signup" ? "mb-3.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#2dd08a] focus:bg-white/[0.06]" : "mb-4 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#2dd08a] focus:bg-white/[0.06]"}
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
              className="mb-4 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#2dd08a] focus:bg-white/[0.06]"
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
          className="w-full rounded-xl bg-gradient-to-r from-[#2dd08a] to-[#0b7d4e] py-3.5 text-[15px] font-semibold text-[#05221a] shadow-[0_10px_30px_-8px_rgba(45,208,138,0.55)] transition-opacity hover:opacity-95 disabled:opacity-60"
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
