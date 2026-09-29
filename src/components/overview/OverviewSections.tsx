"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Delta } from "@/components/ui/ChangeBadge";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import { CommentsPanel } from "@/components/ui/CommentsPanel";
import LineChart, { type LineSeries } from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { RF_ALL_YEARS, RF_COMPOSITE_T, RF_JJAS, RF_MONTHS_L, jjas, pctDeviation } from "@/data/rainfall";
import { ARRIVALS, ARRIVAL_SEASONS, ARRIVAL_WEEKS } from "@/data/arrivals";
import { SOWING_SERIES, SOWING_WEEKS } from "@/data/sowing";
import { DP_DATA, DP_REGIONS, DP_SEASONS, DP_STATE_LABELS, dpValue, type DpMetric } from "@/data/production";
import { SND } from "@/data/balanceSheet";
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
    <Link href={href} className="text-[11px] font-semibold text-accent hover:underline">
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
          height={220}
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
          height={272}
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
    ...(prevKey ? [{ label: prevKey, data: ARRIVALS[prevKey] ?? [], color: "#2563eb", width: 2 }] : []),
    { label: latestKey, data: ARRIVALS[latestKey] ?? [], color: "#ef4444", width: 2.5, dashed: true },
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
          ...(normalS ? [{ label: normalS.label, data: normalS.data ?? [], color: "#94a3b8", width: 1.75, dashed: true }] : []),
          ...(prevS ? [{ label: prevS.label, data: prevS.data ?? [], color: "#2563eb", width: 2 }] : []),
          { label: curS.label, data: curS.data ?? [], color: "#ef4444", width: 3 },
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
        title="Domestic Cotton Production"
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
        <Tabs
          options={[
            { value: "all" as const, label: "All" },
            ...DP_METRICS.map((x) => ({ value: x.key, label: x.label })),
          ]}
          value={metric}
          onChange={setMetric}
        />
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

const BS_ROWS: { key: string; label: string; bold?: boolean }[] = [
  { key: "opening_stocks", label: "Opening stocks" },
  { key: "crop_size", label: "Crop size" },
  { key: "imports", label: "Imports" },
  { key: "total_supply", label: "Total supply", bold: true },
  { key: "domestic_cons", label: "Domestic consumption" },
  { key: "exports", label: "Exports" },
  { key: "total_demand", label: "Total demand", bold: true },
  { key: "closing_stocks", label: "Closing stocks", bold: true },
];

function BalanceSheetSection() {
  // newest first by the season's starting year ("2026/27" > "2025/26 (F)"), whatever order admin stored them in
  const seasons = [...(SND.annual_seasons ?? [])].sort((x, y) => parseInt(y, 10) - parseInt(x, 10));
  const latest = seasons[0];
  const prev = seasons[1];
  const a = latest ? SND.annual?.[latest] : undefined;
  if (!a) return null;
  const p = (prev ? SND.annual?.[prev] : undefined) ?? a;
  const get = (o: typeof a, k: string) => (o as unknown as Record<string, number | null>)[k] ?? null;

  return (
    <Card>
      <CardHeader
        title={`Balance Sheet · ${latest}`}
        sub={`India supply & demand · lakh bales · ${latest} vs ${prev}`}
        right={<More href="/balance-sheet" label="Full balance sheet" />}
      />
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Item (lakh bales)</Th>
              <Th align="right">{prev}</Th>
              <Th align="right">{latest}</Th>
              <Th align="right">YoY</Th>
            </tr>
          </thead>
          <tbody>
            {BS_ROWS.map((r) => (
              <tr key={r.key} className={r.bold ? "font-semibold" : ""}>
                <Td>{r.label}</Td>
                <Td align="right" mono>{num(get(p, r.key), 1)}</Td>
                <Td align="right" mono>{num(get(a, r.key), 1)}</Td>
                <Td align="right"><Delta value={pctChange(get(a, r.key), get(p, r.key))} /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </Card>
  );
}

/** Compact previews of the Weather, Arrivals, Sowing, Production and Balance Sheet tabs so
 *  clients landing on Overview see the headline picture without opening each tab. */
export function OverviewSections() {
  return (
    <div className="mt-4 space-y-4">
      <WeatherSection />
      <CommentsPanel section="overviewWeather" title="Summary (Weather & Rainfall · India)" minHeight={100} rows={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SowingSection />
        <ArrivalsSection />
      </div>
      <CommentsPanel section="overviewSowing" title="Summary (Cotton Sowing & Arrivals)" minHeight={100} rows={4} />
      <ProductionSection />
      <CommentsPanel section="overviewProduction" title="Summary (Domestic production)" minHeight={100} rows={4} />
      <BalanceSheetSection />
      <CommentsPanel section="overviewBalance" title="Summary (Balance Sheet)" minHeight={100} rows={4} />
    </div>
  );
}
