"use client";

import clsx from "clsx";

type Opt<T extends string> = { value: T; label: React.ReactNode };

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  size = "sm",
}: {
  options: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "rounded-md border font-medium transition-colors",
            size === "sm"
              ? "px-2.5 py-1 text-[11px]"
              : "px-3.5 py-1.5 text-xs",
            value === o.value
              ? "border-brand-green bg-brand-green text-white"
              : "border-line bg-transparent text-ink-soft hover:bg-surface2",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** pill segmented control (used for the big Domestic / International switch) */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-card border border-line bg-surface p-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "rounded-lg px-4 py-2 text-[13px] font-medium transition-all",
            value === o.value
              ? "bg-brand-green text-white shadow-[0_2px_8px_rgba(13,158,119,0.3)]"
              : "text-ink-soft hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
