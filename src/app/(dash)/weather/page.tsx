"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Tabs } from "@/components/ui/Tabs";
import AreaChart from "@/components/charts/AreaChart";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { CommentsPanel } from "@/components/ui/CommentsPanel";
import {
  RFH,
  RF_COMPOSITE_T,
  RF_MONTHS_L,
  RF_STATES,
  RF_ALL_YEARS,
  RF_YEAR_PALETTE,
  jjas,
  seasonTotal,
  cumulative,
  pctDeviation,
} from "@/data/rainfall";
import { signedPct, pctChange } from "@/lib/format";

type Year = string; // a year string from RF_ALL_YEARS, or "all"

export default function WeatherPage() {
  // computed at render time (not module scope) so it reflects RF_ALL_YEARS once hydrated
  const YEARS = [...RF_ALL_YEARS.filter((y) => Number(y) >= 2021), "all"];
  const latestYear = RF_ALL_YEARS.at(-1) ?? "2025";
  // don't default the page to a season-in-progress year — jjas()/seasonTotal() would count
  // its unreported months as 0 rainfall, making the KPIs look worse than they really are;
  // the composite series is the most complete one, so completeness is checked against it
  const seasonComplete = (y: string) => (RF_COMPOSITE_T["y" + y] ?? []).every((v) => v != null);
  const defaultYear = [...RF_ALL_YEARS].reverse().find(seasonComplete) ?? latestYear;

  const [stateName, setStateName] = useState<string>(RF_STATES[0] ?? "Maharashtra");
  const isComposite = stateName === "_composite";
  const subs = useMemo(
    () => (isComposite ? [] : Object.keys(RFH[stateName] ?? {})),
    [isComposite, stateName],
  );
  const [sub, setSub] = useState<string>("_state");
  const [year, setYear] = useState<Year>(defaultYear);

  const series = useMemo(() => {
    if (isComposite)
      return {
        label: "All cotton states (weighted)",
        normal: RF_COMPOSITE_T.normal ?? [],
        ...RF_COMPOSITE_T,
      };
    const block = RFH[stateName] ?? {};
    return block[subs.includes(sub) ? sub : "_state"] ?? { label: stateName, normal: [] };
  }, [isComposite, stateName, sub, subs]);

  const normal = series.normal ?? [];
  const yv = (y: string): number[] | undefined =>
    isComposite
      ? RF_COMPOSITE_T["y" + y]
      : (series as unknown as Record<string, number[]>)["y" + y];

  const effectiveYear = year === "all" ? defaultYear : year;
  const selYearData = yv(effectiveYear);
  // the year immediately before whichever year is actually being shown — not just
  // "second-to-latest overall", so it stays a meaningful pair even while the latest
  // year in RF_ALL_YEARS is still a season in progress
  const prevYear = RF_ALL_YEARS[RF_ALL_YEARS.indexOf(effectiveYear) - 1] ?? effectiveYear;

  const jjasSel = jjas(selYearData);
  const jjasNormal = jjas(normal);
  const seasonSel = seasonTotal(selYearData);
  const seasonNormal = seasonTotal(normal);

  // filter out not-yet-reported months (null, e.g. a season in progress) before
  // finding the extremes — Math.min/max coerce null to 0, which would otherwise
  // misreport (or blank out) the driest month as an unreported one
  const reported = (selYearData ?? [])
    .map((v, i) => ({ v, i }))
    .filter((e): e is { v: number; i: number } => e.v != null);
  const peak = reported.length
    ? RF_MONTHS_L[reported.reduce((a, b) => (b.v > a.v ? b : a)).i]
    : "—";
  const dry = reported.length
    ? RF_MONTHS_L[reported.reduce((a, b) => (b.v < a.v ? b : a)).i]
    : "—";

  return (
    <div>
      <PageHeader
        title="Weather & Rainfall" icon="☂"
        sub={`IMD subdivision rainfall · May–Dec cotton season · ${RF_ALL_YEARS[0] ?? "2012"}–${latestYear}`}
        dataset="rainfall"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStateName("_composite")}
          className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium ${
            isComposite
              ? "border-accent bg-accent text-accent-contrast"
              : "border-line bg-surface text-ink-soft hover:border-accent"
          }`}
        >
          🇮🇳 Composite
        </button>
        {RF_STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStateName(s);
              setSub("_state");
            }}
            className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium ${
              stateName === s
                ? "border-accent bg-accent text-accent-contrast"
                : "border-line bg-surface text-ink-soft hover:border-accent"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {!isComposite && subs.length > 1 ? (
          <select
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px]"
          >
            {subs.map((sk) => (
              <option key={sk} value={sk}>
                {sk === "_state" ? "State average (all subdivisions)" : RFH[stateName][sk].label}
              </option>
            ))}
          </select>
        ) : null}
        <Tabs
          options={YEARS.map((y) => ({ value: y, label: y === "all" ? "All years" : y === latestYear ? `${y} ★` : y }))}
          value={year}
          onChange={setYear}
        />
      </div>

      <KpiRow>
        <Kpi
          label="JJAS total"
          value={jjasSel != null ? Math.round(jjasSel) : "—"}
          unit="mm · Jun–Sep"
          foot={
            <span className="num text-[11px] text-ink-faint">
              vs normal {signedPct(pctChange(jjasSel, jjasNormal), 0)}
            </span>
          }
        />
        <Kpi
          label="Season total"
          value={seasonSel != null ? Math.round(seasonSel) : "—"}
          unit="mm · May–Dec"
          accent="amber"
          foot={
            <span className="num text-[11px] text-ink-faint">
              vs normal {signedPct(pctChange(seasonSel, seasonNormal), 0)}
            </span>
          }
        />
        <Kpi label="Peak month" value={peak} accent="blue" unit={effectiveYear} />
        <Kpi label="Driest month" value={dry} accent="red" unit={effectiveYear} />
      </KpiRow>

      <div className="mt-5 space-y-3.5">
        <Card>
          <CardHeader
            title={year === "all" ? "Cumulative rainfall — by year (May–Dec)" : "Monthly rainfall — cotton crop season (May–Dec)"}
            sub={year === "all" ? `Running total · ${latestYear} (dashed) vs prior years` : "Selected year vs LPA normal (dashed)"}
          />
          {year === "all" ? (
            <LineChart
              labels={RF_MONTHS_L}
              series={[
                ...RF_ALL_YEARS.map((y) => ({
                  label: y,
                  data: cumulative(yv(y)),
                  color: (RF_YEAR_PALETTE as Record<string, string>)[y] ?? "#cbd5e1",
                  width: y === latestYear ? 2.5 : 1,
                  dashed: y === latestYear,
                })),
                { label: "Normal", data: cumulative(normal), color: "#c97b1e", width: 1.5 },
              ]}
              yFmt={(v) => Math.round(v) + "mm"}
              tooltipLabel={(c) => `${c.dataset.label}: ${Math.round(c.parsed.y)} mm`}
              smartX={false}
              height={300}
            />
          ) : (
            <AreaChart
              labels={RF_MONTHS_L}
              data={selYearData ?? []}
              color="#2d7d46"
              height={280}
              smartX={false}
              yFmt={(v) => v + "mm"}
              tooltipLabel={(y) => Math.round(y) + " mm"}
            />
          )}
          {year !== "all" ? (
            <p className="mt-2 text-[11px] italic text-ink-faint">
              Normal (LPA):{" "}
              {RF_MONTHS_L.map((m, i) => `${m} ${Math.round(normal[i])}`).join(" · ")}
            </p>
          ) : null}
        </Card>

        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <Card>
            <CardHeader title="JJAS season — year on year (mm)" sub="Green = above normal" />
            <BarChart
              labels={RF_ALL_YEARS}
              series={[
                {
                  data: RF_ALL_YEARS.map((y) => jjas(yv(y))),
                  colors: RF_ALL_YEARS.map((y) => {
                    const v = jjas(yv(y));
                    return v != null && jjasNormal != null && v >= jjasNormal
                      ? "#2d7d46"
                      : "#c97b1e";
                  }),
                },
              ]}
              smartX={false}
              height={220}
            />
          </Card>

          <Card>
            <CardHeader
              title="% deviation from normal"
              sub={`${prevYear} vs ${effectiveYear}`}
            />
            <BarChart
              labels={RF_MONTHS_L}
              series={[
                { label: prevYear, data: pctDeviation(yv(prevYear), normal), color: "#94a3b8" },
                {
                  label: effectiveYear,
                  data: pctDeviation(selYearData, normal),
                  color: "#2d7d46",
                },
              ]}
              legend
              yFmt={(v) => Math.round(v) + "%"}
              tooltipLabel={(c) => {
                const v = c.parsed.y;
                return `${c.dataset.label}: ${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
              }}
              smartX={false}
              height={220}
            />
          </Card>
        </div>

        <CommentsPanel section="weather" />
      </div>
    </div>
  );
}
