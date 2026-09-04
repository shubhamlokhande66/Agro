"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

export function LoginScreen() {
  const { login } = useAuth();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (login(user, pass)) setError(false);
    else {
      setError(true);
      setPass("");
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
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#2dd08a] to-[#0b7d4e] text-2xl shadow-[0_10px_30px_-8px_rgba(45,208,138,0.6)]">
          🌿
        </div>
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#2dd08a]">
          Agrolityx Research
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white">Cotton Terminal</h2>
        <p className="mb-7 mt-1 text-[13px] text-white/45">Sign in to your workspace</p>

        <label className="mb-1.5 block text-left text-[11px] font-semibold uppercase tracking-wide text-white/50">
          Username
        </label>
        <input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          autoComplete="username"
          placeholder="admin"
          className="mb-3.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#2dd08a] focus:bg-white/[0.06]"
        />

        <label className="mb-1.5 block text-left text-[11px] font-semibold uppercase tracking-wide text-white/50">
          Password
        </label>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="current-password"
          placeholder="••••••••"
          className="mb-4 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#2dd08a] focus:bg-white/[0.06]"
        />

        {error ? (
          <div className="mb-3.5 rounded-xl border border-[#ff7a6b]/30 bg-[#ff7a6b]/10 px-3.5 py-2.5 text-left text-xs font-medium text-[#ff9c90]">
            Incorrect username or password.
          </div>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-[#2dd08a] to-[#0b7d4e] py-3.5 text-[15px] font-semibold text-[#05221a] shadow-[0_10px_30px_-8px_rgba(45,208,138,0.55)] transition-opacity hover:opacity-95"
        >
          Sign in →
        </button>

        <p className="mt-6 text-[11px] text-white/25">
          🔒 Protected · Agrolityx Research © 2025
        </p>
      </form>
    </div>
  );
}
