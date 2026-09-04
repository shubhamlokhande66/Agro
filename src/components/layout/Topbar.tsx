"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { ALL_ITEMS } from "@/lib/nav";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { username, logout, canUpload } = useAuth();
  const { mode, toggle } = useTheme();
  const pathname = usePathname();
  const current =
    ALL_ITEMS.find((i) =>
      i.href === "/" ? pathname === "/" : pathname.startsWith(i.href),
    )?.label ?? "Overview";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[var(--topbar-bg)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            aria-label="Open menu"
            className="focusable grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <div className="leading-tight">
            <div className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-ink-faint">
              Agrolityx Research
            </div>
            <div className="text-[14px] font-semibold tracking-tight text-ink">
              {current}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-surface-2 px-2.5 py-1 text-[10.5px] font-semibold text-ink-soft sm:inline">
            {canUpload ? "◆ Admin" : "○ Client"}
            {username ? ` · ${username}` : ""}
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="focusable grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:text-ink"
          >
            {mode === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={logout}
            className="focusable rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-semibold text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
