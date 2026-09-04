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
    if (login(user, pass)) {
      setError(false);
    } else {
      setError(true);
      setPass("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[linear-gradient(135deg,#0d2414_0%,#1a3a1a_50%,#0d2414_100%)] p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[420px] rounded-[18px] bg-white px-7 py-9 text-center shadow-[0_28px_70px_rgba(0,0,0,0.4)] sm:px-10"
      >
        <div className="mx-auto mb-3.5 flex h-[60px] w-[60px] items-center justify-center rounded-[15px] bg-[linear-gradient(135deg,#0d9e77,#1a7a5e)] text-[28px] shadow-[0_8px_20px_rgba(13,158,119,0.4)]">
          🌿
        </div>
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[2.5px] text-brand-green">
          Agrolityx Research
        </div>
        <h2 className="mb-1 text-xl font-bold text-ink">Cotton Dashboard</h2>
        <p className="mb-7 text-[13px] text-ink-faint">
          Sign in to access your dashboard
        </p>

        <label className="mb-1.5 block text-left text-[11px] font-bold uppercase tracking-wide text-ink-soft">
          Username
        </label>
        <input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          autoComplete="username"
          placeholder="Enter your username"
          className="mb-3.5 w-full rounded-[9px] border-2 border-[#e8e8e8] px-3.5 py-3 text-sm outline-none transition-colors focus:border-brand-green"
        />

        <label className="mb-1.5 block text-left text-[11px] font-bold uppercase tracking-wide text-ink-soft">
          Password
        </label>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="current-password"
          placeholder="Enter your password"
          className="mb-4 w-full rounded-[9px] border-2 border-[#e8e8e8] px-3.5 py-3 text-sm outline-none transition-colors focus:border-brand-green"
        />

        {error ? (
          <div className="mb-3.5 rounded-lg border border-[#f5b8b8] bg-[#fff2f2] px-3.5 py-2.5 text-left text-xs font-semibold text-neg">
            ❌ Incorrect username or password. Please try again.
          </div>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-[10px] bg-[linear-gradient(135deg,#0d9e77,#1a7a5e)] py-3.5 text-[15px] font-bold tracking-wide text-white shadow-[0_5px_16px_rgba(13,158,119,0.45)] transition-opacity hover:opacity-90"
        >
          Sign In →
        </button>

        <p className="mt-5 text-[11px] text-ink-faint">
          🔒 Protected · Agrolityx Research © 2025
        </p>
      </form>
    </div>
  );
}
