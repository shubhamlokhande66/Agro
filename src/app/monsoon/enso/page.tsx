"use client";

import { useMemo, useState } from "react";
import LineChart from "@/components/charts/LineChart";
import { HISTORICAL_MONSOON_DEPARTURES } from "@/lib/monsoon/constants";
import { monthLabel, useMonsoon, type MonthValue } from "@/components/monsoon/data";
import { Loaded, PageTitle, PANEL, RefreshButton, SegTabs, signed } from "@/components/monsoon/ui";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** historically significant ENSO years for comparison */
const ANALOGS = [1997, 2015, 2023, 2010, 1982, 1972];
const ANALOG_COLORS = ["#f87171", "#fb923c", "#facc15", "#60a5fa", "#a78bfa", "#94a3b8"];

type Tab = "plumes" | "chart" | "heatmap";

const yearSeries = (monthly: MonthValue[], year: number) =>
  MONTHS.map((_, i) => monthly.find((d) => d.year === year && d.month === i + 1)?.value ?? null);

/** Jun–Sep mean of an index for a year, or null */
const jjasMean = (monthly: MonthValue[], year: number) => {
  const v = monthly.filter((d) => d.year === year && d.month >= 6 && d.month <= 9);
  return v.length ? v.reduce((a, d) => a + d.value, 0) / v.length : null;
};

function Enso() {
  const { data } = useMonsoon();
  const [tab, setTab] = useState<Tab>("chart");
  const nino = data?.enso?.nino.monthly ?? [];
  const iod = data?.enso?.iod.monthly ?? [];
  const year = data?.enso?.nino.latest?.year ?? new Date().getFullYear();

  const heatmap = useMemo(
    () =>
      Object.entries(HISTORICAL_MONSOON_DEPARTURES)
        .map(([y, dep]) => {
          const yr = Number(y);
          const n = jjasMean(nino, yr);
          const d = jjasMean(iod, yr);
          return {
            year: yr,
            enso: n == null ? "—" : n >= 0.5 ? "El Niño" : n <= -0.5 ? "La Niña" : "Neutral",
            ninoVal: n,
            iod: d == null ? "—" : d > 0.4 ? "Positive" : d < -0.4 ? "Negative" : "Neutral",
            iodVal: d,
            dep,
          };
        })
        .sort((a, b) => b.year - a.year),
    [nino, iod],
  );

  return (
    <div className="max-w-7xl space-y-6">
      <PageTitle
        icon="∿"
        title="ENSO Deep Dive"
        sub={`Niño 3.4 latest ${signed(data?.enso?.nino.latest?.value, 2, "°C")} (${monthLabel(data?.enso?.nino.latest ?? null)}) · IOD ${signed(
          data?.enso?.iod.latest?.value,
          2,
          "",
        )} (${monthLabel(data?.enso?.iod.latest ?? null)}) · Sources: ${data?.enso?.nino.source ?? "NOAA"}, ${data?.enso?.iod.source ?? "NOAA"}`}
        right={<RefreshButton />}
      />
      <SegTabs
        tabs={[
          { id: "plumes" as Tab, label: "Model Plumes" },
          { id: "chart" as Tab, label: "Monthly Comparison" },
          { id: "heatmap" as Tab, label: "Historical Heatmap" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "plumes" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { t: "Niño 3.4 model plumes — BoM", u: "http://www.bom.gov.au/climate/enso/outlook/" },
            { t: "IOD model plumes — BoM", u: "http://www.bom.gov.au/climate/enso/iod.shtml" },
            { t: "ENSO forecast — NOAA CPC", u: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml" },
            { t: "IRI ENSO forecast plume", u: "https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/" },
          ].map((c) => (
            <div key={c.t} className={PANEL + " flex items-center justify-between gap-3 p-4"}>
              <span className="text-sm font-medium text-white">{c.t}</span>
              <a href={c.u} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-500">
                Open ↗
              </a>
            </div>
          ))}
          <p className="text-xs text-slate-600 md:col-span-2">
            Model-plume charts are published as interactive pages that block embedding, so they open on the source site.
          </p>
        </div>
      ) : null}

      {tab === "chart" ? (
        <div className={PANEL + " p-5"}>
          <h4 className="mb-1 text-sm font-semibold text-white">Niño 3.4 anomaly by month — {year} vs {year - 1} and analog years (°C)</h4>
          <p className="mb-3 text-[11px] text-slate-500">±0.5 °C marks El Niño / La Niña thresholds. Analogs: {ANALOGS.join(", ")}.</p>
          <LineChart
            labels={MONTHS}
            series={[
              { label: String(year), data: yearSeries(nino, year), color: "#34d399", width: 3, tension: 0, pointRadius: 3 },
              { label: String(year - 1), data: yearSeries(nino, year - 1), color: "#60a5fa", width: 2, tension: 0 },
              ...ANALOGS.map((y, i) => ({ label: String(y), data: yearSeries(nino, y), color: ANALOG_COLORS[i], width: 1.25, dashed: true, tension: 0 })),
            ]}
            yFmt={(v) => v.toFixed(1)}
            tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y > 0 ? "+" : ""}${c.parsed.y.toFixed(2)}°C`}
            smartX={false}
            height={340}
          />
        </div>
      ) : null}

      {tab === "heatmap" ? (
        <div className={PANEL + " overflow-x-auto"}>
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-slate-700/50 text-xs font-medium text-slate-400">
                <th className="px-4 py-3 text-left">Year</th>
                <th className="px-4 py-3 text-left">ENSO (Jun–Sep)</th>
                <th className="px-4 py-3 text-left">IOD (Jun–Sep)</th>
                <th className="px-4 py-3 text-right">Monsoon departure</th>
              </tr>
            </thead>
            <tbody>
              {heatmap.map((r) => (
                <tr key={r.year} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                  <td className="px-4 py-2 font-mono text-sm text-white">{r.year}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        "rounded px-2 py-0.5 text-xs font-medium " +
                        (r.enso === "El Niño" ? "bg-red-500/10 text-red-400" : r.enso === "La Niña" ? "bg-blue-500/10 text-blue-400" : "bg-slate-500/10 text-slate-400")
                      }
                    >
                      {r.enso}
                      {r.ninoVal != null ? ` (${signed(r.ninoVal, 1, "")})` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        "rounded px-2 py-0.5 text-xs font-medium " +
                        (r.iod === "Positive" ? "bg-emerald-500/10 text-emerald-400" : r.iod === "Negative" ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400")
                      }
                    >
                      {r.iod}
                      {r.iodVal != null ? ` (${signed(r.iodVal, 1, "")})` : ""}
                    </span>
                  </td>
                  <td
                    className={
                      "px-4 py-2 text-right font-mono text-sm font-bold " +
                      (r.dep >= 10 ? "text-emerald-400" : r.dep >= 0 ? "text-green-400" : r.dep >= -10 ? "text-amber-400" : "text-red-400")
                    }
                  >
                    {signed(r.dep, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default function EnsoPage() {
  return (
    <Loaded>
      <Enso />
    </Loaded>
  );
}
