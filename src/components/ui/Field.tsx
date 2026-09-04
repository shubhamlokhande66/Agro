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
      <span className="mb-1 block text-[11px] text-ink-faint">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13px] outline-none focus:border-brand-navy"
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
        "rounded-lg p-3 text-center",
        tone === "neutral" && "bg-surface2",
        tone === "green" && "bg-pos-bg",
        tone === "red" && "bg-neg-bg",
        tone === "amber" && "bg-warn-bg",
        tone === "blue" && "bg-info-bg",
      )}
    >
      <div className="text-[11px] text-ink-faint">{label}</div>
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
  return "w-full rounded-lg bg-brand-navy px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-navy-deep";
}
