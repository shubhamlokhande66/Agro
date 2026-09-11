"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { ChangeBadge } from "@/components/ui/ChangeBadge";
import AreaChart from "@/components/charts/AreaChart";
import {
  DOM_PERIOD_OPTS,
  latestAnnual,
  latestDaily,
  sliceVariety,
  type DomPeriod,
  type Variety,
} from "@/data/prices";
import { inr, inrCompact, pctChange, shortDate } from "@/lib/format";

export function PriceCard({ v }: { v: Variety }) {
  const [period, setPeriod] = useState<DomPeriod>("monthly");
  const sliced = sliceVariety(v, period);
  const latestQuote = latestDaily(v);

  const annualValid = [...(v.annual ?? [])]
    .sort((a, b) => a.year.localeCompare(b.year))
    .map((p) => p.value);
  const latest = annualValid.at(-1) ?? null;
  const n = annualValid.length;
  const wk = pctChange(latest, annualValid[n - 2] ?? null);
  const mo = pctChange(latest, n >= 4 ? annualValid[n - 4] : null);
  const yr = pctChange(latest, n >= 6 ? annualValid[n - 6] : (annualValid[0] ?? null));

  const headlinePrice = latestQuote?.price ?? latest;
  const headlineCaption = latestQuote
    ? `${shortDate(latestQuote.date)} ${latestQuote.date.slice(0, 4)}`
    : `FY ${latestAnnual(v)?.year ?? "—"}`;

  return (
    <div className="panel panel-hover p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold leading-tight tracking-tight text-ink">
            {v.title}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-faint">{v.sub}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="num text-[15px] font-semibold text-accent">{inr(headlinePrice)}</div>
          <div className="num text-[10px] text-ink-faint">{headlineCaption}</div>
        </div>
      </div>

      <div className="mb-2 flex justify-end">
        <Tabs options={DOM_PERIOD_OPTS} value={period} onChange={setPeriod} />
      </div>

      <AreaChart
        labels={sliced.labels}
        data={sliced.data}
        height={164}
        smartX={period !== "monthly"}
        yFmt={inrCompact}
        xTicks={period === "monthly" ? 6 : period === "1y" ? 2 : 6}
        tooltipLabel={(y) => inr(y)}
      />

      <div className="mt-2.5 flex flex-wrap justify-end gap-1.5">
        <ChangeBadge label="1yr" value={wk} />
        <ChangeBadge label="3yr" value={mo} />
        <ChangeBadge label="5yr" value={yr} />
      </div>
    </div>
  );
}
