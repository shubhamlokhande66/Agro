"use client";

import clsx from "clsx";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import BarChart from "@/components/charts/BarChart";
import { BENCH, LAKH_BALES_TO_KMT } from "@/data/benchmarks";
import { dpValue } from "@/data/production";
import { WASDE_REPORTS, convertWasde } from "@/data/wasde";

type Unit = "lakh" | "kmt";
type Row = { source: string; kind: "ours" | "usda" | "trade" | "avg"; a: number | null; b: number | null; note?: string };

const toUnit = (lakh: number, u: Unit) => (u === "kmt" ? lakh * LAKH_BALES_TO_KMT : lakh);
const fmt = (lakh: number | null, u: Unit) =>
  lakh == null ? "—" : toUnit(lakh, u).toLocaleString("en-IN", { maximumFractionDigits: u === "kmt" ? 0 : 1, minimumFractionDigits: u === "kmt" ? 0 : 1 });
const signedFmt = (lakh: number, u: Unit) => `${lakh > 0 ? "+" : lakh < 0 ? "−" : ""}${fmt(Math.abs(lakh), u)}`;
const reportMonth = (m: string) => {
  const [y, mo] = m.split("-");
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(mo) - 1]} ${y}`;
};

export default function BenchmarksPage() {
  const [unit, setUnit] = useState<Unit>("lakh");
  const [sa, sb] = BENCH.seasons;

  // Agrolytix: our production dataset; USDA: India production in the latest WASDE, converted to lakh bales
  const latest = WASDE_REPORTS[0];
  const usda = (season: string) => {
    const v = latest?.years.find((y) => y.year === season)?.countries.India?.current.production;
    return v == null ? null : convertWasde(v, "lakh");
  };
  const trade = BENCH.houses.map<Row>((h) => ({ source: h.source, kind: "trade", a: h.a, b: h.b, note: h.asOf }));
  const avg = (key: "a" | "b") => {
    const vals = trade.map((t) => t[key]).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : null;
  };
  const rows: Row[] = [
    { source: "Agrolytix", kind: "ours", a: dpValue("prod", sa, "ALL_INDIA"), b: dpValue("prod", sb, "ALL_INDIA"), note: "Domestic Production" },
    { source: "USDA", kind: "usda", a: usda(sa), b: usda(sb), note: latest ? `WASDE ${reportMonth(latest.month)}` : undefined },
    ...trade,
    { source: "Trade average", kind: "avg", a: avg("a"), b: avg("b"), note: trade.map((t) => t.source).join(", ") },
  ];
  const ours = rows[0];
  const vs = (r: Row, key: "a" | "b") => (r.kind === "ours" || r[key] == null || ours[key] == null ? null : (r[key] as number) - (ours[key] as number));
  const yoy = (r: Row) => (r.a != null && r.b != null ? r.b - r.a : null);
  const tradeAvgB = rows.at(-1)!.b;
  const unitLabel = unit === "kmt" ? "thousand tonnes" : "lakh bales (170 kg)";

  return (
    <div>
      <PageHeader
        title="Production Benchmarks"
        icon="◑"
        dataset="benchmarks"
        sub={`India cotton production — Agrolytix vs USDA and trade estimates · ${sa} and ${sb} · lakh bales (170 kg) and thousand tonnes`}
        right={
          <Seg
            options={[
              { value: "lakh", label: "Lakh bales" },
              { value: "kmt", label: "1000 MT" },
            ]}
            value={unit}
            onChange={setUnit}
          />
        }
      />

      {/* headline */}
      <section className="panel mb-4 grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={`Agrolytix · ${sb}`}
          value={fmt(ours.b, unit)}
          unit={unitLabel}
          note={yoy(ours) != null ? <><Diff v={yoy(ours)!} unit={unit} /> vs {sa}</> : null}
          strong
        />
        <Kpi label={`USDA · ${sb}`} value={fmt(rows[1].b, unit)} unit={unitLabel} note={vs(rows[1], "b") != null ? <><Diff v={vs(rows[1], "b")!} unit={unit} /> vs Agrolytix</> : null} />
        <Kpi label={`Trade average · ${sb}`} value={fmt(tradeAvgB, unit)} unit={unitLabel} note={vs(rows.at(-1)!, "b") != null ? <><Diff v={vs(rows.at(-1)!, "b")!} unit={unit} /> vs Agrolytix</> : null} />
        <Kpi
          label={`Range of estimates · ${sb}`}
          value={(() => {
            const vals = rows.filter((r) => r.kind !== "avg" && r.b != null).map((r) => r.b as number);
            return vals.length ? `${fmt(Math.min(...vals), unit)} – ${fmt(Math.max(...vals), unit)}` : "—";
          })()}
          unit={unitLabel}
          note={`${rows.filter((r) => r.kind !== "avg" && r.b != null).length} estimates`}
        />
      </section>

      {/* comparison table */}
      <section className="panel mb-4 overflow-hidden">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">India production estimates</h2>
          <p className="mt-0.5 text-[11px] text-ink-faint">Lakh bales of 170 kg and thousand tonnes (1 lakh bales = 17,000 t) · difference vs Agrolytix</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-y border-line bg-surface-2 text-[10px] uppercase tracking-wide text-ink-faint">
                <th rowSpan={2} className="px-4 py-2 text-left font-semibold sm:px-5">Source</th>
                {[sa, sb].map((s) => (
                  <th key={s} colSpan={3} className="border-l border-line px-3 pt-2 text-center font-semibold text-ink">{s}</th>
                ))}
                <th rowSpan={2} className="border-l border-line px-4 py-2 text-right font-semibold sm:px-5">
                  Change
                  <br />
                  {sb.slice(2)} vs {sa.slice(2)}
                </th>
              </tr>
              <tr className="border-b border-line bg-surface-2 text-right text-[10px] uppercase tracking-wide text-ink-faint">
                {[sa, sb].map((s) => [
                  <th key={s + "l"} className="border-l border-line px-3 pb-2 font-semibold">Lakh bales</th>,
                  <th key={s + "k"} className="px-3 pb-2 font-semibold">1000 MT</th>,
                  <th key={s + "d"} className="px-3 pb-2 font-semibold">vs Agrolytix</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const change = yoy(r);
                return (
                  <tr
                    key={r.source}
                    className={clsx(
                      "num border-b border-line text-right last:border-0",
                      r.kind === "ours" && "bg-accent-soft/40",
                      r.kind === "avg" && "bg-surface-2 font-semibold",
                    )}
                  >
                    <td className="px-4 py-2 text-left font-sans sm:px-5">
                      <div className={clsx(r.kind === "ours" || r.kind === "avg" ? "font-semibold text-ink" : "font-medium text-ink")}>{r.source}</div>
                      {r.note ? <div className="text-[10.5px] font-normal text-ink-faint">{r.note}</div> : null}
                    </td>
                    {(["a", "b"] as const).map((key) => {
                      const d = vs(r, key);
                      return [
                        <td key={key + "l"} className="border-l border-line px-3 py-2 font-semibold text-ink">{fmt(r[key], "lakh")}</td>,
                        <td key={key + "k"} className="px-3 py-2 text-ink-soft">{fmt(r[key], "kmt")}</td>,
                        <td key={key + "d"} className="px-3 py-2">
                          {r.kind === "ours" ? <span className="text-ink-faint">base</span> : d == null ? "—" : <Diff v={d} unit="lakh" pctOf={ours[key]} />}
                        </td>,
                      ];
                    })}
                    <td className="border-l border-line px-4 py-2 sm:px-5">{change == null ? "—" : <Diff v={change} unit="lakh" pctOf={r.a} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* chart */}
      <section className="panel p-4 sm:p-5">
        <div className="mb-3">
          <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Estimates compared · {unitLabel}</h2>
          <p className="mt-0.5 text-[11px] text-ink-faint">Each source's {sa} and {sb} India production estimate</p>
        </div>
        <BarChart
          labels={rows.map((r) => r.source)}
          legend
          height={300}
          series={[
            { label: sa, color: "#94a3b8", data: rows.map((r) => (r.a == null ? null : Math.round(toUnit(r.a, unit) * 10) / 10)) },
            { label: sb, color: "#0f9d63", data: rows.map((r) => (r.b == null ? null : Math.round(toUnit(r.b, unit) * 10) / 10)), valueLabel: (v) => v.toLocaleString("en-IN", { maximumFractionDigits: unit === "kmt" ? 0 : 1 }) },
          ]}
          yFmt={(v) => v.toLocaleString("en-IN")}
        />
      </section>

      <p className="mt-4 text-[11px] leading-relaxed text-ink-faint">
        Agrolytix: Domestic Production estimate (Indian cotton season, Oct–Sep). USDA: India production in the latest WASDE
        (marketing year Aug–Jul), converted from 480-lb bales (217.72 kg) to 170-kg bales. Trade houses' estimates as entered in
        admin (Benchmarks); seasons and figures can be updated there.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Kpi({ label, value, unit, note, strong }: { label: string; value: string; unit?: string; note?: React.ReactNode; strong?: boolean }) {
  return (
    <div className={clsx("bg-surface px-4 py-3.5 sm:px-5", strong && "bg-accent-soft/40")}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={clsx("num mt-1 font-semibold tracking-tight text-ink", strong ? "text-[23px]" : "text-[19px]")}>{value}</div>
      {unit ? <div className="text-[10.5px] text-ink-faint">{unit}</div> : null}
      {note ? <div className="num mt-0.5 text-[11px] text-ink-faint">{note}</div> : null}
    </div>
  );
}

/** a signed difference in the chosen unit, with % underneath when a base is given */
function Diff({ v, unit, pctOf }: { v: number; unit: Unit; pctOf?: number | null }) {
  const tone = Math.abs(v) < 0.05 ? "text-ink-faint" : v > 0 ? "text-pos" : "text-neg";
  return (
    <span className={clsx("font-semibold", tone)}>
      {signedFmt(v, unit)}
      {pctOf ? <span className="block text-[10px] font-medium">{`${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs((v / pctOf) * 100).toFixed(1)}%`}</span> : null}
    </span>
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
