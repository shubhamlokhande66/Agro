"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import {
  WASDE_ATTRS,
  WASDE_REPORTS,
  WASDE_UNITS,
  convertWasde,
  reportLabel,
  wasdeDigits,
  type WasdeReport,
  type WasdeRow,
  type WasdeUnit,
  type WasdeYear,
} from "@/data/wasde";

/** countries shown in the balance table, in this order (others in the report are left out) */
const COUNTRIES = [
  "World", "United States", "India", "China", "Brazil", "Australia", "Pakistan", "Bangladesh",
  "Vietnam", "Turkey", "Central Asia", "Afr. Fr. Zone", "Indonesia", "Mexico", "European Union", "Thailand",
];
const BOLD = new Set(["World", "India"]);
const fmtDay = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const statusLabel = (y: WasdeYear) => (y.status === "proj" ? "Proj." : y.status === "est" ? "Est." : "");

/** the figures this report is being compared with: last month's projection (printed in the same
 *  report) for the projection year, otherwise the same year in the previous stored report */
function previousOf(report: WasdeReport, prev: WasdeReport | undefined, year: string, country: string): { row: WasdeRow; label: string } | null {
  const c = report.years.find((y) => y.year === year)?.countries[country];
  if (c?.prevMonth) return { row: c.prevMonth, label: c.prevLabel ?? "prev." };
  const p = prev?.years.find((y) => y.year === year)?.countries[country]?.current;
  return p && prev ? { row: p, label: reportLabel(prev.month).slice(0, 3) } : null;
}

type Tab = "latest" | "monthly" | "yearly";

export default function WasdePage() {
  const reports = WASDE_REPORTS;
  const [tab, setTab] = useState<Tab>("latest");
  const [unit, setUnit] = useState<WasdeUnit>("kmt");
  const [pick, setPick] = useState(reports[0]?.month ?? "");

  if (!reports.length) {
    return (
      <div>
        <PageHeader title="WASDE — World Cotton Balance" icon="🌐" dataset="wasdeReports" />
        <div className="panel mx-auto max-w-lg p-8 text-center text-[13px] text-ink-soft">
          No WASDE reports loaded yet — they sync automatically from USDA each day.
        </div>
      </div>
    );
  }

  const latest = reports[0];
  const idx = Math.max(0, reports.findIndex((r) => r.month === pick));
  const shown = tab === "latest" ? latest : reports[idx];
  const prevOfShown = reports[reports.indexOf(shown) + 1];

  return (
    <div>
      <PageHeader
        title="WASDE — World Cotton Balance"
        icon="🌐"
        dataset="wasdeReports"
        sub={`USDA ${latest.title} report · released ${fmtDay(latest.released)} · marketing year Aug–Jul · updates automatically each month`}
        right={<Seg options={WASDE_UNITS.map((u) => ({ value: u.value, label: u.label }))} value={unit} onChange={setUnit} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Seg
          options={[
            { value: "latest", label: "Latest report" },
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "monthly" ? (
          <label className="ml-auto flex items-center gap-2 text-[11px] text-ink-faint">
            <span className="font-semibold uppercase tracking-wide">Report</span>
            <select
              value={reports[idx].month}
              onChange={(e) => setPick(e.target.value)}
              className="focusable rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] font-medium text-ink"
            >
              {reports.map((r, i) => (
                <option key={r.month} value={r.month}>
                  {r.title}
                  {i === 0 ? " (latest)" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {tab === "yearly" ? (
        <YearlyView unit={unit} />
      ) : (
        <>
          {tab === "latest" ? <Headline report={latest} prev={reports[1]} unit={unit} /> : null}
          <IndiaRevisions report={shown} prev={prevOfShown} unit={unit} />
          <BalanceTable report={shown} prev={prevOfShown} unit={unit} />
          {tab === "monthly" ? <Evolution unit={unit} /> : null}
        </>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-ink-faint">
        Source: USDA World Agricultural Supply and Demand Estimates (WASDE), World Cotton Supply and Use, via the USDA ESMIS archive.
        Published in million 480-lb bales; 1 bale = 217.72 kg; Indian bale = 170 kg. Changes compare with the previous month's
        figures (for the projection year, last month's projection printed in the same report).
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Headline({ report, prev, unit }: { report: WasdeReport; prev?: WasdeReport; unit: WasdeUnit }) {
  const proj = report.years.at(-1)!;
  const d = wasdeDigits(unit);
  const items: { country: string; attr: keyof WasdeRow; label: string }[] = [
    { country: "World", attr: "production", label: "World production" },
    { country: "World", attr: "endingStocks", label: "World ending stocks" },
    { country: "India", attr: "production", label: "India production" },
    { country: "India", attr: "endingStocks", label: "India ending stocks" },
  ];
  return (
    <section className="panel mb-4 grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => {
        const now = proj.countries[it.country]?.current[it.attr];
        const was = previousOf(report, prev, proj.year, it.country)?.row[it.attr];
        const ch = now != null && was != null ? convertWasde(now, unit) - convertWasde(was, unit) : null;
        return (
          <div key={it.label} className="bg-surface px-4 py-3.5 sm:px-5">
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
              {it.label} · {proj.year} {statusLabel(proj)}
            </div>
            <div className="num mt-1 text-[21px] font-semibold tracking-tight text-ink">
              {now != null ? convertWasde(now, unit).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }) : "—"}
            </div>
            <div className="num mt-0.5 text-[11px] text-ink-faint">
              {WASDE_UNITS.find((u) => u.value === unit)!.short}
              {ch != null ? (
                <span className={clsx("ml-1.5 font-semibold", Math.abs(ch) < 10 ** -d / 2 ? "text-ink-faint" : ch > 0 ? "text-pos" : "text-neg")}>
                  {Math.abs(ch) < 10 ** -d / 2 ? "unchanged" : `${ch > 0 ? "▲ +" : "▼ "}${ch.toFixed(d)} vs last month`}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** India: previous vs this report, and the change, for the latest two marketing years */
function IndiaRevisions({ report, prev, unit }: { report: WasdeReport; prev?: WasdeReport; unit: WasdeUnit }) {
  const years = report.years.slice(-2);
  const d = wasdeDigits(unit);
  const f = (v: number | null | undefined) =>
    v == null ? "—" : convertWasde(v, unit).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d });
  return (
    <section className="panel mb-4 overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pb-2 pt-4 sm:px-5">
        <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">India · revisions in the {report.title} report</h2>
        <span className="text-[11px] text-ink-faint">{WASDE_UNITS.find((u) => u.value === unit)!.label}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-y border-line bg-surface-2 text-[10px] uppercase tracking-wide text-ink-faint">
              <th rowSpan={2} className="px-4 py-2 text-left font-semibold sm:px-5">India</th>
              {years.map((y) => (
                <th key={y.year} colSpan={3} className="border-l border-line px-3 pt-2 text-center font-semibold text-ink">
                  {y.year} {statusLabel(y)}
                </th>
              ))}
            </tr>
            <tr className="border-b border-line bg-surface-2 text-[10px] uppercase tracking-wide text-ink-faint">
              {years.map((y) => {
                const p = previousOf(report, prev, y.year, "India");
                return [
                  <th key={y.year + "p"} className="border-l border-line px-3 pb-2 text-right font-semibold">{p ? p.label : "Prev."}</th>,
                  <th key={y.year + "c"} className="px-3 pb-2 text-right font-semibold">{reportLabel(report.month).slice(0, 3)}</th>,
                  <th key={y.year + "d"} className="px-3 pb-2 text-right font-semibold">Change</th>,
                ];
              })}
            </tr>
          </thead>
          <tbody>
            {WASDE_ATTRS.map((a) => (
              <tr key={a.key} className="border-b border-line last:border-0">
                <td className={clsx("px-4 py-2 sm:px-5", a.key === "endingStocks" || a.key === "production" ? "font-semibold text-ink" : "text-ink-soft")}>{a.label}</td>
                {years.map((y) => {
                  const now = y.countries.India?.current[a.key];
                  const was = previousOf(report, prev, y.year, "India")?.row[a.key];
                  const ch = now != null && was != null ? convertWasde(now, unit) - convertWasde(was, unit) : null;
                  const zero = ch != null && Math.abs(ch) < 10 ** -d / 2;
                  return [
                    <td key={y.year + "p"} className="num border-l border-line px-3 py-2 text-right text-ink-soft">{f(was)}</td>,
                    <td key={y.year + "c"} className="num px-3 py-2 text-right font-semibold text-ink">{f(now)}</td>,
                    <td key={y.year + "d"} className={clsx("num px-3 py-2 text-right font-semibold", ch == null || zero ? "text-ink-faint" : ch > 0 ? "text-pos" : "text-neg")}>
                      {ch == null ? "new" : zero ? "—" : `${ch > 0 ? "+" : "−"}${Math.abs(ch).toFixed(d)}`}
                    </td>,
                  ];
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** world supply & use by country for one marketing year of a report, with change vs the previous report */
function BalanceTable({ report, prev, unit }: { report: WasdeReport; prev?: WasdeReport; unit: WasdeUnit }) {
  const [yearSel, setYearSel] = useState<string | null>(null);
  const year = report.years.find((y) => y.year === yearSel) ?? report.years.at(-1)!;
  const d = wasdeDigits(unit);
  const rows = COUNTRIES.filter((c) => year.countries[c]);
  return (
    <section className="panel mb-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-2 pt-4 sm:px-5">
        <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">
          World cotton supply &amp; use · {report.title} report
        </h2>
        <Seg options={report.years.map((y) => ({ value: y.year, label: `${y.year} ${statusLabel(y)}`.trim() }))} value={year.year} onChange={setYearSel} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-y border-line bg-surface-2 text-right text-[10px] uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2 text-left font-semibold sm:px-5">Country</th>
              {WASDE_ATTRS.map((a) => (
                <th key={a.key} className="px-3 py-2 font-semibold">{a.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const now = year.countries[c].current;
              const was = previousOf(report, prev, year.year, c)?.row;
              return (
                <tr key={c} className={clsx("border-b border-line last:border-0", BOLD.has(c) && "bg-surface-2/60")}>
                  <td className={clsx("px-4 py-1.5 sm:px-5", BOLD.has(c) ? "font-semibold text-ink" : "text-ink-soft")}>{c}</td>
                  {WASDE_ATTRS.map((a) => {
                    const v = convertWasde(now[a.key], unit);
                    const ch = was ? v - convertWasde(was[a.key], unit) : null;
                    const zero = ch == null || Math.abs(ch) < 10 ** -d / 2;
                    return (
                      <td key={a.key} className="num px-3 py-1.5 text-right align-top">
                        <div className={clsx(BOLD.has(c) ? "font-semibold text-ink" : "text-ink")}>
                          {v.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d })}
                        </div>
                        {!zero ? (
                          <div className={clsx("text-[10px] font-semibold", ch! > 0 ? "text-pos" : "text-neg")}>
                            {ch! > 0 ? "+" : "−"}
                            {Math.abs(ch!).toFixed(d)}
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const PALETTE = ["#0f9d63", "#2563c9", "#d97706", "#7c5cd6", "#d84a3c"];

/** how USDA's figure for each marketing year moved from report to report */
function Evolution({ unit }: { unit: WasdeUnit }) {
  const [country, setCountry] = useState("India");
  const [attr, setAttr] = useState<keyof WasdeRow>("endingStocks");
  const chrono = [...WASDE_REPORTS].reverse();
  const years = Array.from(new Set(chrono.flatMap((r) => r.years.map((y) => y.year)))).sort().slice(-3);
  const d = wasdeDigits(unit);
  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">How USDA&apos;s estimate evolved</h2>
          <p className="mt-0.5 text-[11px] text-ink-faint">Each line is one marketing year, as reported in successive WASDE reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={country} onChange={setCountry} options={COUNTRIES} />
          <Select value={attr} onChange={(v) => setAttr(v as keyof WasdeRow)} options={WASDE_ATTRS.map((a) => ({ value: a.key, label: a.label }))} />
        </div>
      </div>
      <LineChart
        labels={chrono.map((r) => reportLabel(r.month))}
        legend
        height={260}
        series={years.map((y, i) => ({
          label: y,
          color: PALETTE[i % PALETTE.length],
          data: chrono.map((r) => {
            const v = r.years.find((x) => x.year === y)?.countries[country]?.current[attr];
            return v == null ? null : Math.round(convertWasde(v, unit) * 10 ** d) / 10 ** d;
          }),
        }))}
        yFmt={(v) => v.toLocaleString("en-IN")}
        tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y.toLocaleString("en-IN", { maximumFractionDigits: d })}`}
      />
    </section>
  );
}

/** each marketing year's figures from the newest report that has it */
function YearlyView({ unit }: { unit: WasdeUnit }) {
  const [country, setCountry] = useState("India");
  const d = wasdeDigits(unit);
  const years = useMemo(() => {
    const out = new Map<string, { row: WasdeRow; status: string; report: string }>();
    for (const r of WASDE_REPORTS) {
      for (const y of r.years) {
        const row = y.countries[country]?.current;
        if (row && !out.has(y.year)) out.set(y.year, { row, status: statusLabel(y), report: reportLabel(r.month) });
      }
    }
    return [...out].sort(([a], [b]) => a.localeCompare(b));
  }, [country]);
  const fmt = (v: number) => convertWasde(v, unit).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d });

  return (
    <>
      <section className="panel mb-4 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">{country} · supply &amp; use by marketing year</h2>
            <p className="mt-0.5 text-[11px] text-ink-faint">Latest USDA figure for each year</p>
          </div>
          <Select value={country} onChange={setCountry} options={COUNTRIES} />
        </div>
        <BarChart
          labels={years.map(([y]) => y)}
          legend
          height={250}
          series={[
            { label: "Production", color: "#0f9d63", data: years.map(([, v]) => Math.round(convertWasde(v.row.production, unit) * 10 ** d) / 10 ** d) },
            { label: "Domestic use", color: "#2563c9", data: years.map(([, v]) => Math.round(convertWasde(v.row.domesticUse, unit) * 10 ** d) / 10 ** d) },
            { label: "Ending stocks", color: "#d97706", data: years.map(([, v]) => Math.round(convertWasde(v.row.endingStocks, unit) * 10 ** d) / 10 ** d) },
          ]}
          yFmt={(v) => v.toLocaleString("en-IN")}
        />
      </section>
      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-right text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2 text-left font-semibold sm:px-5">Marketing year</th>
                {WASDE_ATTRS.map((a) => (
                  <th key={a.key} className="px-3 py-2 font-semibold">{a.label}</th>
                ))}
                <th className="px-4 py-2 font-semibold sm:px-5">As of report</th>
              </tr>
            </thead>
            <tbody>
              {[...years].reverse().map(([y, v]) => (
                <tr key={y} className="num border-b border-line text-right last:border-0">
                  <td className="px-4 py-2 text-left font-sans font-semibold text-ink sm:px-5">
                    {y} <span className="text-[10.5px] font-normal text-ink-faint">{v.status}</span>
                  </td>
                  {WASDE_ATTRS.map((a) => (
                    <td key={a.key} className={clsx("px-3 py-2", a.key === "endingStocks" ? "font-semibold text-ink" : "text-ink")}>{fmt(v.row[a.key])}</td>
                  ))}
                  <td className="px-4 py-2 font-sans text-ink-faint sm:px-5">{v.report}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Seg<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap rounded-lg bg-surface-2 p-0.5">
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

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="focusable rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] font-medium text-ink"
    >
      {options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)).map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
