"use client";

import clsx from "clsx";
import type { HeroCategory } from "./HeroChart";

export const HERO_CATEGORIES: { value: HeroCategory; label: string }[] = [
  { value: "cotton", label: "Global Cotton" },
  { value: "kapas", label: "Kapas" },
  { value: "cseed", label: "Cotton Seed" },
  { value: "yarn", label: "Cotton Yarn" },
  { value: "inr", label: "INR" },
  { value: "crude", label: "Crude Oil" },
];

/** The right-hand "6 category tabs" rail from the requirements doc — switches which
 *  series the Overview hero chart shows. */
export function HeroCategoryRail({
  value,
  onChange,
}: {
  value: HeroCategory;
  onChange: (v: HeroCategory) => void;
}) {
  return (
    <div className="flex flex-row flex-wrap gap-1.5 lg:flex-col lg:gap-2">
      {HERO_CATEGORIES.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className={clsx(
            "focusable rounded-xl border px-3.5 py-2.5 text-left text-[12.5px] font-semibold transition-colors",
            value === c.value
              ? "border-accent bg-accent text-accent-contrast shadow-[0_4px_14px_-4px_var(--accent)]"
              : "border-line bg-surface text-ink-soft hover:border-accent hover:text-ink",
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
