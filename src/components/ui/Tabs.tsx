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
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "focusable rounded-lg font-medium transition-colors",
            size === "sm" ? "px-2.5 py-1 text-[11.5px]" : "px-3.5 py-1.5 text-[12.5px]",
            value === o.value
              ? "bg-surface text-ink shadow-sm ring-1 ring-line"
              : "text-ink-faint hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** pill segmented control (large — used for the Domestic / International switch) */
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
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "focusable rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-all",
            value === o.value
              ? "bg-accent text-accent-contrast shadow-[0_4px_14px_-4px_var(--accent)]"
              : "text-ink-soft hover:bg-surface-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>(props: {
  options: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return <SegmentedTabs {...props} />;
}
