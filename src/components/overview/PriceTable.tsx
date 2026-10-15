"use client";

import clsx from "clsx";
import { parseLabelDate } from "@/lib/period";
import { ICE_M_L, ICE_M_V, BR_M_L, BR_M_V } from "@/data/international";
import { seriesFor, type HeroCategory } from "./HeroChart";

/** the Market Overview's table view: latest price and change over 1W … 5Y for each commodity */
const ROWS: { cat: HeroCategory; label: string; sub: string }[] = [
  { cat: "domestic", label: "Gujarat Shankar-29", sub: "Domestic cotton · Guj-29" },
  { cat: "cseed", label: "Cotton Seed", sub: "Domestic" },
  { cat: "coilc", label: "Cotton Seed Oil Cake", sub: "Domestic" },
  { cat: "kapas", label: "Kapas", sub: "Raw cotton · Rajkot" },
  { cat: "yarn", label: "Cotton Yarn", sub: "Domestic" },
  { cat: "cotton", label: "Global Cotton", sub: "ICE Cotton No. 2" },
  { cat: "crude", label: "Crude Oil", sub: "Brent" },
];

const PERIODS: { label: string; days: number }[] = [
  { label: "1 Week", days: 7 },
  { label: "1 Month", days: 30 },
  { label: "6 Months", days: 182 },
  { label: "1 Year", days: 365 },
  { label: "5 Years", days: 365 * 5 },
];

type Pt = { t: number; v: number };
const points = (labels: (string | number)[], values: (number | null)[]): Pt[] =>
  labels
    .map((l, i) => ({ t: parseLabelDate(l), v: values[i] }))
    .filter((p): p is Pt => p.t != null && typeof p.v === "number" && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t);

/**
 * % change from the price `days` before the latest one. Needs history that actually reaches back
 * that far (within `slackDays`); otherwise null rather than a change from whatever came first.
 */
function changeOver(pts: Pt[], days: number, slackDays: number, last: Pt): number | null {
  if (!pts.length) return null;
  const target = last.t - days * 86400000;
  if (pts[0].t > target + slackDays * 86400000) return null;
  let base: Pt | null = null;
  for (const p of pts) {
    if (p.t <= target + slackDays * 86400000 * 0.5) base = p;
    else break;
  }
  if (!base || base.v === 0) return null;
  return ((last.v - base.v) / Math.abs(base.v)) * 100;
}

export function PriceTable() {
  const rows = ROWS.map((r) => {
    const s = seriesFor(r.cat, "1y");
    const daily = points(s.labels, s.values);
    const last = daily.at(-1) ?? null;
    // ICE cotton and Brent keep only ~2 years of daily settlements; their monthly history covers longer periods
    // (read the series here, not at import time — they're filled in when the data loads)
    const monthlySrc = r.cat === "cotton" ? { l: ICE_M_L, v: ICE_M_V } : r.cat === "crude" ? { l: BR_M_L, v: BR_M_V } : null;
    const monthly = monthlySrc ? points(monthlySrc.l, monthlySrc.v) : [];
    const changes = PERIODS.map((p) => {
      if (!last) return null;
      const d = changeOver(daily, p.days, 7, last);
      if (d != null) return d;
      return monthly.length ? changeOver(monthly, p.days, 31, last) : null;
    });
    return { ...r, unit: s.unit, fmt: s.headlineFmt, last, changes };
  });

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pb-2 pt-4 sm:px-5">
        <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Prices &amp; changes</h2>
        <span className="text-[11px] text-ink-faint">Latest price and % change vs 1 week, 1 month, 6 months, 1 year and 5 years earlier</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-[13px]">
          <thead>
            <tr className="border-y border-line bg-surface-2 text-right text-[10px] uppercase tracking-wide text-ink-faint">
              <th className="sticky left-0 z-10 bg-surface-2 px-4 py-2.5 text-left font-semibold sm:px-5">Commodity</th>
              <th className="px-3 py-2.5 font-semibold">Latest price</th>
              {PERIODS.map((p) => (
                <th key={p.label} className="px-3 py-2.5 font-semibold">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cat} className="group border-b border-line last:border-0">
                <td className="sticky left-0 z-10 bg-surface px-4 py-3 group-hover:bg-surface-2 sm:px-5">
                  <div className="font-semibold text-ink">{r.label}</div>
                  <div className="text-[11px] text-ink-faint">{r.sub}</div>
                </td>
                <td className="num px-3 py-3 text-right">
                  <div className="text-[14px] font-semibold text-ink">{r.last ? r.fmt(r.last.v) : "—"}</div>
                  <div className="text-[10.5px] text-ink-faint">
                    {r.unit}
                    {r.last ? ` · ${new Date(r.last.t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}` : ""}
                  </div>
                </td>
                {r.changes.map((c, i) => (
                  <td key={i} className="num px-3 py-3 text-right">
                    <Change v={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-4 py-2.5 text-[11px] text-ink-faint sm:px-5">
        Change = latest price vs the price on (or just before) that date. “—” where the price history doesn’t reach back that far.
      </p>
    </section>
  );
}

function Change({ v }: { v: number | null }) {
  if (v == null) return <span className="text-ink-faint">—</span>;
  const flat = Math.abs(v) < 0.05;
  return (
    <span
      className={clsx(
        "inline-flex min-w-[64px] items-center justify-end gap-1 rounded-md px-1.5 py-0.5 text-[12.5px] font-semibold",
        flat ? "text-ink-faint" : v > 0 ? "bg-pos-soft text-pos" : "bg-neg-soft text-neg",
      )}
    >
      {flat ? null : <span className="text-[9px]">{v > 0 ? "▲" : "▼"}</span>}
      {`${v > 0 && !flat ? "+" : v < 0 && !flat ? "−" : ""}${Math.abs(v).toFixed(1)}%`}
    </span>
  );
}
