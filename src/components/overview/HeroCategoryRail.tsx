"use client";

import clsx from "clsx";
import { Delta } from "@/components/ui/ChangeBadge";
import { classForChange } from "@/lib/format";
import { deltaOverPeriod, parseLabelDate, type GlobalPeriod } from "@/lib/period";
import { seriesFor, type HeroCategory } from "./HeroChart";

export const HERO_CATEGORIES: { value: HeroCategory; label: string }[] = [
  { value: "domestic", label: "Gujarat Shankar-29" },
  { value: "cotton", label: "Global Cotton" },
  { value: "kapas", label: "Kapas" },
  { value: "cseed", label: "Cotton Seed" },
  { value: "yarn", label: "Cotton Yarn" },
  { value: "inr", label: "INR" },
  { value: "crude", label: "Crude Oil" },
];

function formatAsOf(label: string | number | undefined): string | null {
  if (label == null) return null;
  const ts = parseLabelDate(label);
  if (ts == null) return String(label);
  const monthly = /^([A-Za-z]{3}-\d{2,4}|\d{4}-\d{2})$/.test(String(label));
  return new Date(ts).toLocaleDateString("en-GB", monthly
    ? { month: "short", year: "numeric" }
    : { day: "2-digit", month: "short", year: "numeric" });
}

/** The right-hand category rail from the requirements doc — a market-ticker style grid of
 *  price cards (name, last value, short-term change), each doubling as the tab that switches
 *  which series the Overview hero chart shows, so the numbers are visible up front instead of
 *  only appearing after a click. */
export function HeroCategoryRail({
  value,
  onChange,
  period,
}: {
  value: HeroCategory;
  onChange: (v: HeroCategory) => void;
  period: GlobalPeriod;
}) {
  return (
    <div className="grid min-w-0 grid-cols-2 content-start gap-2 sm:grid-cols-4 lg:grid-cols-2">
      {HERO_CATEGORIES.map((c) => {
        const src = seriesFor(c.value);
        let li = src.values.length - 1;
        while (li >= 0 && src.values[li] == null) li--;
        const last = li >= 0 ? src.values[li] : null;
        const asOf = li >= 0 ? formatAsOf(src.labels[li]) : null;
        const delta = deltaOverPeriod(src.labels, src.values, period).pct;
        const kind = classForChange(delta);
        const active = value === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={clsx(
              "focusable rounded-xl border p-2.5 text-left transition-colors",
              active
                ? "border-accent ring-1 ring-accent"
                : "border-line hover:border-accent/60",
              !active && kind === "up" && "bg-pos-soft",
              !active && kind === "down" && "bg-neg-soft",
              !active && kind === "flat" && "bg-surface-2",
              active && "bg-accent/10",
            )}
          >
            <div className="truncate text-[10.5px] font-semibold uppercase tracking-wide text-ink-soft">
              {c.label}
            </div>
            <div className="num mt-1 text-[13.5px] font-bold leading-tight text-ink">
              {last != null ? src.headlineFmt(last) : "—"}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <Delta value={delta} />
              {asOf ? (
                <span className="num truncate text-[10px] text-ink-faint">{asOf}</span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
