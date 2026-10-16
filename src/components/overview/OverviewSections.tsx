"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Delta } from "@/components/ui/ChangeBadge";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import { CommentsPanel } from "@/components/ui/CommentsPanel";
import { CottonBeltRain } from "./CottonBeltRain";
import { BenchmarksSection, FieldPulseSection } from "./ReportExtras";
import { ReportHeading } from "./ReportHeading";
import { autoCommentary } from "@/lib/autoCommentary";
import LineChart, { type LineSeries } from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { RF_ALL_YEARS, RF_COMPOSITE_T, RF_JJAS, RF_MONTHS_L, jjas, pctDeviation } from "@/data/rainfall";
import { ARRIVALS, ARRIVAL_SEASONS, ARRIVAL_WEEKS } from "@/data/arrivals";
import { SOWING_SERIES, SOWING_WEEKS } from "@/data/sowing";
import { DP_DATA, DP_REGIONS, DP_SEASONS, DP_STATE_LABELS, dpValue, type DpMetric } from "@/data/production";
import { SND } from "@/data/balanceSheet";
import { SND_MONTHS_INDIA, currentSndMonth, sndAnnual, sndMonthsTo, sndPeriod, type SndRow } from "@/lib/snd";
import { CCI, cciWeekly } from "@/data/cci";
import { WASDE_REPORTS, convertWasde, type WasdeRow } from "@/data/wasde";
import { COT_WEEKS, cotNet, cotNetChg } from "@/data/cftc";
import { ES_YEARS } from "@/data/exportSales";
import { icePriceOn } from "@/data/international";
import { monthlyBasis } from "@/lib/basis";
import ComboChart from "@/components/charts/ComboChart";
import { num, pctChange, shortDate, signedPct } from "@/lib/format";

const lastNum = (a: (number | null)[] | undefined) =>
  (a ?? []).filter((x): x is number => x != null && !Number.isNaN(x)).at(-1) ?? null;

/** index of the last numeric value, or -1 */
const lastIdx = (a: (number | null)[] | undefined) => {
  const arr = a ?? [];
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null && !Number.isNaN(arr[i] as number)) return i;
  return -1;
};

function More({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="print-hide text-[11px] font-semibold text-accent hover:underline">
      {label} →
    </Link>
  );
}

/** one figure in the rainfall card's headline strip */
function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="min-w-0 px-2.5 py-1.5">
      <div className="truncate text-[8.5px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div
        className={
          "num mt-0.5 truncate text-[12.5px] font-semibold leading-tight " +
          (tone === "neg" ? "text-neg" : tone === "pos" ? "text-pos" : "text-ink")
        }
      >
        {value}
      </div>
    </div>
  );
}

/** pos / neg tone for a % change (no tone when flat or unknown) */
const toneOf = (v: number | null): "pos" | "neg" | undefined =>
  v == null || Math.abs(v) < 0.05 ? undefined : v > 0 ? "pos" : "neg";

/** the rainfall card's slim three-figure strip, shared by the other overview cards */
function StatStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-surface-2/60">
      {children}
    </div>
  );
}

function WeatherSection() {
  // the latest year with any reported month (the season in progress) + the one before it
  const hasData = (y: string) => (RF_COMPOSITE_T["y" + y] ?? []).some((v) => v != null);
  const year = [...RF_ALL_YEARS].reverse().find(hasData) ?? RF_ALL_YEARS.at(-1) ?? "";
  const prevYear = RF_ALL_YEARS[RF_ALL_YEARS.indexOf(year) - 1];
  const cur = (RF_COMPOSITE_T["y" + year] ?? []) as (number | null)[];
  const prev = prevYear ? ((RF_COMPOSITE_T["y" + prevYear] ?? []) as (number | null)[]) : [];
  const normal = (RF_COMPOSITE_T.normal ?? []) as number[];

  // JJAS so far: only the Jun–Sep months already reported this year, vs normal for those same months
  const reported = RF_JJAS.filter((i) => cur[i] != null);
  const jj = reported.length ? reported.reduce((a, i) => a + (cur[i] ?? 0), 0) : null;
  const jjNormal = reported.reduce((a, i) => a + (normal[i] ?? 0), 0);
  const dev = pctChange(jj, jjNormal || null);
  const prevJj = prevYear ? jjas(prev as number[]) : null;
  const through = reported.length && reported.length < RF_JJAS.length ? ` · to ${RF_MONTHS_L[reported.at(-1)!]}` : "";

  // % deviation from normal per month, latest year vs the one before (as on the Weather page)
  const devCur = pctDeviation(cur, normal);
  const devPrev = prevYear ? pctDeviation(prev, normal) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
    <Card>
      <CardHeader
        title="Weather & Rainfall · India"
        sub={`Cotton-belt composite · ${year}${prevYear ? ` vs ${prevYear}` : ""} vs LPA normal · mm`}
        right={<More href="/weather" label="Full view" />}
      />
      {/* headline figures as one slim strip, so the chart keeps its height */}
      <StatStrip>
        <Stat label={`JJAS ${year}${through}`} value={jj != null ? `${Math.round(jj)} mm` : "—"} />
        <Stat
          label={`vs normal${through}`}
          value={signedPct(dev, 0)}
          tone={dev == null ? undefined : dev < 0 ? "neg" : "pos"}
        />
        {prevYear ? <Stat label={`JJAS ${prevYear}`} value={prevJj != null ? `${Math.round(prevJj)} mm` : "—"} /> : null}
      </StatStrip>
        <LineChart
          labels={RF_MONTHS_L}
          series={[
            // actual years dotted, the LPA normal the highlighted solid reference; straight segments
            { label: `${year}`, data: cur, color: "#2d7d46", width: 2.5, dotted: true, tension: 0, pointRadius: 3 },
            ...(prevYear ? [{ label: `${prevYear}`, data: prev, color: "#2563eb", width: 2.5, dotted: true, tension: 0, pointRadius: 3 }] : []),
            { label: "Normal (LPA)", data: normal, color: "#c97b1e", width: 3.5, tension: 0, pointRadius: 3, fill: true, fillColor: "rgba(201,123,30,0.12)" },
          ]}
          yFmt={(v) => Math.round(v) + "mm"}
          tooltipLabel={(c) => `${c.dataset.label}: ${Math.round(c.parsed.y)} mm`}
          smartX={false}
          height={170}
        />
    </Card>

    <Card>
      <CardHeader
        title="% deviation from normal"
        sub={`${prevYear ? `${prevYear} vs ` : ""}${year} · monthly rainfall vs LPA normal · %`}
      />
      {devCur.some((v) => v != null) || devPrev.some((v) => v != null) ? (
        <BarChart
          labels={RF_MONTHS_L}
          series={[
            ...(prevYear ? [{ label: prevYear, data: devPrev, color: "#94a3b8" }] : []),
            {
              label: year,
              data: devCur,
              color: "#2d7d46",
              valueLabel: (v: number) => `${v >= 0 ? "+" : ""}${Math.round(v)}%`,
            },
          ]}
          legend
          yFmt={(v) => Math.round(v) + "%"}
          tooltipLabel={(c) => {
            const v = c.parsed.y;
            return `${c.dataset.label}: ${v >= 0 ? "+" : ""}${v.toFixed(1)}% vs normal`;
          }}
          smartX={false}
          height={222}
        />
      ) : (
        <p className="text-[12px] text-ink-faint">No {year} rainfall reported yet.</p>
      )}
    </Card>
    </div>
  );
}

function ArrivalsSection() {
  const seasons = ARRIVAL_SEASONS ?? [];
  const latestKey = seasons.at(-1);
  const prevKey = seasons.at(-2);
  if (!latestKey) return null;
  const curAll = ARRIVALS[latestKey] ?? [];
  const prev = prevKey ? ARRIVALS[prevKey] ?? [] : [];
  // latest reported week, and last season at that same week
  const wi = lastIdx(curAll);
  const curLatest = wi >= 0 ? curAll[wi] : null;
  const prevAtSame = wi >= 0 ? prev[wi] ?? null : null;
  const yoy = pctChange(curLatest, prevAtSame);
  const prevTotal = lastNum(prev);
  const series: LineSeries[] = [
    ...(prevKey ? [{ label: prevKey, data: ARRIVALS[prevKey] ?? [], color: "#1d4ed8", width: 3 }] : []),
    { label: latestKey, data: ARRIVALS[latestKey] ?? [], color: "#dc2626", width: 3.5 },
  ];

  return (
    <Card>
      <CardHeader
        title="Cotton Arrivals"
        sub="Cumulative market arrivals · lakh bales"
        right={<More href="/arrivals" label="Details" />}
      />
      <StatStrip>
        <Stat label={`${latestKey}${wi >= 0 && ARRIVAL_WEEKS[wi] ? ` · wk ${shortDate(ARRIVAL_WEEKS[wi])}` : ""}`} value={curLatest != null ? `${num(curLatest, 1)} lakh bales` : "—"} />
        <Stat label={`vs ${prevKey ?? "prev"} · same wk`} value={signedPct(yoy, 1)} tone={toneOf(yoy)} />
        <Stat label={`${prevKey ?? "prev"} season total`} value={prevTotal != null ? `${num(prevTotal, 1)} lakh bales` : "—"} />
      </StatStrip>
      <LineChart
        labels={ARRIVAL_WEEKS}
        series={series}
        height={210}
        smartX={false}
        xTicks={6}
        tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y} lakh bales`}
      />
    </Card>
  );
}

function SowingSection() {
  const series = SOWING_SERIES ?? [];
  const normalS = series.find((s) => /normal/i.test(s.label));
  const years = series.filter((s) => /^\d{4}$/.test(s.label)).sort((a, b) => Number(b.label) - Number(a.label));
  const curS = years[0];
  const prevS = years[1];
  if (!curS) return null;
  // latest reported week, compared with last year and the normal at that same week
  const wi = lastIdx(curS.data);
  const cur = wi >= 0 ? curS.data[wi] : null;
  const prev = wi >= 0 ? prevS?.data?.[wi] ?? null : null;
  const normal = wi >= 0 ? normalS?.data?.[wi] ?? null : null;
  const vsPrev = pctChange(cur, prev);
  const vsNormal = pctChange(cur, normal);

  return (
    <Card>
      <CardHeader
        title={`Cotton Sowing · ${curS.label}`}
        sub={`Cumulative area sown · lakh ha · ${curS.label} vs ${prevS?.label ?? "prev"} vs normal`}
        right={<More href="/sowing" label="Details" />}
      />
      <StatStrip>
        <Stat label={`Sown${wi >= 0 ? ` · ${SOWING_WEEKS[wi]}` : ""}`} value={cur != null ? `${num(cur, 2)} lakh ha` : "—"} />
        <Stat label={`vs ${prevS?.label ?? "prev"} · same wk`} value={signedPct(vsPrev, 1)} tone={toneOf(vsPrev)} />
        <Stat label="vs normal · same wk" value={signedPct(vsNormal, 1)} tone={toneOf(vsNormal)} />
      </StatStrip>
      <LineChart
        labels={SOWING_WEEKS}
        series={[
          ...(normalS ? [{ label: normalS.label, data: normalS.data ?? [], color: "#475569", width: 2.5, dashed: true }] : []),
          ...(prevS ? [{ label: prevS.label, data: prevS.data ?? [], color: "#1d4ed8", width: 3 }] : []),
          { label: curS.label, data: curS.data ?? [], color: "#dc2626", width: 3.5 },
        ]}
        height={210}
        smartX={false}
        xTicks={6}
        tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y} lakh ha`}
      />
    </Card>
  );
}

const PROD_ORDER = [...DP_REGIONS.NORTH, ...DP_REGIONS.WEST, ...DP_REGIONS.SOUTH, ...DP_REGIONS.OTHER];

const DP_METRICS: { key: DpMetric; label: string; unit: string; header: string; digits: number }[] = [
  { key: "area", label: "Area", unit: "th. ha", header: "Area (K.Ha)", digits: 0 },
  { key: "yield", label: "Yield", unit: "kg/ha", header: "Yield (kg/ha)", digits: 0 },
  { key: "prod", label: "Production", unit: "lakh bales", header: "Production (In Lakh Bales)", digits: 1 },
];

/** compact table cells for the production tables */
const cellTd = "px-2 py-0 text-[11.5px] leading-[18px]";
const cellTh = "px-2 py-1.5 text-[9.5px]";

/** a % change as small coloured text (tables stay calm; the badges are for headline figures) */
function DeltaText({ value }: { value: number | null }) {
  const tone = value == null || Math.abs(value) < 0.05 ? "text-ink-faint" : value > 0 ? "text-pos" : "text-neg";
  return <span className={"num text-[11px] font-medium " + tone}>{signedPct(value, 1)}</span>;
}

/** "2026/27" -> "2026 crop" */
const cropLabel = (season: string) => `${season.slice(0, 4)} crop`;

function ProductionSection() {
  const [metric, setMetric] = useState<DpMetric | "all">("all");
  const sB = DP_SEASONS.at(-1);
  const sA = DP_SEASONS.at(-2);
  if (!sA || !sB) return null;
  const m = metric === "all" ? null : DP_METRICS.find((x) => x.key === metric)!;
  const rows = [...PROD_ORDER, "ALL_INDIA"];
  const stateName = (st: string) => (st === "ALL_INDIA" ? "All India" : DP_STATE_LABELS[st] ?? st);
  // zebra rows; All India as a highlighted total row
  const rowClass = (st: string) =>
    st === "ALL_INDIA"
      ? "bg-accent/10 font-semibold [&>td]:border-t-2 [&>td]:border-t-line-strong"
      : rows.indexOf(st) % 2 === 1
        ? "bg-surface-2/50"
        : undefined;

  return (
    <Card>
      <CardHeader
        title={`India Cotton Production · ${sB}`}
        sub={`Area · yield · production · ${cropLabel(sB)} (${sB}) vs ${sA}`}
        right={<More href="/production" label="Full production" />}
      />

      {/* All-India area / yield / production, previous crop -> latest crop */}
      <div className="grid grid-cols-3 gap-2">
        {DP_METRICS.map((x) => {
          const a = dpValue(x.key, sA, "ALL_INDIA");
          const b = dpValue(x.key, sB, "ALL_INDIA");
          const d = pctChange(b, a);
          return (
            <div key={x.key} className="min-w-0 rounded-lg border border-line bg-surface-2/60 px-2.5 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[9px] font-semibold uppercase tracking-wide text-ink-faint">
                  {x.label} · {x.unit}
                </span>
                <DeltaText value={d} />
              </div>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="num text-[11px] text-ink-faint">{num(a, x.digits)}</span>
                <span className="text-[10px] text-ink-faint">→</span>
                <span className="num text-[15px] font-semibold tracking-tight text-ink">{num(b, x.digits)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          {m ? `State-wise ${m.label.toLowerCase()} · ${m.unit}` : "State-wise area, yield & production"}
        </span>
        <span className="print-hide">
        <Tabs
          options={[
            { value: "all" as const, label: "All" },
            ...DP_METRICS.map((x) => ({ value: x.key, label: x.label })),
          ]}
          value={metric}
          onChange={setMetric}
        />
        </span>
      </div>
      <TableWrap>
        {m == null ? (
          // every metric side by side: 2025 crop / 2026 crop / Δ for area, yield and production
          <Table>
            <thead>
              <tr>
                <Th rowSpan={2} className={cellTh}>State</Th>
                {DP_METRICS.map((x) => (
                  <Th key={x.key} colSpan={3} align="center" className={cellTh + " border-l border-line"}>
                    <span className="normal-case">{x.header}</span>
                  </Th>
                ))}
              </tr>
              <tr>
                {DP_METRICS.map((x) => (
                  <Fragment key={x.key}>
                    <Th align="right" className={cellTh + " border-l border-line"}>{sA.slice(0, 4)}</Th>
                    <Th align="right" className={cellTh}>{sB.slice(0, 4)}</Th>
                    <Th align="right" className={cellTh}>Δ</Th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((st) => (
                <tr key={st} className={rowClass(st)}>
                  <Td className={cellTd + " whitespace-nowrap"}>{stateName(st)}</Td>
                  {DP_METRICS.map((x) => {
                    const va = dpValue(x.key, sA, st);
                    const vb = dpValue(x.key, sB, st);
                    return (
                      <Fragment key={x.key}>
                        <Td align="right" mono className={cellTd + " border-l border-line/70 text-ink-soft"}>{num(va, x.digits)}</Td>
                        <Td align="right" mono className={cellTd}>{num(vb, x.digits)}</Td>
                        <Td align="right" className={cellTd}><DeltaText value={pctChange(vb, va)} /></Td>
                      </Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className={cellTh}>State</Th>
                <Th align="right" className={cellTh}>{cropLabel(sA)}</Th>
                <Th align="right" className={cellTh}>{cropLabel(sB)}</Th>
                <Th align="right" className={cellTh}>Δ</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((st) => {
                const va = dpValue(m.key, sA, st);
                const vb = dpValue(m.key, sB, st);
                return (
                  <tr key={st} className={rowClass(st)}>
                    <Td className={cellTd}>{stateName(st)}</Td>
                    <Td align="right" mono className={cellTd + " text-ink-soft"}>{num(va, m.digits)}</Td>
                    <Td align="right" mono className={cellTd}>{num(vb, m.digits)}</Td>
                    <Td align="right" className={cellTd}><DeltaText value={pctChange(vb, va)} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </TableWrap>
    </Card>
  );
}

const BS_ROWS: { key: string; label: string; bold?: boolean; indent?: boolean }[] = [
  { key: "opening_stocks", label: "Opening stocks" },
  { key: "crop_size", label: "Crop size", indent: true },
  { key: "farmer_selling", label: "Farmer selling", indent: true },
  { key: "imports", label: "Imports", indent: true },
  { key: "total_supply", label: "Total supply", bold: true },
  { key: "domestic_cons", label: "Domestic consumption", indent: true },
  { key: "exports", label: "Exports", indent: true },
  { key: "total_demand", label: "Total demand", bold: true },
  { key: "stocks_govt", label: "Stock with CCI" },
  { key: "closing_stocks", label: "Closing stocks", bold: true },
];

function BalanceSheetSection() {
  // newest first by the season's starting year
  const seasons = [...(SND.annual_seasons ?? [])].sort((x, y) => parseInt(y, 10) - parseInt(x, 10));
  const [pair, setPair] = useState(0); // 0: latest vs the one before; 1: one season back
  const [month, setMonth] = useState(currentSndMonth);
  const cur = seasons[pair];
  const prev = seasons[pair + 1];
  if (!cur || !prev) return null;

  const months = sndMonthsTo(month);
  const ytdCur = sndPeriod(cur, months);
  const ytdPrev = sndPeriod(prev, months);
  const annCur = sndAnnual(cur);
  const annPrev = sndAnnual(prev);
  const span = month === "Oct" ? "Oct" : `Oct–${month}`;
  const pairLabel = (i: number) => `${seasons[i]} vs ${seasons[i + 1]}`;
  const v = (r: SndRow, k: string) => r[k] ?? null;
  const td = "px-2 py-1 text-[11.5px] leading-5";
  const th = "px-2 py-1.5 text-[9.5px]";

  return (
    <Card>
      <CardHeader
        title={`Balance Sheet · ${cur} vs ${prev}`}
        sub={`India supply & demand · lakh bales · cumulative ${span} and full season (Oct–Sep)`}
        right={<More href="/balance-sheet" label="Full balance sheet" />}
      />
      <div className="print-hide mb-2.5 flex flex-wrap items-center gap-2">
        {seasons.length > 2 ? (
          <Tabs options={[0, 1].filter((i) => seasons[i + 1]).map((i) => ({ value: String(i), label: pairLabel(i) }))} value={String(pair)} onChange={(x) => setPair(Number(x))} />
        ) : null}
        <span className="flex-1" />
        <span className="text-[11px] text-ink-faint">Cumulative to</span>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] text-ink"
        >
          {SND_MONTHS_INDIA.map((m) => (
            <option key={m} value={m}>
              {m === "Oct" ? "Oct" : `Oct–${m}`}
            </option>
          ))}
        </select>
      </div>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th rowSpan={2} className={th}>Lakh bales</Th>
              <Th colSpan={3} align="center" className={th + " border-l border-line"}>
                <span className="normal-case">Cumulative {span}</span>
              </Th>
              <Th colSpan={3} align="center" className={th + " border-l border-line"}>
                <span className="normal-case">Annual (Oct–Sep)</span>
              </Th>
            </tr>
            <tr>
              <Th align="right" className={th + " border-l border-line"}>{cur}</Th>
              <Th align="right" className={th}>{prev}</Th>
              <Th align="right" className={th}>Δ</Th>
              <Th align="right" className={th + " border-l border-line"}>{cur}</Th>
              <Th align="right" className={th}>{prev}</Th>
              <Th align="right" className={th}>Δ</Th>
            </tr>
          </thead>
          <tbody>
            {BS_ROWS.map((r, i) => (
              <tr key={r.key} className={r.bold ? "bg-accent/10 font-semibold" : i % 2 === 1 ? "bg-surface-2/50" : undefined}>
                <Td className={td + " whitespace-nowrap" + (r.indent ? " pl-5" : "")}>{r.label}</Td>
                <Td align="right" mono className={td + " border-l border-line/70"}>{num(v(ytdCur, r.key), 1)}</Td>
                <Td align="right" mono className={td + " text-ink-soft"}>{num(v(ytdPrev, r.key), 1)}</Td>
                <Td align="right" className={td}><DeltaText value={pctChange(v(ytdCur, r.key), v(ytdPrev, r.key))} /></Td>
                <Td align="right" mono className={td + " border-l border-line/70"}>{num(v(annCur, r.key), 1)}</Td>
                <Td align="right" mono className={td + " text-ink-soft"}>{num(v(annPrev, r.key), 1)}</Td>
                <Td align="right" className={td}><DeltaText value={pctChange(v(annCur, r.key), v(annPrev, r.key))} /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
      <p className="print-hide mt-1.5 text-[10.5px] text-ink-faint">
        Cumulative: opening stock at 1 Oct, flows summed Oct to the selected month, closing stock at its end · crop is the full-season estimate
      </p>
    </Card>
  );
}

/* ---- CCI, imports & basis, WASDE, CFTC and USDA export sales (report summaries) ---- */

function CciSection() {
  const latest = Object.keys(CCI.proc_annual ?? {}).sort().at(-1);
  if (!latest) return null;
  const weeks = cciWeekly(26);
  const last = weeks.at(-1);
  const wk = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return (
    <Card className="h-full">
      <CardHeader
        title={`CCI Updates · ${latest}`}
        sub={`Cotton Corporation of India · weekly OMSS sales (lakh bales) and average sale price (₹/candy)${last ? ` · latest week of ${wk(last.week)}` : ""}`}
        right={<More href="/cci" label="CCI updates" />}
      />
      <StatStrip>
        <Stat label={`Procurement ${latest}`} value={`${num(CCI.proc_annual[latest], 1)} lb`} />
        <Stat label={`OMSS sales ${latest}`} value={`${num(CCI.sell_annual[latest], 1)} lb`} />
        <Stat label={`Closing stock ${latest}`} value={`${num(CCI.stock_annual?.[latest] ?? null, 1)} lb`} />
      </StatStrip>
      {weeks.length ? (
        <ComboChart
          labels={weeks.map((w) => wk(w.week))}
          height={240}
          xTicks={8}
          left={{ label: "Weekly sales · lakh bales", data: weeks.map((w) => w.vol), color: "#2563c9", fmt: (v) => v.toFixed(1), bars: true }}
          right={{ label: "Avg sale price · ₹/candy", data: weeks.map((w) => w.price), color: "#d97706", fmt: (v) => `₹${(v / 1000).toFixed(1)}k` }}
        />
      ) : (
        <p className="py-10 text-center text-[12px] text-ink-faint">No CCI sales reported yet.</p>
      )}
    </Card>
  );
}

function BasisSection() {
  const rows = monthlyBasis().slice(-12);
  const last = rows.at(-1);
  if (!last) return null;
  return (
    <Card className="h-full">
      <CardHeader title="Cotton Basis" sub="Guj-29 minus Cotlook A Index · US ¢/lb · monthly" right={<More href="/basis" label="Cotton basis" />} />
      <StatStrip>
        <Stat label={`Basis ${last.month}`} value={`${last.basis >= 0 ? "+" : ""}${last.basis.toFixed(2)}¢`} tone={last.basis >= 0 ? "neg" : "pos"} />
        <Stat label="Guj-29" value={`${last.gujCents.toFixed(2)}¢/lb`} />
        <Stat label="Cotlook A" value={`${last.aIndex.toFixed(2)}¢/lb`} />
      </StatStrip>
      <BarChart
        labels={rows.map((r) => r.month)}
        smartX
        height={200}
        series={[{ label: "Basis", data: rows.map((r) => Math.round(r.basis * 100) / 100), colors: rows.map((r) => (r.basis >= 0 ? "#d84a3c" : "#0f9d63")) }]}
        yFmt={(v) => `${v}¢`}
      />
      <p className="mt-1 text-[10.5px] text-ink-faint">Red: India at a premium to the A Index · green: at a discount</p>
    </Card>
  );
}

const WASDE_INDIA: { key: keyof WasdeRow; label: string }[] = [
  { key: "production", label: "Production" },
  { key: "imports", label: "Imports" },
  { key: "domesticUse", label: "Domestic use" },
  { key: "exports", label: "Exports" },
  { key: "endingStocks", label: "Ending stocks" },
];

function WasdeSection() {
  const r = WASDE_REPORTS[0];
  const prev = WASDE_REPORTS[1];
  if (!r) return null;
  const years = r.years.slice(-2);
  const proj = years.at(-1)!;
  const lb = (v: number | undefined | null) => (v == null ? null : convertWasde(v, "lakh"));
  const kmt = (v: number | undefined | null) => (v == null ? "—" : Math.round(convertWasde(v, "kmt")).toLocaleString("en-IN"));
  const prevOf = (year: string, k: keyof WasdeRow) => {
    const c = r.years.find((y) => y.year === year)?.countries.India;
    return c?.prevMonth?.[k] ?? prev?.years.find((y) => y.year === year)?.countries.India?.current[k] ?? null;
  };
  return (
    <Card>
      <CardHeader title={`WASDE · USDA ${r.title}`} sub="India cotton balance · lakh bales (170 kg) · change vs previous report" right={<More href="/wasde" label="WASDE" />} />
      <StatStrip>
        <Stat label={`World production ${proj.year}`} value={`${kmt(proj.countries.World?.current.production)} KMT`} />
        <Stat label={`World ending stocks ${proj.year}`} value={`${kmt(proj.countries.World?.current.endingStocks)} KMT`} />
        <Stat label={`India ending stocks ${proj.year}`} value={`${num(lb(proj.countries.India?.current.endingStocks), 1)} lb`} />
      </StatStrip>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>India (lakh bales)</Th>
              {years.map((y) => (
                <Fragment key={y.year}>
                  <Th align="right">{`${y.year}${y.status === "proj" ? " proj." : y.status === "est" ? " est." : ""}`}</Th>
                  <Th align="right">Δ m/m</Th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {WASDE_INDIA.map((row) => (
              <tr key={row.key} className={row.key === "production" || row.key === "endingStocks" ? "font-semibold" : ""}>
                <Td>{row.label}</Td>
                {years.map((y) => {
                  const now = lb(y.countries.India?.current[row.key]);
                  const was = lb(prevOf(y.year, row.key));
                  const d = now != null && was != null ? now - was : null;
                  return (
                    <Fragment key={y.year}>
                      <Td align="right" mono>{num(now, 1)}</Td>
                      <Td align="right" mono>
                        <span className={d == null || Math.abs(d) < 0.05 ? "text-ink-faint" : d > 0 ? "text-pos" : "text-neg"}>
                          {d == null ? "—" : Math.abs(d) < 0.05 ? "0.0" : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}`}
                        </span>
                      </Td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </Card>
  );
}

function CftcSection() {
  const weeks = COT_WEEKS.slice(-52);
  const w = weeks.at(-1);
  if (!w) return null;
  const net = cotNet(w, "mm");
  const chg = cotNetChg(w, "mm");
  const short = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
  return (
    <Card className="h-full">
      <CardHeader title="CFTC · Commitments of Traders" sub={`ICE cotton · positions as of ${short(w.date)} · contracts`} right={<More href="/cftc" label="CFTC" />} />
      <StatStrip>
        <Stat label="Managed money net" value={`${net >= 0 ? "+" : "−"}${Math.abs(net).toLocaleString("en-US")}`} tone={net >= 0 ? "pos" : "neg"} />
        <Stat label="Change on week" value={`${chg >= 0 ? "+" : "−"}${Math.abs(chg).toLocaleString("en-US")}`} tone={chg >= 0 ? "pos" : "neg"} />
        <Stat label="Open interest" value={w.oi.toLocaleString("en-US")} />
      </StatStrip>
      <ComboChart
        labels={weeks.map((x) => short(x.date))}
        height={210}
        xTicks={6}
        left={{ label: "Funds net", data: weeks.map((x) => cotNet(x, "mm")), color: "#2563c9", fmt: (v) => `${Math.round(v / 1000)}k` }}
        right={{ label: "ICE ¢/lb", data: weeks.map((x) => icePriceOn(x.date)), color: "#d97706", fmt: (v) => `${v.toFixed(0)}¢` }}
      />
    </Card>
  );
}

function ExportSalesSection() {
  const cur = ES_YEARS[0];
  const prev = ES_YEARS[1];
  const w = cur?.weeks.at(-1);
  if (!cur || !prev || !w) return null;
  const i = cur.weeks.length - 1;
  const ly = prev.weeks[i];
  const n = Math.max(cur.weeks.length, prev.weeks.length);
  const k = (v: number) => Math.round(v / 1000);
  const yoy = (a: number, b?: number) => (b ? ((a - b) / b) * 100 : null);
  return (
    <Card className="h-full">
      <CardHeader title={`USDA Export Sales · ${cur.year}`} sub={`US upland cotton · week ending ${shortDate(w.week)} · thousand running bales`} right={<More href="/usda" label="Export sales" />} />
      <StatStrip>
        <Stat label="Net sales · week" value={`${k(w.netSales).toLocaleString("en-IN")}k`} />
        <Stat label="Commitments · YoY" value={`${k(w.commitment).toLocaleString("en-IN")}k · ${signedPct(yoy(w.commitment, ly?.commitment), 1)}`} tone={toneOf(yoy(w.commitment, ly?.commitment))} />
        <Stat label="Exports so far · YoY" value={`${k(w.accExports).toLocaleString("en-IN")}k · ${signedPct(yoy(w.accExports, ly?.accExports), 1)}`} tone={toneOf(yoy(w.accExports, ly?.accExports))} />
      </StatStrip>
      <LineChart
        labels={Array.from({ length: n }, (_, j) => `Wk ${j + 1}`)}
        legend
        height={210}
        xTicks={8}
        series={[
          { label: `${cur.year} commitments`, color: "#0f9d63", data: Array.from({ length: n }, (_, j) => (cur.weeks[j] ? k(cur.weeks[j].commitment) : null)) },
          { label: `${prev.year} commitments`, color: "#94a3b8", data: Array.from({ length: n }, (_, j) => (prev.weeks[j] ? k(prev.weeks[j].commitment) : null)) },
        ]}
        yFmt={(v) => `${(v / 1000).toFixed(1)}M`}
      />
    </Card>
  );
}

/** Compact previews of each dashboard area — weather, sowing & arrivals, production, CCI, balance
 *  sheet, cotton basis, WASDE, CFTC and USDA export sales, production benchmarks — each followed by a commentary
 *  panel, so Overview (and its PDF report) gives the headline picture without opening each tab. The latest
 *  Field Pulse report, with its photographs, closes the report. */
export function OverviewSections() {
  const prodSeason = DP_SEASONS.at(-1) ?? "";
  return (
    <div className="mt-4 space-y-4">
      <ReportHeading>Weather &amp; Rainfall</ReportHeading>
      <WeatherSection />
      <CottonBeltRain />
      <CommentsPanel section="overviewWeather" title="Summary (Weather & Rainfall · India)" pdfTitle="Weather review: last week and 7-day outlook" minHeight={100} rows={4} autoWrite={() => autoCommentary("overviewWeather")} />

      <ReportHeading>Cotton Arrivals &amp; Sowing</ReportHeading>
      <div className="grid gap-4 lg:grid-cols-2">
        <ArrivalsSection />
        <SowingSection />
      </div>
      <CommentsPanel section="overviewSowing" title="Summary (Cotton Arrivals & Sowing)" minHeight={100} rows={4} autoWrite={() => autoCommentary("overviewSowing")} />

      <ReportHeading>India Cotton Production {prodSeason}</ReportHeading>
      <ProductionSection />
      <CommentsPanel section="overviewProduction" title="Summary (Domestic production)" pdfTitle={`Production outlook ${prodSeason}`} minHeight={100} rows={4} autoWrite={() => autoCommentary("overviewProduction")} />

      <ReportHeading>CCI Updates</ReportHeading>
      {/* chart on the left, the commentary box beside it (full width in the PDF when the box is empty) */}
      <div className="pdf-pair grid gap-4 lg:grid-cols-2">
        <CciSection />
        <CommentsPanel section="overviewCci" title="Summary (CCI updates)" minHeight={260} rows={10} className="h-full" autoWrite={() => autoCommentary("overviewCci")} />
      </div>

      {/* monthly report only — the weekly report is the week's market intelligence */}
      <div className="pdf-monthly-only space-y-4">
        <ReportHeading>India Balance Sheet</ReportHeading>
        <BalanceSheetSection />
        <CommentsPanel section="overviewBalance" title="Summary (Balance Sheet)" minHeight={100} rows={4} autoWrite={() => autoCommentary("overviewBalance")} />
      </div>

      <ReportHeading>Cotton Basis</ReportHeading>
      {/* basis chart on the left, the commentary box beside it */}
      <div className="pdf-pair grid gap-4 lg:grid-cols-2">
        <BasisSection />
        <CommentsPanel section="overviewTradeBasis" title="Summary (Cotton basis)" minHeight={260} rows={10} className="h-full" autoWrite={() => autoCommentary("overviewTradeBasis")} />
      </div>

      <ReportHeading>USDA WASDE</ReportHeading>
      <WasdeSection />
      <CommentsPanel section="overviewWasde" title="Summary (WASDE)" minHeight={100} rows={4} autoWrite={() => autoCommentary("overviewWasde")} />

      <ReportHeading>CFTC &amp; USDA Export Sales</ReportHeading>
      {/* one below the other, each with its commentary box beside it */}
      <div className="pdf-pair grid gap-4 lg:grid-cols-2">
        <CftcSection />
        <CommentsPanel section="overviewCftc" title="Summary (CFTC)" minHeight={260} rows={10} className="h-full" autoWrite={() => autoCommentary("overviewCftc")} />
      </div>
      <div className="pdf-pair grid gap-4 lg:grid-cols-2">
        <ExportSalesSection />
        <CommentsPanel section="overviewExportSales" title="Summary (USDA export sales)" minHeight={260} rows={10} className="h-full" autoWrite={() => autoCommentary("overviewExportSales")} />
      </div>

      <div className="pdf-monthly-only space-y-4">
        <ReportHeading>Production Benchmarks</ReportHeading>
        <BenchmarksSection />
        <CommentsPanel section="overviewBenchmarks" title="Summary (Production benchmarks)" minHeight={100} rows={4} autoWrite={() => autoCommentary("overviewBenchmarks")} />
      </div>

      <ReportHeading>Field Pulse · From the Fields</ReportHeading>
      <FieldPulseSection />
    </div>
  );
}
