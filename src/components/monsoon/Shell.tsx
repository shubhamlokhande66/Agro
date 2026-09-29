"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { WEATHER_DATASETS } from "@/lib/datasets/registry";

export const MONSOON_NAV = [
  { href: "/monsoon", label: "Summary", icon: "▦" },
  { href: "/monsoon/regional", label: "Regional Weighted", icon: "⌖" },
  { href: "/monsoon/planting", label: "Planting Progress", icon: "❦" },
  { href: "/monsoon/deficit", label: "Deficit Table", icon: "▤" },
  { href: "/monsoon/weather", label: "Weather Reports", icon: "☁" },
  { href: "/monsoon/cumulative-map", label: "Cumulative Map", icon: "▧" },
  { href: "/monsoon/forecast", label: "Forecast Maps", icon: "≋" },
  { href: "/monsoon/enso", label: "ENSO Deep Dive", icon: "∿" },
  { href: "/monsoon/satellite", label: "Satellite View", icon: "◉" },
];

/** the Weather dashboard's frame — dark sidebar + top bar, as in the original monsoon app */
export function MonsoonShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { username, logout, isAdmin } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(222,47%,6%)] text-slate-200">
      {open ? <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} /> : null}

      <aside
        className={clsx(
          "print-hide fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-700/50 bg-[hsl(222,47%,8%)] transition-transform duration-300 lg:static",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center gap-3 border-b border-slate-700/50 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-lg text-emerald-400">🌧</div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Monsoon Monitor</h1>
            <p className="font-mono text-[10px] text-slate-500">KHARIF {new Date().getFullYear()}</p>
          </div>
          <button type="button" className="ml-auto text-slate-400 hover:text-white lg:hidden" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {MONSOON_NAV.map((item) => {
            const active = item.href === "/monsoon" ? pathname === "/monsoon" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:bg-slate-700/30 hover:text-slate-200",
                )}
              >
                <span className="w-4 text-center" aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          {isAdmin ? (
            <div className="pt-4">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Weather admin</p>
              {WEATHER_DATASETS.map((d) => (
                <Link
                  key={d.key}
                  href={`/monsoon/admin/${d.key}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-400 transition-all hover:bg-slate-700/30 hover:text-slate-200"
                >
                  <span className="w-4 text-center" aria-hidden>✎</span>
                  {d.label}
                </Link>
              ))}
              <Link
                href="/monsoon/admin/users"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-400 transition-all hover:bg-slate-700/30 hover:text-slate-200"
              >
                <span className="w-4 text-center" aria-hidden>◈</span>
                Weather Users
              </Link>
            </div>
          ) : null}
        </nav>

        <div className="space-y-1 border-t border-slate-700/50 p-3">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-700/30 hover:text-slate-200">
            ← All dashboards
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-500/5 hover:text-red-400"
          >
            ⎋ Sign out{username ? ` (${username})` : ""}
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="print-hide flex shrink-0 items-center gap-4 border-b border-slate-700/50 bg-[hsl(222,47%,7%)] px-4 py-3 lg:px-6">
          <button type="button" className="text-slate-400 hover:text-white lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            ☰
          </button>
          <h2 className="min-w-0 flex-1 truncate text-base font-bold tracking-tight text-white">
            Monsoon {new Date().getFullYear()} — Rainfall Risk Monitor
          </h2>
          {isAdmin ? (
            <Link
              href="/monsoon/admin"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
            >
              ⚙ Weather Admin
            </Link>
          ) : null}
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Auto-updated daily
          </span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
