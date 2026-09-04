import clsx from "clsx";
import { classForChange, signedPct } from "@/lib/format";

export function ChangeBadge({
  label,
  value,
}: {
  label?: string;
  value: number | null;
}) {
  const kind = classForChange(value);
  const arrow = kind === "flat" ? "" : kind === "up" ? "▲" : "▼";
  return (
    <span
      className={clsx(
        "num inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold leading-tight",
        kind === "up" && "border-[#9ae6cb] bg-[#edfaf5] text-[#0d9e77]",
        kind === "down" && "border-[#f5b8b8] bg-[#fff2f2] text-[#e84343]",
        kind === "flat" && "border-line bg-surface2 text-ink-faint",
      )}
    >
      {label ? (
        <span className="text-[8px] font-bold uppercase tracking-wide opacity-80">
          {label}
        </span>
      ) : null}
      {arrow} {signedPct(value)}
    </span>
  );
}

export function Delta({ value, suffix = "%" }: { value: number | null; suffix?: string }) {
  const kind = classForChange(value);
  return (
    <span
      className={clsx(
        "num text-xs font-semibold",
        kind === "up" && "text-pos",
        kind === "down" && "text-neg",
        kind === "flat" && "text-ink-faint",
      )}
    >
      {value == null
        ? "—"
        : (value >= 0 ? "+" : "") + value.toFixed(1) + suffix}
    </span>
  );
}
