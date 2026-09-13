"use client";

import Link from "next/link";
import { Card, CardHeader, SectionLabel } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { ChangeBadge, Delta } from "@/components/ui/ChangeBadge";
import Sparkline from "@/components/charts/Sparkline";
import AreaChart from "@/components/charts/AreaChart";
import LineChart from "@/components/charts/LineChart";
import {
  VARIETIES,
  annualDeltas,
  annualDeltasFromSeries,
  recentPrices,
  sliceVariety,
  weeklyChange,
  type Variety,
} from "@/data/prices";
import { ICE_ANN_V, ICE_D_L, ICE_D_V } from "@/data/international";
import { SND } from "@/data/balanceSheet";
import { DP_DATA } from "@/data/production";
import { IE } from "@/data/trade";
import { RF_COMPOSITE_T, RF_MONTHS_L, jjas } from "@/data/rainfall";
import { SOWING_SERIES, SOWING_WEEKS } from "@/data/sowing";
import { inr, inrCompact, num, pctChange, signedPct, todayStamp } from "@/lib/format";

const at = <T,>(a: T[] | undefined, i: number): T | undefined =>
  Array.isArray(a) ? a.at(i) : undefined;

function variety(key: string) {
  return VARIETIES.find((v) => v.key === key);
}

/** "By-product · ₹ / Quintal" -> "/ Quintal" */
function unitOf(v: Variety | undefined): string {
  const part = v?.sub?.split("/").pop()?.trim();
  return part ? `/ ${part}` : "/ Candy";
}

/** "02/06/26" -> epoch ms */
function parseDMY(label: string): number {
  const [d, m, y] = label.split("/").map(Number);
  const fullYear = y < 100 ? 2000 + y : y;
  return new Date(fullYear, (m || 1) - 1, d || 1).getTime();
}

/** % change vs. the quote closest to (but not after) 7 calendar days before the latest quote —
 *  for label/value series (like ICE) that aren't a `Variety` with dated points */
function weeklyChangeFromLabels(labels: string[], values: number[]): number | null {
  const lastIdx = values.length - 1;
  if (lastIdx < 0) return null;
  const cutoff = parseDMY(labels[lastIdx]) - 7 * 86400000;
  let prevIdx = -1;
  for (let i = lastIdx - 1; i >= 0; i--) {
    if (parseDMY(labels[i]) <= cutoff) {
      prevIdx = i;
      break;
    }
  }
  if (prevIdx === -1 && lastIdx > 0) prevIdx = 0;
  return pctChange(values[lastIdx], prevIdx >= 0 ? values[prevIdx] : null);
}

export default function OverviewPage() {
  const guj29 = variety("guj29");
  const g = guj29 ? recentPrices(guj29) : [];
  const gLast = at(g, -1) ?? null;
  const gWeek = guj29 ? weeklyChange(guj29) : null;
  const gYears = guj29 ? annualDeltas(guj29) : { y1: null, y3: null, y5: null };

  const iceLast = at(ICE_D_V, -1) ?? null;
  const iceDelta = weeklyChangeFromLabels(ICE_D_L, ICE_D_V);
  const iceYears = annualDeltasFromSeries(ICE_ANN_V);

  const bsSeasons = SND.annual_seasons ?? [];
  const bsLatest = bsSeasons[0];
  const bs = bsLatest ? SND.annual?.[bsLatest] : undefined;
  const bsP = bsSeasons[1] ? SND.annual?.[bsSeasons[1]] : undefined;

  const dpSeasons = DP_DATA.seasons ?? [];
  const prodSeason = at(dpSeasons, -1);
  const prodPrev = at(dpSeasons, -2);
  const prod = prodSeason ? DP_DATA.prod?.[prodSeason]?.ALL_INDIA ?? null : null;
  const prodPrevV = prodPrev ? DP_DATA.prod?.[prodPrev]?.ALL_INDIA ?? null : null;

  const impSeason = IE.actual_cutoff?.season;
  const impSeasons = IE.seasons ?? [];
  const imp = impSeason ? IE.import_totals?.[impSeason] ?? null : null;
  const impPrev = impSeason
    ? IE.import_totals?.[impSeasons[impSeasons.indexOf(impSeason) - 1]] ?? null
    : null;

  const rfYears = Object.keys(RF_COMPOSITE_T)
    .filter((k) => /^y\d{4}$/.test(k))
    .sort();
  const rfLatestKey = rfYears.at(-1);
  const rfLatestYear = rfLatestKey?.slice(1);
  const rfJjas = jjas(RF_COMPOSITE_T[rfLatestKey ?? "y2025"]);
  const rfNormal = jjas(RF_COMPOSITE_T.normal);
  const rfDep = pctChange(rfJjas, rfNormal);

  const topVarieties = VARIETIES.filter((v) =>
    ["guj29", "mmak29", "phr28", "cs31"].includes(v.key),
  );

  const domesticChart = guj29 ? sliceVariety(guj29, "monthly") : { labels: [], data: [] };

  const cseed = variety("cseed");
  const cseedSeries = cseed ? recentPrices(cseed) : [];
  const cseedLast = at(cseedSeries, -1) ?? null;
  const cseedDelta = cseed ? weeklyChange(cseed) : null;
  const cseedChart = cseed ? sliceVariety(cseed, "monthly") : { labels: [], data: [] };
  const cseedYears = cseed ? annualDeltas(cseed) : { y1: null, y3: null, y5: null };

  const yarn = variety("yarn");
  const yarnSeries = yarn ? recentPrices(yarn) : [];
  const yarnLast = at(yarnSeries, -1) ?? null;
  const yarnDelta = yarn ? weeklyChange(yarn) : null;
  const yarnChart = yarn ? sliceVariety(yarn, "monthly") : { labels: [], data: [] };
  const yarnYears = yarn ? annualDeltas(yarn) : { y1: null, y3: null, y5: null };

  const kapas = variety("kapas");
  const kapasSeries = kapas ? recentPrices(kapas) : [];
  const kapasLast = at(kapasSeries, -1) ?? null;
  const kapasDelta = kapas ? weeklyChange(kapas) : null;
  const kapasChart = kapas ? sliceVariety(kapas, "monthly") : { labels: [], data: [] };
  const kapasYears = kapas ? annualDeltas(kapas) : { y1: null, y3: null, y5: null };

  const sowSeries = SOWING_SERIES ?? [];
  const sowNormal = sowSeries.find((s) => /normal/i.test(s.label));
  const sowYears = sowSeries
    .filter((s) => /^\d{4}$/.test(s.label))
    .sort((a, b) => Number(b.label) - Number(a.label));
  const sowCurS = sowYears[0];
  const sowCur = at(sowCurS?.data, -1) ?? null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Agrolytix Research · India Cotton</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Market Overview
          </h1>
          <p className="num mt-1 text-[11px] text-ink-faint">Snapshot as of {todayStamp()}</p>
        </div>
        <Link
          href="/prices"
          className="focusable rounded-xl bg-accent px-4 py-2.5 text-[12.5px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong"
        >
          Open Prices →
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-4 sm:p-5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div className="eyebrow">Gujarat Shankar-29 · Domestic</div>
            <Delta value={gWeek} />
          </div>
          <div className="mb-2 flex items-end gap-2">
            <span className="num text-2xl font-semibold tracking-tight text-ink">{inr(gLast)}</span>
            <span className="num pb-0.5 text-[11px] text-ink-faint">/ Candy</span>
          </div>
          <AreaChart
            labels={domesticChart.labels}
            data={domesticChart.data}
            height={150}
            smartX={false}
            xTicks={5}
            yFmt={inrCompact}
            tooltipLabel={(y) => inr(y)}
          />
          <div className="mt-2.5 flex flex-wrap justify-end gap-1.5">
            <ChangeBadge label="1yr" value={gYears.y1} />
            <ChangeBadge label="3yr" value={gYears.y3} />
            <ChangeBadge label="5yr" value={gYears.y5} />
          </div>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div className="eyebrow">ICE Cotton #2 · International</div>
            <Delta value={iceDelta} />
          </div>
          <div className="mb-2 flex items-end gap-2">
            <span className="num text-2xl font-semibold tracking-tight text-ink">
              {iceLast != null ? iceLast.toFixed(2) : "—"}
            </span>
            <span className="num pb-0.5 text-[11px] text-ink-faint">¢/lb</span>
          </div>
          <AreaChart
            labels={ICE_D_L}
            data={ICE_D_V}
            height={150}
            smartX={false}
            xTicks={5}
            yFmt={(v) => v + "¢"}
            tooltipLabel={(y) => y + "¢/lb"}
          />
          <div className="mt-2.5 flex flex-wrap justify-end gap-1.5">
            <ChangeBadge label="1yr" value={iceYears.y1} />
            <ChangeBadge label="3yr" value={iceYears.y3} />
            <ChangeBadge label="5yr" value={iceYears.y5} />
          </div>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div className="eyebrow">Cotton Sowing · {sowCurS?.label ?? "Current"}</div>
            <Link href="/sowing" className="text-[11px] font-semibold text-accent hover:underline">
              Details →
            </Link>
          </div>
          <div className="mb-2 flex items-end gap-2">
            <span className="num text-2xl font-semibold tracking-tight text-ink">{num(sowCur, 1)}</span>
            <span className="num pb-0.5 text-[11px] text-ink-faint">lakh ha</span>
          </div>
          <LineChart
            labels={SOWING_WEEKS}
            series={[
              ...(sowNormal ? [{ label: sowNormal.label, data: sowNormal.data ?? [], color: "#94a3b8", width: 1, dashed: true }] : []),
              ...(sowCurS ? [{ label: sowCurS.label, data: sowCurS.data ?? [], color: "#ef4444", width: 2.5 }] : []),
            ]}
            height={150}
            smartX={false}
            xTicks={5}
            legend={false}
            tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y} lakh ha`}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel p-4 sm:p-5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div className="eyebrow">Cotton Seed · By-product</div>
            <Delta value={cseedDelta} />
          </div>
          <div className="mb-2 flex items-end gap-2">
            <span className="num text-2xl font-semibold tracking-tight text-ink">{inr(cseedLast)}</span>
            <span className="num pb-0.5 text-[11px] text-ink-faint">{unitOf(cseed)}</span>
          </div>
          <AreaChart
            labels={cseedChart.labels}
            data={cseedChart.data}
            height={150}
            smartX={false}
            xTicks={5}
            yFmt={inrCompact}
            tooltipLabel={(y) => inr(y)}
          />
          <div className="mt-2.5 flex flex-wrap justify-end gap-1.5">
            <ChangeBadge label="1yr" value={cseedYears.y1} />
            <ChangeBadge label="3yr" value={cseedYears.y3} />
            <ChangeBadge label="5yr" value={cseedYears.y5} />
          </div>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div className="eyebrow">Cotton Yarn · Downstream</div>
            <Delta value={yarnDelta} />
          </div>
          <div className="mb-2 flex items-end gap-2">
            <span className="num text-2xl font-semibold tracking-tight text-ink">{inr(yarnLast)}</span>
            <span className="num pb-0.5 text-[11px] text-ink-faint">{unitOf(yarn)}</span>
          </div>
          <AreaChart
            labels={yarnChart.labels}
            data={yarnChart.data}
            height={150}
            smartX={false}
            xTicks={5}
            yFmt={inrCompact}
            tooltipLabel={(y) => inr(y)}
          />
          <div className="mt-2.5 flex flex-wrap justify-end gap-1.5">
            <ChangeBadge label="1yr" value={yarnYears.y1} />
            <ChangeBadge label="3yr" value={yarnYears.y3} />
            <ChangeBadge label="5yr" value={yarnYears.y5} />
          </div>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div className="eyebrow">Kapas (Raw Cotton) · Farm Gate</div>
            <Delta value={kapasDelta} />
          </div>
          <div className="mb-2 flex items-end gap-2">
            <span className="num text-2xl font-semibold tracking-tight text-ink">{inr(kapasLast)}</span>
            <span className="num pb-0.5 text-[11px] text-ink-faint">{unitOf(kapas)}</span>
          </div>
          <AreaChart
            labels={kapasChart.labels}
            data={kapasChart.data}
            height={150}
            smartX={false}
            xTicks={5}
            yFmt={inrCompact}
            tooltipLabel={(y) => inr(y)}
          />
          <div className="mt-2.5 flex flex-wrap justify-end gap-1.5">
            <ChangeBadge label="1yr" value={kapasYears.y1} />
            <ChangeBadge label="3yr" value={kapasYears.y3} />
            <ChangeBadge label="5yr" value={kapasYears.y5} />
          </div>
        </div>
      </div>

      <SectionLabel>Fundamentals at a glance</SectionLabel>
      <KpiRow>
        <Kpi
          label={`Crop${bsLatest ? ` · ${bsLatest}` : ""}`}
          value={num(bs?.crop_size ?? null, 1)}
          unit="lakh bales"
          foot={<Delta value={pctChange(bs?.crop_size ?? null, bsP?.crop_size ?? null)} />}
        />
        <Kpi
          label={`Production${prodSeason ? ` · ${prodSeason.split(" ")[0]}` : ""}`}
          value={num(prod, 1)}
          unit="lakh bales"
          accent="blue"
          foot={<Delta value={pctChange(prod, prodPrevV)} />}
        />
        <Kpi
          label={`Imports${impSeason ? ` · ${impSeason}` : ""}`}
          value={num(imp, 1)}
          unit="lakh bales"
          accent="amber"
          foot={<Delta value={pctChange(imp, impPrev)} />}
        />
        <Kpi
          label={`Monsoon${rfLatestYear ? ` (JJAS ${rfLatestYear})` : ""}`}
          value={signedPct(rfDep, 0)}
          unit="composite vs LPA normal"
          accent={rfDep != null && rfDep < 0 ? "red" : "green"}
          spark={(RF_COMPOSITE_T[rfLatestKey ?? "y2025"] ?? []).slice(0, RF_MONTHS_L.length)}
        />
      </KpiRow>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Key domestic varieties"
            sub="Last month of quotes · ₹ / Candy"
            right={
              <Link href="/prices" className="text-[11px] font-semibold text-accent hover:underline">
                All prices →
              </Link>
            }
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {topVarieties.map((v) => {
              const series = recentPrices(v);
              const last = at(series, -1) ?? null;
              const d = pctChange(last, series[0] ?? null);
              return (
                <div
                  key={v.key}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-ink">{v.title}</div>
                    <div className="num text-[15px] font-semibold text-ink">{inr(last)}</div>
                  </div>
                  <div className="h-8 w-20 shrink-0">
                    <Sparkline data={series} color={d != null && d < 0 ? "#e0605a" : undefined} />
                  </div>
                  <Delta value={d} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Balance sheet" sub={bsLatest ?? undefined} />
          {bs ? (
            <dl className="space-y-2.5 text-[12.5px]">
              {(
                [
                  ["Opening stocks", bs.opening_stocks],
                  ["+ Crop", bs.crop_size],
                  ["+ Imports", bs.imports],
                  ["− Consumption", -bs.domestic_cons],
                  ["− Exports", -bs.exports],
                  ["= Closing stocks", bs.closing_stocks],
                ] as [string, number][]
              ).map(([label, val], i, arr) => (
                <div
                  key={label}
                  className={
                    i === arr.length - 1
                      ? "flex justify-between border-t border-line pt-2.5 font-semibold"
                      : "flex justify-between"
                  }
                >
                  <dt className="text-ink-soft">{label}</dt>
                  <dd className="num text-ink">{num(Math.abs(val), 1)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[12px] text-ink-faint">Balance-sheet data not loaded.</p>
          )}
          <Link
            href="/balance-sheet"
            className="mt-4 inline-flex text-[11px] font-semibold text-accent hover:underline"
          >
            Full balance sheet →
          </Link>
        </Card>
      </div>
    </div>
  );
}
