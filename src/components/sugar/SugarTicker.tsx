"use client";

import clsx from "clsx";
import { SUGAR_PRICES, SUGAR_SAMPLE, whitePremium } from "@/data/sugar/sample";

/** the scrolling strip under the top bar: latest sugar prices and their month-on-month change */
export function SugarTicker() {
  const items = [
    ...SUGAR_PRICES.filter((p) => ["m30_muzaffarnagar", "s30_kolhapur", "s30_vashi", "ice11", "ldn5", "usdinr"].includes(p.key)).map((p) => ({
      label: p.label.split(" · ")[0] + (p.label.includes("·") ? ` ${p.label.split(" · ")[1].split(" ")[0]}` : ""),
      v: p.values.at(-1)!,
      prev: p.values.at(-2)!,
      digits: p.digits,
    })),
    (() => {
      const w = whitePremium();
      return { label: "White premium", v: w.at(-1)!, prev: w.at(-2)!, digits: 1 };
    })(),
  ];
  return (
    <div className="flex gap-6 overflow-x-auto border-b border-line bg-surface px-4 py-1.5 text-[11.5px] sm:px-6">
      {SUGAR_SAMPLE.sugarPrices ? <span className="shrink-0 rounded bg-amber-100 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-amber-800">Sample</span> : null}
      {items.map((it) => {
        const ch = ((it.v - it.prev) / Math.abs(it.prev)) * 100;
        return (
          <span key={it.label} className="num flex shrink-0 items-center gap-1.5">
            <span className="text-ink-faint">{it.label}</span>
            <span className="font-semibold text-ink">{it.v.toLocaleString("en-IN", { maximumFractionDigits: it.digits, minimumFractionDigits: it.digits })}</span>
            <span className={clsx("font-semibold", ch > 0.05 ? "text-pos" : ch < -0.05 ? "text-neg" : "text-ink-faint")}>
              {ch > 0 ? "▲" : ch < 0 ? "▼" : ""}
              {Math.abs(ch).toFixed(1)}%
            </span>
          </span>
        );
      })}
    </div>
  );
}
