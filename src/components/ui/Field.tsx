"use client";

import clsx from "clsx";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-ink-faint">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="num w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-faint/70 focus:border-accent focus:bg-surface focus:ring-2 focus:ring-[var(--ring)]"
      />
    </label>
  );
}

export function ResultTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "green" | "red" | "amber" | "blue";
}) {
  return (
    <div
      className={clsx(
        "rounded-xl p-3.5 text-center ring-1",
        tone === "neutral" && "bg-surface-2 ring-line",
        tone === "green" && "bg-pos-soft ring-pos/20",
        tone === "red" && "bg-neg-soft ring-neg/20",
        tone === "amber" && "bg-warn-soft ring-warn/20",
        tone === "blue" && "bg-info-soft ring-info/20",
      )}
    >
      <div className="text-[10.5px] font-medium text-ink-faint">{label}</div>
      <div
        className={clsx(
          "num mt-1 text-lg font-semibold",
          tone === "green" && "text-pos",
          tone === "red" && "text-neg",
          tone === "amber" && "text-warn",
          tone === "blue" && "text-info",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function btnPrimary() {
  return "focusable w-full rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-contrast transition-all hover:bg-accent-strong hover:shadow-[0_6px_20px_-6px_var(--accent)]";
}
