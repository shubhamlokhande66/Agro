"use client";

import clsx from "clsx";
import { VARIETIES } from "@/data/prices";
import { ICE_D_V, BR_M_V } from "@/data/international";
import { USDINR_M_V, USDCNY_M_V } from "@/data/currency";
import { IE } from "@/data/trade";
import { pctChange } from "@/lib/format";

type Item = { label: string; value: string; delta: number | null };

function last2<T>(a: T[]): [T, T] {
  return [a[a.length - 2], a[a.length - 1]];
}

function build(): Item[] {
  const guj29 = VARIETIES.find((v) => v.key === "guj29")!;
  const mmak29 = VARIETIES.find((v) => v.key === "mmak29")!;
  const [gA, gB] = last2(guj29.daily);
  const [mA, mB] = last2(mmak29.daily);
  const [iceA, iceB] = last2(ICE_D_V);
  const [brA, brB] = last2(BR_M_V);
  const [inrA, inrB] = last2(USDINR_M_V);
  const [cnyA, cnyB] = last2(USDCNY_M_V);
  const seasons = IE.seasons;
  const impLatest = IE.import_totals[IE.actual_cutoff.season];
  const impPrev = IE.import_totals[seasons[seasons.indexOf(IE.actual_cutoff.season) - 1]];

  return [
    { label: "GUJ-29", value: "₹" + gB.toLocaleString("en-IN"), delta: pctChange(gB, gA) },
    { label: "MMAK-29", value: "₹" + mB.toLocaleString("en-IN"), delta: pctChange(mB, mA) },
    { label: "ICE #2", value: iceB.toFixed(2) + "¢", delta: pctChange(iceB, iceA) },
    { label: "BRENT", value: "$" + brB.toFixed(1), delta: pctChange(brB, brA) },
    { label: "USD/INR", value: "₹" + inrB.toFixed(2), delta: pctChange(inrB, inrA) },
    { label: "USD/CNY", value: "¥" + cnyB.toFixed(3), delta: pctChange(cnyB, cnyA) },
    { label: "IMPORTS 25-26", value: impLatest.toFixed(1) + " lb", delta: pctChange(impLatest, impPrev) },
  ];
}

export function MarketTicker() {
  const items = build();
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
