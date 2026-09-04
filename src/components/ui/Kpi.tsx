import clsx from "clsx";

type Accent = "green" | "amber" | "blue" | "red" | "violet";

const BAR: Record<Accent, string> = {
  green: "bg-brand-green",
  amber: "bg-warn",
  blue: "bg-info",
  red: "bg-neg",
  violet: "bg-[#8b5cf6]",
};

export function Kpi({
  label,
  value,
  unit,
  accent = "green",
  foot,
}: {
  label: string;
  value: React.ReactNode;
  unit?: React.ReactNode;
  accent?: Accent;
  foot?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-surface p-3.5">
      <span
        className={clsx("absolute inset-x-0 top-0 h-[3px]", BAR[accent])}
      />
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">
        {label}
      </div>
      <div className="num mt-1 text-lg font-bold leading-none text-ink sm:text-xl">
        {value}
      </div>
      {unit ? (
        <div className="num mt-1 text-[10px] text-ink-faint">{unit}</div>
      ) : null}
      {foot ? <div className="mt-1.5">{foot}</div> : null}
    </div>
  );
}

export function KpiRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {children}
    </div>
  );
}
