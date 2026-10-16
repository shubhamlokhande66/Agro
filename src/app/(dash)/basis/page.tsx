"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { VARIETIES } from "@/data/prices";
import { COTLOOK_DAILY, COTLOOK_MONTHLY } from "@/data/cotlook";
import { USDINR_1Y_L, USDINR_LATEST } from "@/data/currency";
import { inr, smartAxisLabel } from "@/lib/format";
import { monthlyBasis, toCentsLb, toInrCandy } from "@/lib/basis";


const PREMIUM = "#d84a3c"; // Indian cotton dearer than the A Index
const DISCOUNT = "#0f9d63"; // Indian cotton cheaper than the A Index

const fmtDay = (iso: string | null | undefined) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const signed = (v: number, d = 2) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(d)}`;
const signedInr = (v: number) => `${v >= 0 ? "+" : "−"}${inr(Math.abs(v))}`;


type Range = "1y" | "3y" | "all";
const RANGES: { value: Range; label: string; months?: number }[] = [
  { value: "1y", label: "1Y", months: 12 },
  { value: "3y", label: "3Y", months: 36 },
  { value: "all", label: "All" },
];

export default function BasisPage() {
  const latest = useMemo(() => {
    const g = [...(VARIETIES.find((v) => v.key === "guj29")?.daily ?? [])].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;
    const a = COTLOOK_DAILY.at(-1) ?? null;
    const am = COTLOOK_MONTHLY.at(-1) ?? null;
    const fxDate = USDINR_1Y_L.at(-1)?.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
    return {
      guj: g,
      a: a ? { value: a.value, label: fmtDay(a.date) } : am ? { value: am.value, label: smartAxisLabel(am.month) + " avg" } : null,
      fx: USDINR_LATEST != null ? { value: Math.round(USDINR_LATEST * 100) / 100, label: fxDate ? fmtDay(`20${fxDate[3]}-${fxDate[2]}-${fxDate[1]}`) : "" } : null,
    };
  }, []);

  const init = { guj: String(latest.guj?.price ?? ""), a: String(latest.a?.value ?? ""), fx: String(latest.fx?.value ?? "") };
  const [vals, setVals] = useState(init);
  const [range, setRange] = useState<Range>("3y");
  const [unit, setUnit] = useState<"cents" | "inr">("cents");

  const num = (s: string) => (Number.isFinite(parseFloat(s)) ? parseFloat(s) : 0);
  const guj = num(vals.guj);
  const a = num(vals.a);
  const fx = num(vals.fx);
  const ready = guj > 0 && a > 0 && fx > 0;
  const gujCents = ready ? toCentsLb(guj, fx) : NaN;
  const aInr = ready ? toInrCandy(a, fx) : NaN;
  const basis = gujCents - a;
  const basisInr = guj - aInr;
  const pct = (basis / a) * 100;
  const premium = basis >= 0;
  const edited = vals.guj !== init.guj || vals.a !== init.a || vals.fx !== init.fx;

  const all = useMemo(monthlyBasis, []);
  const rows = useMemo(() => {
    const n = RANGES.find((r) => r.value === range)?.months;
    return n ? all.slice(-n) : all;
  }, [all, range]);
  const avg = rows.length ? rows.reduce((s, r) => s + r.basis, 0) / rows.length : null;

  return (
    <div>
      <PageHeader
        title="Cotton Basis"
        icon="≈"
        sub="India (Guj-29) vs the world's cheapest cotton — the Cotlook A Index"
        dataset="cotlook"
      />

      {/* headline */}
      <section className="panel mb-4 grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={premium ? "Basis · India at a premium" : "Basis · India at a discount"}
          value={ready ? `${signed(basis)} ¢/lb` : "—"}
          unit={ready ? `${signedInr(basisInr)} per candy · ${signed(pct, 1)}%` : ""}
          tone={ready ? (premium ? "neg" : "pos") : undefined}
          big
        />
        <Kpi label="Guj-29 (Shankar-29)" value={ready ? `${gujCents.toFixed(2)} ¢/lb` : "—"} unit={`${inr(guj)} per candy · ${edited ? "your input" : fmtDay(latest.guj?.date)}`} />
        <Kpi label="Cotlook A Index" value={a > 0 ? `${a.toFixed(2)} ¢/lb` : "—"} unit={ready ? `${inr(aInr)} per candy · ${edited ? "your input" : latest.a?.label ?? ""}` : ""} />
        <Kpi label="USD / INR" value={fx > 0 ? fx.toFixed(2) : "—"} unit={edited ? "your input" : `RBI reference · ${latest.fx?.label ?? ""}`} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* calculator */}
        <section className="panel p-4 sm:p-5">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Basis calculator</h2>
            {edited ? (
              <button type="button" onClick={() => setVals(init)} className="focusable text-[11.5px] font-medium text-accent hover:underline">
                Reset to latest
              </button>
            ) : (
              <span className="text-[11px] text-ink-faint">Latest prices</span>
            )}
          </div>
          <div className="space-y-3">
            <Input label="Guj-29 (Shankar-29)" unit="₹ / candy" value={vals.guj} onChange={(v) => setVals({ ...vals, guj: v })} hint={latest.guj ? `Latest ${latest.guj.price.toLocaleString("en-IN")} · ${fmtDay(latest.guj.date)}` : undefined} />
            <Input label="Cotlook A Index" unit="US ¢ / lb" step="0.01" value={vals.a} onChange={(v) => setVals({ ...vals, a: v })} hint={latest.a ? `Latest ${latest.a.value} · ${latest.a.label}` : undefined} />
            <Input label="USD / INR" unit="₹ per $" step="0.01" value={vals.fx} onChange={(v) => setVals({ ...vals, fx: v })} hint={latest.fx ? `Latest ${latest.fx.value} · ${latest.fx.label}` : undefined} />
          </div>

          <table className="mt-4 w-full border-collapse text-[12.5px]">
            <tbody>
              <Line label="Guj-29 in ¢/lb" note={`${inr(guj)} ÷ ${fx || "—"} ÷ 784.85 lb`} value={ready ? `${gujCents.toFixed(2)}` : "—"} />
              <Line label="Less: Cotlook A" value={a > 0 ? `−${a.toFixed(2)}` : "—"} />
              <Line label="Basis (¢/lb)" value={ready ? signed(basis) : "—"} strong tone={ready ? (premium ? "neg" : "pos") : undefined} />
              <Line label="Basis (₹/candy)" value={ready ? signedInr(basisInr) : "—"} tone={ready ? (premium ? "neg" : "pos") : undefined} />
              <Line label="Basis (% of A Index)" value={ready ? `${signed(pct, 1)}%` : "—"} tone={ready ? (premium ? "neg" : "pos") : undefined} />
            </tbody>
          </table>

          {ready ? (
            <p className={clsx("mt-3 rounded-xl px-3 py-2.5 text-[12px] leading-relaxed ring-1", premium ? "bg-neg-soft text-neg ring-neg/20" : "bg-pos-soft text-pos ring-pos/20")}>
              {premium ? (
                <>
                  <strong>Premium:</strong> Indian cotton is {Math.abs(basis).toFixed(2)} ¢/lb dearer than the cheapest cotton on
                  offer to Asian mills — exports are uncompetitive and imports look attractive.
                </>
              ) : (
                <>
                  <strong>Discount:</strong> Indian cotton is {Math.abs(basis).toFixed(2)} ¢/lb cheaper than the cheapest cotton on
                  offer to Asian mills — supports exports and holds imports back.
                </>
              )}
            </p>
          ) : null}
        </section>

        {/* charts */}
        <div className="min-w-0 space-y-4">
          <section className="panel p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Guj-29 vs Cotlook A Index · US ¢/lb</h2>
                <p className="mt-0.5 text-[11px] text-ink-faint">Monthly averages · Guj-29 converted at the RBI monthly USD/INR rate</p>
              </div>
              <Seg options={RANGES} value={range} onChange={setRange} />
            </div>
            {rows.length >= 2 ? (
              <LineChart
                labels={rows.map((r) => r.month)}
                smartX
                legend
                height={260}
                series={[
                  { label: "Guj-29 (India)", data: rows.map((r) => Math.round(r.gujCents * 100) / 100), color: "#0f9d63" },
                  { label: "Cotlook A Index", data: rows.map((r) => r.aIndex), color: "#2563c9" },
                ]}
                yFmt={(v) => `${v}¢`}
                tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y.toFixed(2)} ¢/lb`}
              />
            ) : (
              <Empty />
            )}
          </section>

          <section className="panel p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Basis · Guj-29 minus Cotlook A</h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-ink-faint">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: PREMIUM }} /> India at a premium</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: DISCOUNT }} /> India at a discount</span>
                  {avg != null ? <span className="num">· average {signed(avg)} ¢/lb</span> : null}
                </p>
              </div>
              <Seg
                options={[
                  { value: "cents", label: "¢/lb" },
                  { value: "inr", label: "₹/candy" },
                ]}
                value={unit}
                onChange={setUnit}
              />
            </div>
            {rows.length >= 2 ? (
              <BarChart
                labels={rows.map((r) => r.month)}
                smartX
                height={240}
                series={[
                  {
                    label: "Basis",
                    data: rows.map((r) => (unit === "cents" ? Math.round(r.basis * 100) / 100 : Math.round(r.basisInr))),
                    colors: rows.map((r) => (r.basis >= 0 ? PREMIUM : DISCOUNT)),
                  },
                ]}
                yFmt={(v) => (unit === "cents" ? `${v}¢` : `${v < 0 ? "−" : ""}₹${Math.abs(v / 1000).toFixed(0)}k`)}
                tooltipLabel={(c) => {
                  const r = rows[Number(c.parsed.x)];
                  return r ? `Basis ${signed(r.basis)} ¢/lb · ${signedInr(r.basisInr)}/candy · ${signed(r.pct, 1)}%` : "";
                }}
              />
            ) : (
              <Empty />
            )}
          </section>
        </div>
      </div>

      {/* monthly table */}
      <section className="panel mt-4 overflow-hidden">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Monthly basis · last 12 months</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-y border-line bg-surface-2 text-right text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2 text-left font-semibold sm:px-5">Month</th>
                <th className="px-3 py-2 font-semibold">Guj-29 ₹/candy</th>
                <th className="px-3 py-2 font-semibold">USD/INR</th>
                <th className="px-3 py-2 font-semibold">Guj-29 ¢/lb</th>
                <th className="px-3 py-2 font-semibold">Cotlook A ¢/lb</th>
                <th className="px-3 py-2 font-semibold">Basis ¢/lb</th>
                <th className="px-4 py-2 font-semibold sm:px-5">Basis %</th>
              </tr>
            </thead>
            <tbody>
              {all.slice(-12).reverse().map((r) => (
                <tr key={r.month} className="num border-b border-line text-right last:border-0">
                  <td className="px-4 py-2 text-left font-sans font-medium text-ink sm:px-5">{smartAxisLabel(r.month).replace("'", "20")}</td>
                  <td className="px-3 py-2 text-ink">{inr(r.guj)}</td>
                  <td className="px-3 py-2 text-ink-soft">{r.fx.toFixed(2)}</td>
                  <td className="px-3 py-2 text-ink">{r.gujCents.toFixed(2)}</td>
                  <td className="px-3 py-2 text-ink">{r.aIndex.toFixed(2)}</td>
                  <td className={clsx("px-3 py-2 font-semibold", r.basis >= 0 ? "text-neg" : "text-pos")}>{signed(r.basis)}</td>
                  <td className={clsx("px-4 py-2 sm:px-5", r.basis >= 0 ? "text-neg" : "text-pos")}>{signed(r.pct, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
        Basis = Guj-29 (Shankar-29, ex-gin Gujarat) − Cotlook A Index. The A Index is the average of the cheapest five cotton
        quotations delivered to Far East ports (CFR), so it includes freight that Guj-29 does not. Cotlook A: daily from
        Cotlook (cotlook.com), monthly from the World Bank Pink Sheet. 1 candy = 356 kg = 784.85 lb.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Kpi({ label, value, unit, tone, big }: { label: string; value: string; unit?: string; tone?: "pos" | "neg"; big?: boolean }) {
  return (
    <div className={clsx("bg-surface px-4 py-3.5 sm:px-5", big && tone === "pos" && "bg-pos-soft", big && tone === "neg" && "bg-neg-soft")}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={clsx("num mt-1 font-semibold tracking-tight", big ? "text-[24px]" : "text-[19px]", tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-ink")}>
        {value}
      </div>
      {unit ? <div className="mt-0.5 truncate text-[11px] text-ink-faint">{unit}</div> : null}
    </div>
  );
}

function Input({ label, unit, value, onChange, hint, step = "1" }: { label: string; unit: string; value: string; onChange: (v: string) => void; hint?: string; step?: string }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-medium text-ink">{label}</span>
        <span className="text-[10.5px] text-ink-faint">{unit}</span>
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="num w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-[14px] font-semibold text-ink outline-none focus:border-accent focus:bg-surface focus:ring-2 focus:ring-[var(--ring)]"
      />
      {hint ? <span className="num mt-1 block text-[10.5px] text-ink-faint">{hint}</span> : null}
    </label>
  );
}

function Line({ label, note, value, strong, tone }: { label: string; note?: string; value: string; strong?: boolean; tone?: "pos" | "neg" }) {
  return (
    <tr className={clsx("border-t border-line", strong && "bg-surface-2")}>
      <td className={clsx("py-2 pr-2", strong ? "font-semibold text-ink" : "text-ink-soft")}>
        {label}
        {note ? <span className="num block text-[10.5px] font-normal text-ink-faint">{note}</span> : null}
      </td>
      <td className={clsx("num whitespace-nowrap py-2 text-right", strong && "font-semibold", tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-ink")}>
        {value}
      </td>
    </tr>
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

function Empty() {
  return <div className="grid h-40 place-items-center text-[12px] text-ink-faint">Not enough data to chart yet.</div>;
}
