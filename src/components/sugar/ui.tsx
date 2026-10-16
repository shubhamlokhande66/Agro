"use client";

import clsx from "clsx";

/** shown on every sugar page until its data source is connected */
export function SampleBanner({ source }: { source?: string }) {
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-300/70 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      <span className="mt-px rounded bg-amber-200 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-amber-900">Sample data</span>
      <span>
        Layout preview — the numbers on this page are placeholders, not market data.
        {source ? <> Expected source: <b>{source}</b>.</> : null}
      </span>
    </div>
  );
}

export const pct = (now: number | null | undefined, then: number | null | undefined) =>
  now == null || then == null || then === 0 ? null : ((now - then) / Math.abs(then)) * 100;

export const fmt = (v: number | null | undefined, digits = 0) =>
  v == null ? "—" : v.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** a % change as small green / red text */
export function Chg({ v, suffix = "%" }: { v: number | null; suffix?: string }) {
  const tone = v == null || Math.abs(v) < 0.05 ? "text-ink-faint" : v > 0 ? "text-pos" : "text-neg";
  return <span className={clsx("num font-semibold", tone)}>{v == null ? "—" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}${suffix}`}</span>;
}

/** one headline figure: label, value + unit, change underneath */
export function Figure({ label, value, unit, change, note }: { label: string; value: string; unit?: string; change?: number | null; note?: string }) {
  return (
    <div className="panel px-4 py-3">
      <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="num mt-1 text-[20px] font-semibold tracking-tight text-ink">
        {value}
        {unit ? <span className="ml-1 text-[11px] font-medium text-ink-faint">{unit}</span> : null}
      </div>
      <div className="num mt-0.5 text-[11px] text-ink-faint">
        {change !== undefined ? <><Chg v={change} /> m/m</> : null}
        {note ? <span>{change !== undefined ? " · " : ""}{note}</span> : null}
      </div>
    </div>
  );
}
