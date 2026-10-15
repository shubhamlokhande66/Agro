"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import BarChart from "@/components/charts/BarChart";
import { VARIETIES, latestDaily, type Variety } from "@/data/prices";
import { USDINR_1Y_L, USDINR_LATEST } from "@/data/currency";
import { inr, inrCompact } from "@/lib/format";
import { ginnerMargin, type GinInputs } from "@/lib/ginning";

/* ------------------------------------------------------------------ */

const variety = (key: string) => VARIETIES.find((v) => v.key === key);

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

/** "dd/mm/yy" (RBI daily label) → "YYYY-MM-DD" */
const rbiIso = (l: string | undefined) => {
  const m = l?.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  return m ? `20${m[3]}-${m[2]}-${m[1]}` : null;
};

/** the last quote on or before `date` (within `maxDays`), for lining up series quoted on different days */
function priceOn(v: Variety | undefined, date: string, maxDays = 7): number | null {
  const floor = new Date(Date.parse(date + "T00:00:00Z") - maxDays * 86400000).toISOString().slice(0, 10);
  let best: { date: string; price: number } | null = null;
  for (const p of v?.daily ?? []) if (p.date <= date && p.date >= floor && (!best || p.date > best.date)) best = p;
  return best?.price ?? null;
}

type Num = string; // inputs are kept as typed text

export default function MarginPage() {
  const latest = useMemo(() => {
    const k = variety("kapas");
    const s = variety("cseed");
    const g = variety("guj29");
    return {
      kapas: k ? latestDaily(k) : null,
      seed: s ? latestDaily(s) : null,
      lint: g ? latestDaily(g) : null,
      usdInr: USDINR_LATEST != null ? { price: Math.round(USDINR_LATEST * 100) / 100, date: rbiIso(USDINR_1Y_L.at(-1)) } : null,
    };
  }, []);

  const initial = {
    kapas: String(latest.kapas?.price ?? ""),
    seed: String(latest.seed?.price ?? ""),
    lint: String(latest.lint?.price ?? ""),
    usdInr: String(latest.usdInr?.price ?? ""),
  };
  const [prices, setPrices] = useState<Record<keyof typeof initial, Num>>(initial);
  const [assume, setAssume] = useState({ ginningPct: "6", seedPct: "65", lintPct: "35" });

  const n = (s: string) => {
    const v = parseFloat(s);
    return Number.isFinite(v) ? v : 0;
  };
  const inputs: GinInputs = {
    kapas: n(prices.kapas),
    seed: n(prices.seed),
    lint: n(prices.lint),
    usdInr: n(prices.usdInr),
    ginningPct: n(assume.ginningPct),
    seedPct: n(assume.seedPct),
    lintPct: n(assume.lintPct),
  };
  const r = ginnerMargin(inputs);
  const ready = inputs.kapas > 0 && inputs.seed > 0 && inputs.lint > 0 && inputs.lintPct > 0;
  const outturnOver = inputs.seedPct + inputs.lintPct > 100;
  const edited = (Object.keys(initial) as (keyof typeof initial)[]).some((k) => prices[k] !== initial[k]);

  // recent margin: each day a kapas quote exists (last 30 days), with that day's seed and Guj-29
  // prices and the assumptions above
  const trend = useMemo(() => {
    const k = variety("kapas");
    const s = variety("cseed");
    const g = variety("guj29");
    const days = [...(k?.daily ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    const last = days.at(-1)?.date;
    if (!last) return [];
    const from = new Date(Date.parse(last + "T00:00:00Z") - 30 * 86400000).toISOString().slice(0, 10);
    return days
      .filter((p) => p.date >= from)
      .map((p) => {
        const seed = priceOn(s, p.date);
        const lint = priceOn(g, p.date);
        if (seed == null || lint == null) return null;
        const m = ginnerMargin({ ...inputs, kapas: p.price, seed, lint });
        return { date: p.date, margin: Math.round(m.marginCandy), pct: m.marginPct, breakeven: m.bePerCandy, lint };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.ginningPct, inputs.seedPct, inputs.lintPct, inputs.usdInr]);

  const avg = trend.length ? trend.reduce((a, t) => a + t.margin, 0) / trend.length : null;
  const positive = r.marginCandy >= 0;

  return (
    <div>
      <PageHeader
        title="Margin Calculator"
        icon="∑"
        sub="Ginner's margin from live market prices · per tonne of kapas ginned"
      />

      <div className="mb-4 flex gap-1.5">
        <span className="rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-accent-contrast">Ginner&apos;s margin</span>
        <span className="cursor-not-allowed rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink-faint" title="Coming next">
          Spinner&apos;s margin · soon
        </span>
      </div>

      {/* headline result */}
      <section className="panel mb-4 grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Ginner's margin"
          value={ready ? `${positive ? "+" : "−"}${inr(Math.abs(r.marginCandy))}` : "—"}
          unit="per candy"
          tone={ready ? (positive ? "pos" : "neg") : undefined}
          big
        />
        <Kpi label="Margin on lint price" value={ready ? `${r.marginPct >= 0 ? "+" : ""}${r.marginPct.toFixed(2)}%` : "—"} tone={ready ? (positive ? "pos" : "neg") : undefined} />
        <Kpi label="Breakeven lint price" value={ready ? inr(r.bePerCandy) : "—"} unit={ready && Number.isFinite(r.beCentsLb) ? `per candy · ${r.beCentsLb.toFixed(2)} ¢/lb` : "per candy"} />
        <Kpi label="Market lint · Guj-29" value={inputs.lint > 0 ? inr(inputs.lint) : "—"} unit={edited ? "per candy · your input" : `per candy · ${fmtDate(latest.lint?.date)}`} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* inputs */}
        <div className="space-y-4">
          <section className="panel p-4 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Market prices</h2>
              {edited ? (
                <button type="button" onClick={() => setPrices(initial)} className="focusable text-[11.5px] font-medium text-accent hover:underline">
                  Reset all to latest
                </button>
              ) : (
                <span className="text-[11px] text-ink-faint">Latest market prices</span>
              )}
            </div>
            <div className="space-y-3">
              <PriceInput label="Kapas" unit="₹ / quintal" value={prices.kapas} latest={latest.kapas} onChange={(v) => setPrices({ ...prices, kapas: v })} onReset={() => setPrices({ ...prices, kapas: initial.kapas })} />
              <PriceInput label="Cotton seed" unit="₹ / quintal" value={prices.seed} latest={latest.seed} onChange={(v) => setPrices({ ...prices, seed: v })} onReset={() => setPrices({ ...prices, seed: initial.seed })} />
              <PriceInput label="Cotton lint · Guj-29 (Shankar-29)" unit="₹ / candy" value={prices.lint} latest={latest.lint} onChange={(v) => setPrices({ ...prices, lint: v })} onReset={() => setPrices({ ...prices, lint: initial.lint })} />
              <PriceInput label="USD / INR" unit="₹ per $" value={prices.usdInr} latest={latest.usdInr} onChange={(v) => setPrices({ ...prices, usdInr: v })} onReset={() => setPrices({ ...prices, usdInr: initial.usdInr })} step="0.01" />
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <h2 className="mb-3 text-[13.5px] font-semibold tracking-tight text-ink">Assumptions</h2>
            <div className="grid grid-cols-3 gap-2.5">
              <SmallInput label="Ginning cost" suffix="% of kapas" value={assume.ginningPct} onChange={(v) => setAssume({ ...assume, ginningPct: v })} />
              <SmallInput label="Seed outturn" suffix="% of kapas" value={assume.seedPct} onChange={(v) => setAssume({ ...assume, seedPct: v })} />
              <SmallInput label="Lint outturn" suffix="% of kapas" value={assume.lintPct} onChange={(v) => setAssume({ ...assume, lintPct: v })} />
            </div>
            {outturnOver ? (
              <p className="mt-2 text-[11px] text-neg">Seed + lint outturn is over 100% of the kapas weight.</p>
            ) : (
              <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
                Ginning cost covers processing, power, labour and overheads. Any kapas weight not recovered as seed or lint
                ({Math.max(0, 100 - inputs.seedPct - inputs.lintPct).toFixed(0)}%) is trash / moisture loss.
              </p>
            )}
          </section>
        </div>

        {/* working */}
        <div className="space-y-4">
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pb-2 pt-4 sm:px-5">
              <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Ginning breakeven · per tonne of kapas</h2>
              <span className="text-[11px] text-ink-faint">1 tonne = 10 quintals · 1 candy = 356 kg · 1 bale = 170 kg</span>
            </div>
            <table className="w-full border-collapse text-[12.5px]">
              <tbody>
                <Row label={`Kapas cost`} note={`${inr(inputs.kapas)}/qtl × 10 qtl`} value={r.kapasCost} />
                <Row label="Ginning charges" note={`${inputs.ginningPct}% of kapas cost`} value={r.ginning} />
                <Row label="Total cost" value={r.totalCost} strong />
                <Row label="Less: cotton seed recovered" note={`${inputs.seedPct}% → ${r.seedQtl.toFixed(1)} qtl × ${inr(inputs.seed)}/qtl`} value={-r.seedValue} />
                <Row label="Net cost of lint" note={`for ${r.lintKg.toFixed(0)} kg lint (${inputs.lintPct}% outturn)`} value={r.netLintCost} strong />
                <Row label="Breakeven lint price" note="per kg" value={r.bePerKg} digits={2} />
                <Row label="Breakeven lint price" note="per candy (356 kg)" value={r.bePerCandy} strong accent />
                <Row label="Breakeven lint price" note="per bale (170 kg)" value={r.bePerBale} />
                <tr className="border-t border-line">
                  <td className="px-4 py-2 text-ink-soft sm:px-5">Breakeven lint price</td>
                  <td className="px-2 py-2 text-[11px] text-ink-faint">US cents per pound @ ₹{inputs.usdInr || "—"}/$</td>
                  <td className="num whitespace-nowrap px-4 py-2 text-right text-ink sm:px-5">{Number.isFinite(r.beCentsLb) && ready ? `${r.beCentsLb.toFixed(2)} ¢/lb` : "—"}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="panel overflow-hidden">
            <div className="px-4 pb-2 pt-4 sm:px-5">
              <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Ginner&apos;s margin at today&apos;s lint price</h2>
            </div>
            <table className="w-full border-collapse text-[12.5px]">
              <tbody>
                <Row label="Market lint price" note="Guj-29, per candy" value={inputs.lint} />
                <Row label="Less: breakeven" note="per candy" value={-r.bePerCandy} />
                <Row label="Margin" note="per candy" value={r.marginCandy} strong signed tone />
                <Row label="Margin" note="per bale (170 kg)" value={r.marginBale} signed tone />
                <Row label="Margin" note="per tonne of kapas ginned" value={r.marginTonne} signed tone />
              </tbody>
            </table>
          </section>
        </div>
      </div>

      {/* recent margin */}
      <section className="panel mt-4 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Recent ginner&apos;s margin · ₹ per candy</h2>
            <p className="mt-0.5 text-[11px] text-ink-faint">
              Each day&apos;s kapas, seed and Guj-29 prices from the market data, with the assumptions above · last 30 days
            </p>
          </div>
          {avg != null ? (
            <div className="text-right">
              <div className="text-[10.5px] uppercase tracking-wide text-ink-faint">Average</div>
              <div className={clsx("num text-[15px] font-semibold", avg >= 0 ? "text-pos" : "text-neg")}>
                {avg >= 0 ? "+" : "−"}
                {inr(Math.abs(avg))}
              </div>
            </div>
          ) : null}
        </div>
        {trend.length >= 2 ? (
          <BarChart
            labels={trend.map((t) => fmtDate(t.date).replace(/ \d{4}$/, ""))}
            series={[{ label: "Margin ₹/candy", data: trend.map((t) => t.margin), colors: trend.map((t) => (t.margin >= 0 ? "#0f9d63" : "#d84a3c")) }]}
            yFmt={(v) => (v < 0 ? "−" : "") + inrCompact(Math.abs(v))}
            height={240}
            tooltipLabel={(c) => {
              const t = trend[Number(c.parsed.x)] ?? trend.find((x) => fmtDate(x.date).startsWith(c.label));
              return t ? `Margin ${t.margin >= 0 ? "+" : "−"}${inr(Math.abs(t.margin))} (${t.pct.toFixed(1)}%) · lint ${inr(t.lint)} · breakeven ${inr(t.breakeven)}` : "";
            }}
          />
        ) : (
          <div className="grid h-40 place-items-center text-[12px] text-ink-faint">Not enough recent kapas prices to chart.</div>
        )}
      </section>

      <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
        Indicative only. Kapas: NCDEX Rajkot spot. Cotton seed: NCDEX Akola-based. Lint: Guj-29 (Shankar-29) spot. Actual
        ginning margins vary with kapas quality, moisture, outturn and ginning costs at each factory.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Kpi({ label, value, unit, tone, big }: { label: string; value: string; unit?: string; tone?: "pos" | "neg"; big?: boolean }) {
  return (
    <div className={clsx("bg-surface px-4 py-3.5 sm:px-5", tone === "pos" && big && "bg-pos-soft", tone === "neg" && big && "bg-neg-soft")}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div
        className={clsx(
          "num mt-1 font-semibold tracking-tight",
          big ? "text-[24px]" : "text-[19px]",
          tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-ink",
        )}
      >
        {value}
      </div>
      {unit ? <div className="mt-0.5 truncate text-[11px] text-ink-faint">{unit}</div> : null}
    </div>
  );
}

function PriceInput({
  label,
  unit,
  value,
  latest,
  onChange,
  onReset,
  step = "1",
}: {
  label: string;
  unit: string;
  value: string;
  latest: { price: number; date: string | null } | null;
  onChange: (v: string) => void;
  onReset: () => void;
  step?: string;
}) {
  const changed = latest != null && value !== String(latest.price);
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
        className={clsx(
          "num w-full rounded-xl border bg-surface-2 px-3 py-2.5 text-[14px] font-semibold text-ink outline-none transition-colors focus:border-accent focus:bg-surface focus:ring-2 focus:ring-[var(--ring)]",
          changed ? "border-warn" : "border-line",
        )}
      />
      <span className="mt-1 flex items-center justify-between gap-2 text-[10.5px] text-ink-faint">
        {latest ? (
          <span className="num">
            Latest {latest.price.toLocaleString("en-IN")} · {fmtDate(latest.date)}
          </span>
        ) : (
          <span>No market price available — enter one</span>
        )}
        {changed ? (
          <button type="button" onClick={(e) => (e.preventDefault(), onReset())} className="focusable font-medium text-accent hover:underline">
            Use latest
          </button>
        ) : null}
      </span>
    </label>
  );
}

function SmallInput({ label, suffix, value, onChange }: { label: string; suffix: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block truncate text-[11px] font-medium text-ink">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="num w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-[13px] font-semibold text-ink outline-none focus:border-accent focus:bg-surface"
      />
      <span className="mt-0.5 block truncate text-[10px] text-ink-faint">{suffix}</span>
    </label>
  );
}

function Row({
  label,
  note,
  value,
  strong,
  accent,
  signed,
  tone,
  digits = 0,
}: {
  label: string;
  note?: string;
  value: number;
  strong?: boolean;
  accent?: boolean;
  signed?: boolean;
  tone?: boolean;
  digits?: number;
}) {
  const ok = Number.isFinite(value);
  const text = !ok ? "—" : signed ? `${value >= 0 ? "+" : "−"}${inr(Math.abs(value), digits)}` : value < 0 ? `−${inr(-value, digits)}` : inr(value, digits);
  return (
    <tr className={clsx("border-t border-line", strong && "bg-surface-2")}>
      <td className={clsx("px-4 py-2 sm:px-5", strong ? "font-semibold text-ink" : "text-ink-soft")}>{label}</td>
      <td className="px-2 py-2 text-[11px] text-ink-faint">{note}</td>
      <td
        className={clsx(
          "num whitespace-nowrap px-4 py-2 text-right sm:px-5",
          strong && "font-semibold",
          tone && ok ? (value >= 0 ? "text-pos" : "text-neg") : accent ? "text-accent" : "text-ink",
        )}
      >
        {text}
      </td>
    </tr>
  );
}
