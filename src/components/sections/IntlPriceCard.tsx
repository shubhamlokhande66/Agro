"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { ChangeBadge } from "@/components/ui/ChangeBadge";
import AreaChart from "@/components/charts/AreaChart";
import { DOM_PERIOD_OPTS, type DomPeriod } from "@/data/prices";
import { pctChange, shortDate } from "@/lib/format";
import { deltaOverPeriod, sliceByDays, type GlobalPeriod } from "@/lib/period";

type Series = { l: string[]; v: number[] };

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "28/09/26" -> "2026-09-28" */
const dailyIso = (l: string) => {
  const [d, m, y] = l.split("/");
  return `20${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};
/** "2026-03" -> "Mar '26" */
const monthShort = (l: string) => `${MONTHS_SHORT[+l.slice(5, 7) - 1] ?? l} '${l.slice(2, 4)}`;

/** same periods as the domestic price cards:
 *  - monthly: last ~31 days of daily settlements
 *  - 1y: last year of daily settlements
 *  - 3y: last 36 monthly averages
 *  - all: the full annual-average history */
function slice(daily: Series, monthly: Series, annual: Series, period: DomPeriod) {
  if (period === "monthly" || period === "1y") {
    const s = sliceByDays(daily.l, daily.v, period === "monthly" ? 31 : 366);
    return {
      labels: (s.labels as string[]).map((l) => {
        const iso = dailyIso(l);
        return period === "monthly" ? shortDate(iso) : `${shortDate(iso)} '${iso.slice(2, 4)}`;
      }),
      data: s.values,
    };
  }
  if (period === "3y") return { labels: monthly.l.slice(-36).map(monthShort), data: monthly.v.slice(-36) };
  return { labels: annual.l, data: annual.v };
}

/** change of the latest monthly average vs `months` earlier */
const monthlyDelta = (m: Series, months: number) => pctChange(m.v.at(-1) ?? null, m.v.at(-1 - months) ?? null);

/** An international benchmark (ICE cotton, Brent) laid out like the domestic PriceCard. */
export function IntlPriceCard({
  title,
  sub,
  daily,
  monthly,
  annual,
  fmt,
  color,
  globalPeriod,
}: {
  title: string;
  sub: string;
  daily: Series;
  monthly: Series;
  annual: Series;
  fmt: (v: number) => string;
  color?: string;
  globalPeriod?: GlobalPeriod;
}) {
  const [period, setPeriod] = useState<DomPeriod>("monthly");
  const sliced = slice(daily, monthly, annual, period);

  const latest = daily.v.at(-1) ?? monthly.v.at(-1) ?? null;
  const latestLabel = daily.l.at(-1);
  const caption = latestLabel ? `${shortDate(dailyIso(latestLabel))} 20${latestLabel.slice(-2)}` : (monthly.l.at(-1) ?? "—");
  const windowDelta = globalPeriod ? deltaOverPeriod(daily.l, daily.v, globalPeriod).pct : null;

  return (
    <div className="panel panel-hover p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold leading-tight tracking-tight text-ink">{title}</div>
          <div className="mt-0.5 text-[11px] text-ink-faint">{sub}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="num text-[15px] font-semibold text-accent">{latest != null ? fmt(latest) : "—"}</div>
          <div className="num text-[10px] text-ink-faint">{caption}</div>
        </div>
      </div>

      <div className="mb-2 flex justify-end">
        <Tabs options={DOM_PERIOD_OPTS} value={period} onChange={setPeriod} />
      </div>

      <AreaChart
        labels={sliced.labels}
        data={sliced.data}
        color={color}
        height={190}
        smartX={period !== "monthly"}
        yFmt={fmt}
        xTicks={6}
        tooltipLabel={(y) => fmt(y)}
      />

      <div className="mt-2.5 flex flex-wrap justify-end gap-1.5">
        {globalPeriod ? <ChangeBadge label={globalPeriod.toUpperCase()} value={windowDelta} /> : null}
        <ChangeBadge label="1yr" value={monthlyDelta(monthly, 12)} />
        <ChangeBadge label="3yr" value={monthlyDelta(monthly, 36)} />
        <ChangeBadge label="5yr" value={monthlyDelta(monthly, 60)} />
      </div>
    </div>
  );
}
