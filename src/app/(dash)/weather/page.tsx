"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Tabs } from "@/components/ui/Tabs";
import AreaChart from "@/components/charts/AreaChart";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import {
  RFH,
  RF_COMPOSITE_T,
  RF_MONTHS_L,
  RF_STATES,
  RF_ALL_YEARS,
  RF_YEAR_PALETTE,
  jjas,
  seasonTotal,
} from "@/data/rainfall";
import { signedPct, pctChange } from "@/lib/format";

const YEARS = ["2021", "2022", "2023", "2024", "2025", "all"] as const;
type Year = (typeof YEARS)[number];

export default function WeatherPage() {
  const [stateName, setStateName] = useState<string>(RF_STATES[0] ?? "Maharashtra");
  const isComposite = stateName === "_composite";
  const subs = useMemo(
    () => (isComposite ? [] : Object.keys(RFH[stateName] ?? {})),
    [isComposite, stateName],
  );
  const [sub, setSub] = useState<string>("_state");
  const [year, setYear] = useState<Year>("2025");

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

  const selYearData = year === "all" ? yv("2025") : yv(year);

  const jjasSel = jjas(selYearData);
  const jjasNormal = jjas(normal);
  const seasonSel = seasonTotal(selYearData);
  const seasonNormal = seasonTotal(normal);

  const peak = selYearData
    ? RF_MONTHS_L[selYearData.indexOf(Math.max(...selYearData))]
    : "—";
  const dry = selYearData
    ? RF_MONTHS_L[selYearData.indexOf(Math.min(...selYearData))]
    : "—";

  return (
    <div>
      <PageHeader
        title="Weather & Rainfall" icon="☂"
        sub="IMD subdivision rainfall · May–Dec cotton season · 2012–2025"
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
          options={YEARS.map((y) => ({ value: y, label: y === "all" ? "All years" : y === "2025" ? "2025 ★" : y }))}
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
        <Kpi label="Peak month" value={peak} accent="blue" unit={year === "all" ? "2025" : year} />
        <Kpi label="Driest month" value={dry} accent="red" unit={year === "all" ? "2025" : year} />
      </KpiRow>

      <div className="mt-5 space-y-3.5">
        <Card>
          <CardHeader
            title="Monthly rainfall — cotton crop season (May–Dec)"
            sub="Selected year vs LPA normal (dashed)"
          />
          {year === "all" ? (
            <LineChart
              labels={RF_MONTHS_L}
              series={[
                ...RF_ALL_YEARS.map((y) => ({
                  label: y,
                  data: yv(y) ?? [],
                  color: (RF_YEAR_PALETTE as Record<string, string>)[y] ?? "#cbd5e1",
                  width: y === "2025" ? 2.5 : 1,
                })),
                { label: "Normal", data: normal, color: "#c97b1e", width: 1.5, dashed: true },
              ]}
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
              title="Monthly departure from normal (mm)"
              sub={`${year === "all" ? "2025" : year} · green = surplus, red = deficit`}
            />
            <BarChart
              labels={RF_MONTHS_L}
              series={[
                {
                  data: RF_MONTHS_L.map((_, i) =>
                    selYearData ? Math.round(selYearData[i] - normal[i]) : null,
                  ),
                  colors: RF_MONTHS_L.map((_, i) =>
                    selYearData && selYearData[i] - normal[i] >= 0 ? "#2d7d46" : "#b83232",
                  ),
                },
              ]}
              smartX={false}
              height={220}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
