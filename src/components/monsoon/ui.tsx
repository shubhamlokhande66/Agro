"use client";

import clsx from "clsx";
import { useMonsoon } from "./data";

/** the Weather dashboard's dark "finance terminal" look (ported from the original app) */
export const PANEL = "rounded-xl border border-slate-700/30 bg-[hsl(222,47%,9%)]";

/** IMD's official rainfall categories (the legend printed on every IMD bulletin) */
export function imdCategory(dep: number): { label: string; text: string; bg: string } {
  if (dep <= -100) return { label: "No Rain", text: "text-red-500", bg: "bg-red-500/10" };
  if (dep <= -60) return { label: "Large Deficient", text: "text-red-400", bg: "bg-red-500/10" };
  if (dep <= -20) return { label: "Deficient", text: "text-amber-400", bg: "bg-amber-500/10" };
  if (dep < 20) return { label: "Normal", text: "text-slate-300", bg: "bg-slate-500/10" };
  if (dep < 60) return { label: "Excess", text: "text-green-400", bg: "bg-green-500/10" };
  return { label: "Large Excess", text: "text-emerald-400", bg: "bg-emerald-500/10" };
}

export const signed = (v: number | null | undefined, digits = 1, unit = "%") =>
  v == null || Number.isNaN(v) ? "N/A" : `${v > 0 ? "+" : ""}${v.toFixed(digits)}${unit}`;

export function PageTitle({ icon, title, sub, right }: { icon: string; title: string; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
          <span className="text-emerald-400" aria-hidden>{icon}</span>
          {title}
        </h3>
        {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function RefreshButton() {
  const { reload, loading } = useMonsoon();
  return (
    <button
      type="button"
      onClick={reload}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
    >
      ⟳ {loading ? "Loading…" : "Refresh"}
    </button>
  );
}

export function SegTabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex w-fit flex-wrap gap-1 rounded-lg bg-slate-800/50 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={clsx(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === t.id ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-slate-200",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** wraps a page: spinner while loading, message + retry on error */
export function Loaded({ children }: { children: React.ReactNode }) {
  const { data, loading, error, reload } = useMonsoon();
  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-slate-400">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        Loading monsoon data…
      </div>
    );
  }
  if (error && !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-slate-400">⚠ {error}</p>
        <button type="button" onClick={reload} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">
          Retry
        </button>
      </div>
    );
  }
  return <>{children}</>;
}
