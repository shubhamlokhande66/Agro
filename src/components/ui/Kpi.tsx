import clsx from "clsx";
import Sparkline from "@/components/charts/Sparkline";

type Accent = "green" | "amber" | "blue" | "red" | "violet";

const DOT: Record<Accent, string> = {
  green: "bg-accent",
  amber: "bg-warn",
  blue: "bg-info",
  red: "bg-neg",
  violet: "bg-violet",
};
const SPARK: Record<Accent, string | undefined> = {
  green: undefined,
  amber: "#e0902f",
  blue: "#2f7fe0",
  red: "#e0605a",
  violet: "#8b6cf0",
};

export function Kpi({
  label,
  value,
  unit,
  accent = "green",
  foot,
  spark,
}: {
  label: string;
  value: React.ReactNode;
  unit?: React.ReactNode;
  accent?: Accent;
  foot?: React.ReactNode;
  spark?: (number | null)[];
}) {
  return (
    <div className="panel panel-hover relative overflow-hidden p-3.5 sm:p-4">
      <div className="flex items-center gap-1.5">
        <span className={clsx("h-1.5 w-1.5 rounded-full", DOT[accent])} />
        <span className="eyebrow text-[9.5px]">{label}</span>
      </div>
      <div className="num mt-2 text-[19px] font-semibold leading-none tracking-tight text-ink sm:text-[22px]">
        {value}
      </div>
      {unit ? (
        <div className="num mt-1.5 text-[10.5px] text-ink-faint">{unit}</div>
      ) : null}
      {spark && spark.length > 1 ? (
        <div className="mt-2.5 -mb-1">
          <Sparkline data={spark} color={SPARK[accent]} height={30} />
        </div>
      ) : null}
      {foot ? <div className="mt-2">{foot}</div> : null}
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
