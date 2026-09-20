"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Delta } from "@/components/ui/ChangeBadge";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import LineChart, { type LineSeries } from "@/components/charts/LineChart";
import { RF_ALL_YEARS, RF_COMPOSITE_T, RF_MONTHS_L, jjas } from "@/data/rainfall";
import { ARRIVALS, ARRIVAL_SEASONS, ARRIVAL_WEEKS } from "@/data/arrivals";
import { SOWING_SERIES, SOWING_WEEKS } from "@/data/sowing";
import { DP_DATA, DP_REGIONS, DP_SEASONS, DP_STATE_LABELS, dpValue } from "@/data/production";
import { SND } from "@/data/balanceSheet";
import { num, pctChange, signedPct } from "@/lib/format";

const lastNum = (a: (number | null)[] | undefined) =>
  (a ?? []).filter((x): x is number => x != null && !Number.isNaN(x)).at(-1) ?? null;

function More({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-[11px] font-semibold text-accent hover:underline">
      {label} →
    </Link>
  );
}

function WeatherSection() {
  const seasonComplete = (y: string) => (RF_COMPOSITE_T["y" + y] ?? []).every((v) => v != null);
  const year = [...RF_ALL_YEARS].reverse().find(seasonComplete) ?? RF_ALL_YEARS.at(-1) ?? "";
  const cur = RF_COMPOSITE_T["y" + year] as number[] | undefined;
  const normal = (RF_COMPOSITE_T.normal ?? []) as number[];
  const jj = jjas(cur);
  const jjNormal = jjas(normal);
  const dev = pctChange(jj, jjNormal);

  return (
    <Card>
      <CardHeader
        title="Weather & Rainfall · India"
        sub={`Composite of cotton states · monthly rainfall ${year} vs LPA normal (mm)`}
        right={<More href="/weather" label="Full weather & rainfall" />}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <LineChart
          labels={RF_MONTHS_L}
          series={[
            { label: `${year}`, data: cur ?? [], color: "#2d7d46", width: 2.5, fill: true, fillColor: "rgba(45,125,70,0.1)" },
            { label: "Normal (LPA)", data: normal, color: "#c97b1e", width: 1.5, dashed: true },
          ]}
          yFmt={(v) => Math.round(v) + "mm"}
          tooltipLabel={(c) => `${c.dataset.label}: ${Math.round(c.parsed.y)} mm`}
          smartX={false}
          height={240}
        />
        <div className="grid grid-cols-2 content-start gap-2 lg:grid-cols-1">
          <Kpi label={`JJAS ${year}`} value={jj != null ? Math.round(jj) : "—"} unit="mm · Jun–Sep" />
          <Kpi
            label="vs LPA normal"
            value={signedPct(dev, 0)}
            accent={dev != null && dev < 0 ? "red" : "green"}
          />
        </div>
      </div>
    </Card>
  );
}

function ArrivalsSection() {
  const seasons = ARRIVAL_SEASONS ?? [];
  const latestKey = seasons.at(-1);
  const prevKey = seasons.at(-2);
  if (!latestKey) return null;
  const cur = (ARRIVALS[latestKey] ?? []).filter((v) => v != null && !Number.isNaN(v));
  const prev = prevKey ? ARRIVALS[prevKey] ?? [] : [];
  const curLatest = cur.at(-1) ?? null;
  const prevAtSame = prev[cur.length - 1] ?? lastNum(prev);
  const yoy = pctChange(curLatest, prevAtSame);
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
      <div className="mb-3 flex flex-wrap items-end gap-x-4 gap-y-1">
        <span className="num text-2xl font-semibold tracking-tight text-ink">{num(curLatest, 1)}</span>
        <span className="num pb-0.5 text-[11px] text-ink-faint">lakh bales · {latestKey}</span>
        <span className="pb-0.5">
          <Delta value={yoy} />
          <span className="num ml-1 text-[11px] text-ink-faint">vs same week {prevKey}</span>
        </span>
      </div>
      <LineChart
        labels={ARRIVAL_WEEKS}
        series={series}
        height={200}
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
  const cur = lastNum(curS?.data);
  const prev = lastNum(prevS?.data);
  const normal = lastNum(normalS?.data);
  if (!curS) return null;

  return (
    <Card>
      <CardHeader
        title={`Cotton Sowing · ${curS.label}`}
        sub="Area sown · lakh ha · weekly"
        right={<More href="/sowing" label="Details" />}
      />
      <div className="mb-3 flex flex-wrap items-end gap-x-4 gap-y-1">
        <span className="num text-2xl font-semibold tracking-tight text-ink">{num(cur, 2)}</span>
        <span className="num pb-0.5 text-[11px] text-ink-faint">lakh ha</span>
        <span className="num pb-0.5 text-[11px] text-ink-faint">
          <Delta value={pctChange(cur, prev)} /> vs {prevS?.label ?? "prev"} ·{" "}
          <Delta value={pctChange(cur, normal)} /> vs normal
        </span>
      </div>
      <LineChart
        labels={SOWING_WEEKS}
        series={[
          ...(normalS ? [{ label: normalS.label, data: normalS.data ?? [], color: "#94a3b8", width: 1, dashed: true }] : []),
          ...(prevS ? [{ label: prevS.label, data: prevS.data ?? [], color: "#2563eb", width: 1.5 }] : []),
          { label: curS.label, data: curS.data ?? [], color: "#ef4444", width: 2.5 },
        ]}
        height={200}
        smartX={false}
        xTicks={6}
        tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y} lakh ha`}
      />
    </Card>
  );
}

const PROD_ORDER = [...DP_REGIONS.NORTH, ...DP_REGIONS.WEST, ...DP_REGIONS.SOUTH, ...DP_REGIONS.OTHER];

function ProductionSection() {
  const sB = DP_SEASONS.at(-1);
  const sA = DP_SEASONS.at(-2);
  if (!sA || !sB) return null;
  const totA = dpValue("prod", sA, "ALL_INDIA");
  const totB = dpValue("prod", sB, "ALL_INDIA");
  const yoy = pctChange(totB, totA);
  const areaA = dpValue("area", sA, "ALL_INDIA");
  const areaB = dpValue("area", sB, "ALL_INDIA");

  return (
    <Card>
      <CardHeader
        title="Domestic Cotton Production"
        sub="Production · lakh bales · state details"
        right={<More href="/production" label="Full production" />}
      />
      <KpiRow>
        <Kpi label={`Production · ${sA}`} value={num(totA, 1)} unit="lakh bales" accent="blue"
          foot={<span className="num text-[11px] text-ink-faint">Area {num(areaA, 0)} th. ha</span>} />
        <Kpi label={`Production · ${sB}`} value={num(totB, 1)} unit="lakh bales"
          foot={<span className="num text-[11px] text-ink-faint">Area {num(areaB, 0)} th. ha</span>} />
        <Kpi label="YoY change" value={<Delta value={yoy} />} accent={yoy != null && yoy < 0 ? "red" : "green"} />
      </KpiRow>
      <div className="mt-4">
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>State</Th>
                <Th align="right">{sA.split(" ")[0]}</Th>
                <Th align="right">{sB.split(" ")[0]}</Th>
                <Th align="right">Δ</Th>
              </tr>
            </thead>
            <tbody>
              {PROD_ORDER.map((st) => {
                const a = dpValue("prod", sA, st);
                const b = dpValue("prod", sB, st);
                return (
                  <tr key={st}>
                    <Td>{DP_STATE_LABELS[st]}</Td>
                    <Td align="right" mono>{num(a, 1)}</Td>
                    <Td align="right" mono>{num(b, 1)}</Td>
                    <Td align="right"><Delta value={pctChange(b, a)} /></Td>
                  </tr>
                );
              })}
              <tr className="font-semibold">
                <Td>All India</Td>
                <Td align="right" mono>{num(totA, 1)}</Td>
                <Td align="right" mono>{num(totB, 1)}</Td>
                <Td align="right"><Delta value={yoy} /></Td>
              </tr>
            </tbody>
          </Table>
        </TableWrap>
      </div>
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
  const seasons = SND.annual_seasons ?? [];
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
      <div className="grid gap-4 lg:grid-cols-2">
        <ArrivalsSection />
        <SowingSection />
      </div>
      <ProductionSection />
      <BalanceSheetSection />
    </div>
  );
}
