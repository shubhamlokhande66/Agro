"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import { ES_DEST, ES_DEST_WEEK, ES_YEARS, type EsWeek } from "@/data/exportSales";

/** FAS abbreviates destinations ("PAKISTN"); readable names for the common ones */
const NAMES: Record<string, string> = {
  PAKISTN: "Pakistan", HONDURA: "Honduras", INDNSIA: "Indonesia", GUATMAL: "Guatemala", SALVADR: "El Salvador",
  BANGLADH: "Bangladesh", MALAYSA: "Malaysia", NICARAG: "Nicaragua", THAILND: "Thailand", "KOR REP": "South Korea",
  "C RICA": "Costa Rica", PORTUGL: "Portugal", VENEZ: "Venezuela", COLOMB: "Colombia", "HG KONG": "Hong Kong",
  "DOM REP": "Dominican Rep.", PHILIPP: "Philippines", UNKNOWN: "Unknown",
};
const country = (c: string) => NAMES[c] ?? c.charAt(0) + c.slice(1).toLowerCase();

const CUR = "#0f9d63";
const PREV = "#94a3b8";
const AVG = "#d97706";
const k = (v: number) => v / 1000; // running bales → thousand running bales
const fmtK = (v: number | null | undefined, d = 1) =>
  v == null ? "—" : k(v).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d });
const pct = (now: number, then: number) => (then ? ((now - then) / Math.abs(then)) * 100 : null);
const fmtDay = (iso: string | null | undefined) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

type Metric = "commitment" | "accExports";

export default function ExportSalesPage() {
  const [cumMetric, setCumMetric] = useState<Metric>("commitment");
  const cur = ES_YEARS[0];
  const prev = ES_YEARS[1];
  const older = useMemo(() => ES_YEARS.slice(1, 5), []); // up to 4 previous years for the average

  const view = useMemo(() => {
    if (!cur || !prev) return null;
    const n = Math.max(cur.weeks.length, prev.weeks.length);
    const labels = Array.from({ length: n }, (_, i) => `Wk ${i + 1}`);
    const series = (weeks: EsWeek[], key: keyof EsWeek) => labels.map((_, i) => (weeks[i] ? k(weeks[i][key] as number) : null));
    const avg = (key: keyof EsWeek) =>
      labels.map((_, i) => {
        const vals = older.map((y) => y.weeks[i]?.[key] as number | undefined).filter((v): v is number => v != null);
        return vals.length ? k(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      });
    return { labels, series, avg };
  }, [cur, prev, older]);

  if (!cur || !prev || !view) {
    return (
      <div>
        <PageHeader title="USDA Export Sales" icon="◕" dataset="exportSales" />
        <div className="panel mx-auto max-w-lg p-8 text-center text-[13px] text-ink-soft">
          No export sales data yet — it syncs automatically from USDA every day.
        </div>
      </div>
    );
  }

  const i = cur.weeks.length - 1;
  const w = cur.weeks[i];
  const lastWeek = cur.weeks[i - 1];
  const sameWeekLy = prev.weeks[i];
  const prior4 = cur.weeks.slice(Math.max(0, i - 4), i);
  const avg4 = prior4.length ? prior4.reduce((a, x) => a + x.netSales, 0) / prior4.length : null;
  const top = ES_DEST.filter((d) => d.country !== "UNKNOWN").slice(0, 12);

  return (
    <div>
      <PageHeader
        title="USDA Export Sales"
        icon="◕"
        dataset="exportSales"
        sub={`US upland cotton · week ending ${fmtDay(w.week)} · marketing year ${cur.year} (Aug–Jul) · thousand running bales · USDA publishes every Thursday`}
      />

      {/* headline */}
      <section className="panel mb-4 grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label="Net sales · this week"
          value={fmtK(w.netSales)}
          note={
            <>
              <Change v={lastWeek ? pct(w.netSales, lastWeek.netSales) : null} /> vs prior week ·{" "}
              <Change v={avg4 != null ? pct(w.netSales, avg4) : null} /> vs 4-wk avg
            </>
          }
        />
        <Kpi label="Shipments · this week" value={fmtK(w.exports)} note={<><Change v={lastWeek ? pct(w.exports, lastWeek.exports) : null} /> vs prior week</>} />
        <Kpi
          label="Total commitments"
          value={fmtK(w.commitment)}
          note={<><Change v={sameWeekLy ? pct(w.commitment, sameWeekLy.commitment) : null} /> vs same week {prev.year}</>}
          strong
        />
        <Kpi label="Exports so far" value={fmtK(w.accExports)} note={<><Change v={sameWeekLy ? pct(w.accExports, sameWeekLy.accExports) : null} /> vs same week {prev.year}</>} />
        <Kpi label="Outstanding sales" value={fmtK(w.outstanding)} note={<>next-year sales {fmtK(w.nextOutstanding)}</>} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Weekly net sales" sub={`${cur.year} vs ${prev.year}, by week of the marketing year · week 1 includes sales booked earlier for the new year`}>
          <BarChart
            labels={view.labels}
            legend
            height={240}
            xTicks={9}
            series={[
              { label: cur.year, color: CUR, data: view.series(cur.weeks, "netSales") },
              { label: prev.year, color: PREV, data: view.series(prev.weeks, "netSales") },
            ]}
            yFmt={(v) => `${v}k`}
          />
        </ChartCard>
        <ChartCard title="Weekly shipments" sub={`${cur.year} vs ${prev.year}, by week of the marketing year`}>
          <BarChart
            labels={view.labels}
            legend
            height={240}
            xTicks={9}
            series={[
              { label: cur.year, color: CUR, data: view.series(cur.weeks, "exports") },
              { label: prev.year, color: PREV, data: view.series(prev.weeks, "exports") },
            ]}
            yFmt={(v) => `${v}k`}
          />
        </ChartCard>
      </div>

      <ChartCard
        className="mt-4"
        title={cumMetric === "commitment" ? "Total commitments (exports + outstanding sales)" : "Cumulative exports"}
        sub={`${cur.year} vs ${prev.year} and the ${older.length}-year average, by week of the marketing year`}
        right={
          <Seg
            options={[
              { value: "commitment", label: "Commitments" },
              { value: "accExports", label: "Exports" },
            ]}
            value={cumMetric}
            onChange={setCumMetric}
          />
        }
      >
        <LineChart
          labels={view.labels}
          legend
          height={280}
          xTicks={12}
          series={[
            { label: cur.year, color: CUR, data: view.series(cur.weeks, cumMetric) },
            { label: prev.year, color: PREV, data: view.series(prev.weeks, cumMetric) },
            { label: `${older.length}-yr avg`, color: AVG, dashed: true, data: view.avg(cumMetric) },
          ]}
          yFmt={(v) => `${(v / 1000).toFixed(1)}M`}
          tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y.toLocaleString("en-IN", { maximumFractionDigits: 0 })}k bales`}
        />
      </ChartCard>

      {/* destinations */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <ChartCard title="Top destinations · total commitments" sub={`Week ending ${fmtDay(ES_DEST_WEEK)} vs the same week of ${prev.year}`}>
          <BarChart
            labels={top.map((d) => country(d.country))}
            horizontal
            legend
            height={360}
            series={[
              { label: cur.year, color: CUR, data: top.map((d) => k(d.commitment)) },
              { label: prev.year, color: PREV, data: top.map((d) => k(d.lastYear)) },
            ]}
            yFmt={(v) => `${v}k`}
          />
        </ChartCard>
        <section className="panel overflow-hidden">
          <div className="px-4 pb-2 pt-4 sm:px-5">
            <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Commitments by buyer</h2>
            <p className="mt-0.5 text-[11px] text-ink-faint">Thousand running bales · year on year</p>
          </div>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-y border-line bg-surface-2 text-right text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2 text-left font-semibold sm:px-5">Destination</th>
                <th className="px-3 py-2 font-semibold">{cur.year}</th>
                <th className="px-3 py-2 font-semibold">{prev.year}</th>
                <th className="px-4 py-2 font-semibold sm:px-5">YoY</th>
              </tr>
            </thead>
            <tbody>
              {top.map((d) => (
                <tr key={d.country} className={clsx("num border-b border-line text-right last:border-0", d.country === "INDIA" && "bg-surface-2")}>
                  <td className={clsx("px-4 py-1.5 text-left font-sans sm:px-5", d.country === "INDIA" ? "font-semibold text-ink" : "text-ink")}>{country(d.country)}</td>
                  <td className="px-3 py-1.5 font-semibold text-ink">{fmtK(d.commitment)}</td>
                  <td className="px-3 py-1.5 text-ink-soft">{fmtK(d.lastYear)}</td>
                  <td className="px-4 py-1.5 sm:px-5">
                    <Change v={d.lastYear ? pct(d.commitment, d.lastYear) : null} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-ink-faint">
        Source: USDA Foreign Agricultural Service, Export Sales Reporting (FAS Open Data API) — all upland cotton staple
        lengths, running bales. Week numbers count from the first reporting week of each marketing year (August). Net sales
        are new sales less cancellations; total commitments are exports so far plus outstanding (unshipped) sales.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Kpi({ label, value, note, strong }: { label: string; value: string; note?: React.ReactNode; strong?: boolean }) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={clsx("num mt-1 font-semibold tracking-tight text-ink", strong ? "text-[22px]" : "text-[19px]")}>{value}</div>
      {note ? <div className="num mt-0.5 text-[11px] text-ink-faint">{note}</div> : null}
    </div>
  );
}

function Change({ v }: { v: number | null }) {
  if (v == null || !Number.isFinite(v)) return <span>—</span>;
  if (Math.abs(v) < 0.05) return <span className="font-semibold text-ink-faint">0.0%</span>;
  return (
    <span className={clsx("font-semibold", v > 0.05 ? "text-pos" : v < -0.05 ? "text-neg" : "text-ink-faint")}>
      {`${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`}
    </span>
  );
}

function ChartCard({ title, sub, right, className, children }: { title: string; sub?: string; right?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={clsx("panel p-4 sm:p-5", className)}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">{title}</h2>
          {sub ? <p className="mt-0.5 text-[11px] text-ink-faint">{sub}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Seg<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "focusable rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition-colors",
            value === o.value ? "bg-surface text-ink shadow-sm" : "text-ink-faint hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
