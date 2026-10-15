"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import ComboChart from "@/components/charts/ComboChart";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { COT_GROUPS, COT_WEEKS, cotLong, cotNet, cotNetChg, cotShort, cotSpread, type CotWeek } from "@/data/cftc";
import { ICE_D_L, ICE_D_V, ICE_M_L, ICE_M_V } from "@/data/international";
import { useAuth } from "@/lib/auth";
import { useDatasets } from "@/lib/datasets/provider";

type Tab = "overview" | "weekly" | "positioning";
type Range = 26 | 52 | 156 | 260;
const RANGES: { value: string; label: string }[] = [
  { value: "26", label: "6M" },
  { value: "52", label: "1Y" },
  { value: "156", label: "3Y" },
  { value: "260", label: "5Y" },
];

const fmtN = (v: number) => Math.round(v).toLocaleString("en-US");
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmtN(Math.abs(v))}`;
const fmtDay = (iso: string | null | undefined) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const shortDay = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });

/** ICE cotton (¢/lb) on a COT Tuesday: that day's settlement (or the last one before), else the month's average */
function icePrice(date: string): number | null {
  const iso = (l: string) => `20${l.slice(6, 8)}-${l.slice(3, 5)}-${l.slice(0, 2)}`;
  for (let i = ICE_D_L.length - 1; i >= 0; i--) {
    const d = iso(ICE_D_L[i]);
    if (d <= date) {
      const gap = (Date.parse(date) - Date.parse(d)) / 86400000;
      if (gap <= 5) return ICE_D_V[i];
      break;
    }
  }
  const m = ICE_M_L.indexOf(date.slice(0, 7));
  return m >= 0 ? ICE_M_V[m] : null;
}

export default function CftcPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<Range>(52);
  const weeks = COT_WEEKS;

  if (!weeks.length) {
    return (
      <div>
        <PageHeader title="CFTC — Commitments of Traders" icon="◔" dataset="cftc" right={<RefreshButton />} />
        <div className="panel mx-auto max-w-lg p-8 text-center text-[13px] text-ink-soft">
          No COT data yet — it syncs automatically from the CFTC every day.
        </div>
      </div>
    );
  }

  const w = weeks.at(-1)!;
  const shown = weeks.slice(-range);

  return (
    <div>
      <PageHeader
        title="CFTC — Commitments of Traders"
        icon="◔"
        dataset="cftc"
        sub={`ICE Cotton No. 2 futures · positions as of Tuesday ${fmtDay(w.date)} · Disaggregated report · contracts (50,000 lb) · published every Friday`}
        right={<RefreshButton />}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Seg
          options={[
            { value: "overview", label: "Overview" },
            { value: "weekly", label: "Weekly data" },
            { value: "positioning", label: "Positioning" },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab !== "positioning" ? <Seg options={RANGES} value={String(range)} onChange={(v) => setRange(Number(v) as Range)} /> : null}
      </div>

      {tab === "overview" ? <Overview weeks={weeks} shown={shown} /> : null}
      {tab === "weekly" ? <WeeklyTable shown={shown} /> : null}
      {tab === "positioning" ? <Positioning w={w} /> : null}

      <p className="mt-4 text-[11px] leading-relaxed text-ink-faint">
        Source: U.S. Commodity Futures Trading Commission, Commitments of Traders — Disaggregated, futures only, ICE Cotton No. 2
        (code 033661). Managed money = funds and CTAs (speculators); producer / merchant = commercial hedgers (merchants, mills,
        ginners); net = long − short. ICE price: settlement on the report date (monthly average before Sep 2024).
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Overview({ weeks, shown }: { weeks: CotWeek[]; shown: CotWeek[] }) {
  const w = weeks.at(-1)!;
  const mmNet = cotNet(w, "mm");
  const mmChg = cotNetChg(w, "mm");
  // where this week's managed-money net sits in its 3-year range
  const last3y = weeks.slice(-156).map((x) => cotNet(x, "mm"));
  const lo = Math.min(...last3y);
  const hi = Math.max(...last3y);
  const pctile = hi > lo ? Math.round(((mmNet - lo) / (hi - lo)) * 100) : null;
  const price = shown.map((x) => icePrice(x.date));

  return (
    <>
      <section className="panel mb-4 grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label="Managed money · net"
          value={signed(mmNet)}
          tone={mmNet >= 0 ? "pos" : "neg"}
          note={<><Delta v={mmChg} /> on the week · {mmNet >= 0 ? "net long" : "net short"}</>}
          strong
        />
        <Kpi
          label="Funds · 3-year range"
          value={pctile != null ? `${pctile}%` : "—"}
          note={<>of range {signed(lo)} to {signed(hi)}</>}
          bar={pctile}
        />
        <Kpi label="Managed money · long / short" value={`${fmtN(w.mmLong)} / ${fmtN(w.mmShort)}`} note={<><Delta v={w.mmLongChg} /> / <Delta v={w.mmShortChg} /> · {w.mmTradersLong} / {w.mmTradersShort} traders</>} />
        <Kpi label="Producer / merchant · net" value={signed(cotNet(w, "pm"))} note={<><Delta v={cotNetChg(w, "pm")} /> on the week · commercial hedging</>} />
        <Kpi label="Open interest" value={fmtN(w.oi)} note={<><Delta v={w.oiChg} /> on the week · funds net {((mmNet / w.oi) * 100).toFixed(1)}% of OI</>} />
      </section>

      <Card title="Managed money net vs ICE cotton" sub="Funds' net position (contracts, left) against the ICE Cotton No. 2 price (¢/lb, right)">
        <ComboChart
          labels={shown.map((x) => shortDay(x.date))}
          height={280}
          xTicks={10}
          left={{ label: "Managed money net", data: shown.map((x) => cotNet(x, "mm")), color: "#2563c9", fmt: (v) => `${Math.round(v / 1000)}k` }}
          right={{ label: "ICE cotton ¢/lb", data: price, color: "#d97706", fmt: (v) => `${v.toFixed(0)}¢` }}
        />
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Net positions by trader group" sub="Long − short, contracts">
          <LineChart
            labels={shown.map((x) => shortDay(x.date))}
            legend
            height={260}
            xTicks={8}
            series={COT_GROUPS.filter((g) => g.key !== "nr").map((g) => ({ label: g.label, color: g.color, data: shown.map((x) => cotNet(x, g.key)) }))}
            yFmt={(v) => `${Math.round(v / 1000)}k`}
            tooltipLabel={(c) => `${c.dataset.label}: ${signed(c.parsed.y)}`}
          />
        </Card>
        <Card title="Managed money · weekly change in net" sub="Buying (+) and selling (−) by funds, contracts">
          <BarChart
            labels={shown.map((x) => shortDay(x.date))}
            height={260}
            xTicks={8}
            series={[{ label: "Change in net", data: shown.map((x) => cotNetChg(x, "mm")), colors: shown.map((x) => (cotNetChg(x, "mm") >= 0 ? "#0f9d63" : "#d84a3c")) }]}
            yFmt={(v) => `${Math.round(v / 1000)}k`}
          />
        </Card>
      </div>
    </>
  );
}

/** one row per week, newest first */
function WeeklyTable({ shown }: { shown: CotWeek[] }) {
  const rows = [...shown].reverse();
  return (
    <section className="panel overflow-hidden">
      <div className="px-4 pb-2 pt-4 sm:px-5">
        <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Weekly Commitments of Traders · ICE Cotton No. 2</h2>
        <p className="mt-0.5 text-[11px] text-ink-faint">Contracts · newest first · net = long − short · Δ = change on the week</p>
      </div>
      <div className="max-h-[72vh] overflow-auto">
        <table className="w-full min-w-[1100px] border-collapse text-[12px]">
          <thead className="sticky top-0 z-10 bg-surface-2">
            <tr className="text-[10px] uppercase tracking-wide text-ink-faint">
              <th rowSpan={2} className="border-b border-line px-4 py-2 text-left font-semibold sm:px-5">Report date</th>
              <th rowSpan={2} className="border-b border-line px-3 py-2 text-right font-semibold">ICE ¢/lb</th>
              <th colSpan={2} className="border-b border-l border-line px-3 pt-2 text-center font-semibold">Open interest</th>
              <th colSpan={5} className="border-b border-l border-line bg-info-soft/40 px-3 pt-2 text-center font-semibold text-info">Managed money</th>
              <th colSpan={2} className="border-b border-l border-line px-3 pt-2 text-center font-semibold">Producer / merchant</th>
              <th colSpan={2} className="border-b border-l border-line px-3 pt-2 text-center font-semibold">Swap dealers</th>
              <th rowSpan={2} className="border-b border-l border-line px-3 py-2 text-right font-semibold">Other rept. net</th>
              <th rowSpan={2} className="border-b border-line px-4 py-2 text-right font-semibold sm:px-5">Non-rept. net</th>
            </tr>
            <tr className="text-right text-[10px] uppercase tracking-wide text-ink-faint">
              <th className="border-b border-l border-line px-3 py-1.5 font-semibold">Total</th>
              <th className="border-b border-line px-3 py-1.5 font-semibold">Δ</th>
              <th className="border-b border-l border-line px-3 py-1.5 font-semibold">Long</th>
              <th className="border-b border-line px-3 py-1.5 font-semibold">Short</th>
              <th className="border-b border-line px-3 py-1.5 font-semibold">Spread</th>
              <th className="border-b border-line px-3 py-1.5 font-semibold">Net</th>
              <th className="border-b border-line px-3 py-1.5 font-semibold">Δ net</th>
              <th className="border-b border-l border-line px-3 py-1.5 font-semibold">Net</th>
              <th className="border-b border-line px-3 py-1.5 font-semibold">Δ net</th>
              <th className="border-b border-l border-line px-3 py-1.5 font-semibold">Net</th>
              <th className="border-b border-line px-3 py-1.5 font-semibold">Δ net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => {
              const p = icePrice(x.date);
              return (
                <tr key={x.date} className="num border-b border-line text-right last:border-0 hover:bg-surface-2/60">
                  <td className="whitespace-nowrap px-4 py-1.5 text-left font-sans font-medium text-ink sm:px-5">{fmtDay(x.date)}</td>
                  <td className="px-3 py-1.5 text-ink-soft">{p != null ? p.toFixed(2) : "—"}</td>
                  <td className="border-l border-line px-3 py-1.5 text-ink">{fmtN(x.oi)}</td>
                  <td className="px-3 py-1.5"><Delta v={x.oiChg} /></td>
                  <td className="border-l border-line px-3 py-1.5 text-ink">{fmtN(x.mmLong)}</td>
                  <td className="px-3 py-1.5 text-ink">{fmtN(x.mmShort)}</td>
                  <td className="px-3 py-1.5 text-ink-soft">{fmtN(x.mmSpread)}</td>
                  <td className={clsx("px-3 py-1.5 font-semibold", cotNet(x, "mm") >= 0 ? "text-pos" : "text-neg")}>{signed(cotNet(x, "mm"))}</td>
                  <td className="px-3 py-1.5"><Delta v={cotNetChg(x, "mm")} /></td>
                  <td className={clsx("border-l border-line px-3 py-1.5 font-semibold", cotNet(x, "pm") >= 0 ? "text-pos" : "text-neg")}>{signed(cotNet(x, "pm"))}</td>
                  <td className="px-3 py-1.5"><Delta v={cotNetChg(x, "pm")} /></td>
                  <td className="border-l border-line px-3 py-1.5 text-ink">{signed(cotNet(x, "sw"))}</td>
                  <td className="px-3 py-1.5"><Delta v={cotNetChg(x, "sw")} /></td>
                  <td className="border-l border-line px-3 py-1.5 text-ink">{signed(cotNet(x, "or"))}</td>
                  <td className="px-4 py-1.5 text-ink sm:px-5">{signed(cotNet(x, "nr"))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** the latest week by trader group */
function Positioning({ w }: { w: CotWeek }) {
  const rows = COT_GROUPS.map((g) => {
    const long = cotLong(w, g.key);
    const short = cotShort(w, g.key);
    return { ...g, long, short, spread: cotSpread(w, g.key), net: long - short, chg: cotNetChg(w, g.key) };
  });
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card title={`Long vs short by group · ${fmtDay(w.date)}`} sub="Contracts">
        <BarChart
          labels={rows.map((r) => r.label)}
          horizontal
          legend
          height={300}
          series={[
            { label: "Long", color: "#0f9d63", data: rows.map((r) => r.long) },
            { label: "Short", color: "#d84a3c", data: rows.map((r) => r.short) },
          ]}
          yFmt={(v) => `${Math.round(v / 1000)}k`}
        />
      </Card>
      <section className="panel overflow-hidden">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Positions by trader group</h2>
          <p className="mt-0.5 text-[11px] text-ink-faint">Contracts · % of open interest ({fmtN(w.oi)})</p>
        </div>
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-y border-line bg-surface-2 text-right text-[10px] uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2 text-left font-semibold sm:px-5">Group</th>
              <th className="px-3 py-2 font-semibold">Long</th>
              <th className="px-3 py-2 font-semibold">Short</th>
              <th className="px-3 py-2 font-semibold">Net</th>
              <th className="px-3 py-2 font-semibold">Δ net</th>
              <th className="px-4 py-2 font-semibold sm:px-5">Long % / Short % OI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className={clsx("num border-b border-line text-right last:border-0", r.key === "mm" && "bg-surface-2")}>
                <td className="px-4 py-2 text-left font-sans sm:px-5">
                  <span className="inline-flex items-center gap-2 font-medium text-ink">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
                    {r.label}
                  </span>
                  {r.spread ? <span className="block pl-[18px] text-[10.5px] text-ink-faint">spreading {fmtN(r.spread)}</span> : null}
                </td>
                <td className="px-3 py-2 text-ink">{fmtN(r.long)}</td>
                <td className="px-3 py-2 text-ink">{fmtN(r.short)}</td>
                <td className={clsx("px-3 py-2 font-semibold", r.net >= 0 ? "text-pos" : "text-neg")}>{signed(r.net)}</td>
                <td className="px-3 py-2"><Delta v={r.chg} /></td>
                <td className="px-4 py-2 text-ink-soft sm:px-5">
                  {((r.long / w.oi) * 100).toFixed(1)}% / {((r.short / w.oi) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** signed-in users: pull the latest COT now (the same sync the daily job runs), then reload */
function RefreshButton() {
  const { authed } = useAuth();
  const { refresh } = useDatasets();
  const [state, setState] = useState<{ busy: boolean; msg: string; err?: boolean }>({ busy: false, msg: "" });
  if (!authed) return null;
  async function run() {
    setState({ busy: true, msg: "Fetching from the CFTC…" });
    try {
      const res = await fetch("/api/cron/cftc", { cache: "no-store" });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error ?? `Refresh failed (${res.status})`);
      const added = (out.dates ?? []).length;
      const recent = !!out.recent;
      await refresh();
      setState({ busy: false, msg: added ? `Updated · ${added} new week${added > 1 ? "s" : ""}` : `${recent ? "Checked a few minutes ago" : "Up to date"} · latest ${fmtDay(out.latestWeek)}` });
    } catch (e) {
      setState({ busy: false, msg: e instanceof Error ? e.message : "Refresh failed", err: true });
    }
  }
  return (
    <span className="flex flex-wrap items-center justify-end gap-2">
      {state.msg ? <span className={clsx("text-[11px]", state.err ? "text-neg" : "text-ink-faint")}>{state.msg}</span> : null}
      <button
        type="button"
        onClick={run}
        disabled={state.busy}
        title="Fetch the latest Commitments of Traders from the CFTC now"
        className="focusable rounded-xl border border-line px-3.5 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
      >
        {state.busy ? "Refreshing…" : "↻ Refresh data"}
      </button>
    </span>
  );
}

function Kpi({ label, value, note, tone, strong, bar }: { label: string; value: string; note?: React.ReactNode; tone?: "pos" | "neg"; strong?: boolean; bar?: number | null }) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={clsx("num mt-1 font-semibold tracking-tight", strong ? "text-[22px]" : "text-[18px]", tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-ink")}>
        {value}
      </div>
      {bar != null ? (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-info" style={{ width: `${Math.max(2, Math.min(100, bar))}%` }} />
        </div>
      ) : null}
      {note ? <div className="num mt-1 text-[11px] text-ink-faint">{note}</div> : null}
    </div>
  );
}

function Delta({ v }: { v: number }) {
  return <span className={clsx("font-semibold", v > 0 ? "text-pos" : v < 0 ? "text-neg" : "text-ink-faint")}>{v === 0 ? "0" : signed(v)}</span>;
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">{title}</h2>
        {sub ? <p className="mt-0.5 text-[11px] text-ink-faint">{sub}</p> : null}
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
