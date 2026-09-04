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
  const arrow = kind === "flat" ? "•" : kind === "up" ? "▲" : "▼";
  return (
    <span
      className={clsx(
        "num inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-tight ring-1",
        kind === "up" && "bg-pos-soft text-pos ring-pos/25",
        kind === "down" && "bg-neg-soft text-neg ring-neg/25",
        kind === "flat" && "bg-surface-2 text-ink-faint ring-line",
      )}
    >
      {label ? (
        <span className="text-[8px] font-bold uppercase tracking-wide opacity-70">
          {label}
        </span>
      ) : null}
      <span className="text-[8px]">{arrow}</span>
      {signedPct(value)}
    </span>
  );
}

export function Delta({ value, suffix = "%" }: { value: number | null; suffix?: string }) {
  const kind = classForChange(value);
  return (
    <span
      className={clsx(
        "num inline-flex items-center gap-0.5 text-xs font-semibold",
        kind === "up" && "text-pos",
        kind === "down" && "text-neg",
        kind === "flat" && "text-ink-faint",
      )}
    >
      {kind !== "flat" ? (
        <span className="text-[8px]">{kind === "up" ? "▲" : "▼"}</span>
      ) : null}
      {value == null ? "—" : (value >= 0 ? "+" : "") + value.toFixed(1) + suffix}
    </span>
  );
}
