"use client";

import { useAuth } from "@/lib/auth";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { role, username, logout, canUpload } = useAuth();

  return (
    <header className="flex items-center justify-between gap-3 bg-brand-navy px-4 py-3 text-white sm:px-7">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-[15px] font-semibold tracking-wide">
            India Cotton Trading Dashboard
          </h1>
          <div className="num text-[10px] text-white/45">Agrolityx Research</div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="hidden rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold text-white/80 sm:inline">
          {canUpload ? "🔧 Admin mode" : "👤 Client view"}
          {username ? ` · ${username}` : ""}
        </span>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-white/25 bg-white/12 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/25"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
