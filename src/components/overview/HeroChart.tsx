"use client";

import { useEffect, useMemo, useState } from "react";
import AreaChart from "@/components/charts/AreaChart";
import { GlobalPeriodTabs } from "@/components/ui/GlobalPeriodTabs";
import { Delta } from "@/components/ui/ChangeBadge";
import { sliceByPeriod, deltaOverPeriod, type GlobalPeriod } from "@/lib/period";
import { VARIETIES, dailySeries } from "@/data/prices";
import { ICE_D_L, ICE_D_V, BR_M_L, BR_M_V } from "@/data/international";
import { USDINR_M_L, USDINR_M_V } from "@/data/currency";
import { inr, inrCompact } from "@/lib/format";

export type HeroCategory = "domestic" | "cotton" | "kapas" | "cseed" | "yarn" | "inr" | "crude";

function varietyDaily(key: string) {
  return dailySeries(VARIETIES.find((x) => x.key === key));
}

export function seriesFor(cat: HeroCategory): {
  title: string;
  labels: (string | number)[];
  values: (number | null)[];
  unit: string;
  headlineFmt: (v: number) => string;
  axisFmt: (v: number) => string;
  tooltipFmt: (v: number) => string;
} {
  switch (cat) {
    case "domestic":
      return { title: "Gujarat Shankar-29 (Guj-29)", ...varietyDaily("guj29"), unit: "₹/Candy", headlineFmt: (v) => inr(v), axisFmt: inrCompact, tooltipFmt: (v) => inr(v) };
    case "cotton":
      return { title: "Global Cotton (ICE #2)", labels: ICE_D_L, values: ICE_D_V, unit: "¢/lb", headlineFmt: (v) => v.toFixed(2), axisFmt: (v) => v + "¢", tooltipFmt: (v) => v + "¢/lb" };
    case "kapas":
      return { title: "Kapas (Raw Cotton)", ...varietyDaily("kapas"), unit: "₹/Candy", headlineFmt: (v) => inr(v), axisFmt: inrCompact, tooltipFmt: (v) => inr(v) };
    case "cseed":
      return { title: "Cotton Seed", ...varietyDaily("cseed"), unit: "₹/Quintal", headlineFmt: (v) => inr(v), axisFmt: inrCompact, tooltipFmt: (v) => inr(v) };
    case "yarn":
      return { title: "Cotton Yarn", ...varietyDaily("yarn"), unit: "₹/kg", headlineFmt: (v) => inr(v), axisFmt: inrCompact, tooltipFmt: (v) => inr(v) };
    case "inr":
      return { title: "USD / INR", labels: USDINR_M_L, values: USDINR_M_V, unit: "₹ per $", headlineFmt: (v) => v.toFixed(2), axisFmt: (v) => v.toFixed(1), tooltipFmt: (v) => "₹" + v.toFixed(2) };
    case "crude":
      return { title: "Crude Oil (Brent)", labels: BR_M_L, values: BR_M_V, unit: "$/bbl", headlineFmt: (v) => v.toFixed(2), axisFmt: (v) => "$" + v, tooltipFmt: (v) => "$" + v + "/bbl" };
  }
}

/** The Overview page's featured chart — switches between domestic Guj-29 and the
 *  doc's 6 categories via the right-hand rail. Its period is the page-level 1W–5Y filter, so
 *  the hero's own buttons and the header buttons stay in sync. */
export function HeroChart({
  category,
  period,
  onPeriodChange,
}: {
  category: HeroCategory;
  period: GlobalPeriod;
  onPeriodChange: (p: GlobalPeriod) => void;
}) {
  const src = useMemo(() => seriesFor(category), [category]);
  const sliced = useMemo(() => sliceByPeriod(src.labels, src.values, period), [src, period]);
  const delta = useMemo(() => deltaOverPeriod(src.labels, src.values, period), [src, period]);
  const last = src.values.at(-1) ?? null;
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div className="panel flex flex-col p-4 sm:p-5">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow">{src.title}</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="num text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {last != null ? src.headlineFmt(last) : "—"}
            </span>
            <span className="num pb-0.5 text-[11px] text-ink-faint">{src.unit}</span>
            <span className="pb-0.5">
              <Delta value={delta.pct} />
            </span>
          </div>
        </div>
        <GlobalPeriodTabs value={period} onChange={onPeriodChange} />
      </div>
      <div className={compact ? "relative h-[220px]" : "relative min-h-[300px] flex-1"}>
        <AreaChart
          labels={sliced.labels}
          data={sliced.values}
          height="fill"
          smartX={false}
          xTicks={6}
          yFmt={src.axisFmt}
          tooltipLabel={src.tooltipFmt}
        />
      </div>
    </div>
  );
}
