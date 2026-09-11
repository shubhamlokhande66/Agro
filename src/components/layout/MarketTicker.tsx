"use client";

import clsx from "clsx";
import { VARIETIES, recentPrices } from "@/data/prices";
import { ICE_D_V, BR_M_V } from "@/data/international";
import { USDINR_M_V, USDCNY_M_V } from "@/data/currency";
import { IE } from "@/data/trade";
import { pctChange } from "@/lib/format";

type Item = { label: string; value: string; delta: number | null };

function tail2(a: unknown): [number | null, number | null] {
  if (!Array.isArray(a) || a.length === 0) return [null, null];
  return [a[a.length - 2] ?? null, a[a.length - 1] ?? null];
}

function daily(key: string): number[] {
  const v = VARIETIES.find((x) => x.key === key);
  return v ? recentPrices(v) : [];
}

function build(): Item[] {
  const items: Item[] = [];
  const push = (label: string, series: unknown, fmt: (v: number) => string) => {
    const [a, b] = tail2(series);
    if (b == null) return;
    items.push({ label, value: fmt(b), delta: pctChange(b, a) });
  };

  push("GUJ-29", daily("guj29"), (v) => "₹" + v.toLocaleString("en-IN"));
  push("MMAK-29", daily("mmak29"), (v) => "₹" + v.toLocaleString("en-IN"));
  push("ICE #2", ICE_D_V, (v) => v.toFixed(2) + "¢");
  push("BRENT", BR_M_V, (v) => "$" + v.toFixed(1));
  push("USD/INR", USDINR_M_V, (v) => "₹" + v.toFixed(2));
  push("USD/CNY", USDCNY_M_V, (v) => "¥" + v.toFixed(3));

  const impSeason = IE.actual_cutoff?.season;
  const seasons = IE.seasons ?? [];
  const imp = impSeason ? IE.import_totals?.[impSeason] : undefined;
  const impPrev = impSeason
    ? IE.import_totals?.[seasons[seasons.indexOf(impSeason) - 1]]
    : undefined;
  if (typeof imp === "number") {
    items.push({
      label: "IMPORTS " + impSeason,
      value: imp.toFixed(1) + " lb",
      delta: pctChange(imp, impPrev ?? null),
    });
  }

  return items;
}

export function MarketTicker() {
  const items = build();
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-t border-line bg-surface">
      <div className="ticker-track flex w-max items-center gap-6 py-1.5">
        {doubled.map((it, i) => (
          <span key={i} className="flex items-center gap-1.5 whitespace-nowrap px-1 text-[11px]">
            <span className="font-semibold tracking-wide text-ink-faint">{it.label}</span>
            <span className="num font-semibold text-ink">{it.value}</span>
            <span
              className={clsx(
                "num text-[10px] font-semibold",
                it.delta == null || Math.abs(it.delta) < 0.05
                  ? "text-ink-faint"
                  : it.delta > 0
                    ? "text-pos"
                    : "text-neg",
              )}
            >
              {it.delta == null
                ? ""
                : (it.delta >= 0 ? "▲" : "▼") + " " + Math.abs(it.delta).toFixed(2) + "%"}
            </span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent" />
    </div>
  );
}
