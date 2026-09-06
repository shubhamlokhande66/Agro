"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import { Delta } from "@/components/ui/ChangeBadge";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import { IE, toKmt } from "@/data/trade";
import { num, pctChange } from "@/lib/format";

type Flow = "import" | "export";
type Unit = "lb" | "kmt";

function ytdTotal(flow: Flow, season: string, throughMonth: string): number | null {
  const block = IE[flow][season];
  if (!block) return null;
  const months = IE.months;
  const end = months.indexOf(throughMonth);
  let sum = 0;
  let any = false;
  for (let i = 0; i <= end; i++) {
    const v = block[months[i]];
    if (typeof v === "number") {
      sum += v;
      any = true;
    }
  }
  return any ? sum : null;
}

const conv = (v: number | null, u: Unit) => (u === "kmt" ? toKmt(v) : v);
const unitLabel = (u: Unit) => (u === "kmt" ? "KMT" : "Lakh Bales");

export default function TradePage() {
  const [tab, setTab] = useState<"import" | "export" | "overview">("import");
  const [unit, setUnit] = useState<Unit>("lb");
  const seasons = IE.seasons;
  const MONTH_ORDER = IE.months;
  const [season, setSeason] = useState(IE.actual_cutoff.season);
  const [through, setThrough] = useState(IE.actual_cutoff.month);

  const latest = IE.actual_cutoff.season;
  const prev = seasons[seasons.indexOf(latest) - 1];
  const impNow = IE.import_totals[latest];
  const expNow = IE.export_totals[latest];
  const impPrev = IE.import_totals[prev];
  const expPrev = IE.export_totals[prev];

  const flow: Flow = tab === "export" ? "export" : "import";

  const seasonTotals = useMemo(
    () =>
      seasons.map((s) => ({
        s,
        imp: conv(IE.import_totals[s] ?? null, unit),
        exp: conv(IE.export_totals[s] ?? null, unit),
      })),
    [seasons, unit],
  );

  const monthlySeries = useMemo(
    () => MONTH_ORDER.map((mn) => conv(IE[flow][season]?.[mn] ?? null, unit)),
    [MONTH_ORDER, flow, season, unit],
  );

  return (
    <div>
      <PageHeader
        title="Imports & Exports" icon="⇄"
        sub="Monthly 2007-08 → 2026-27 · cotton year Oct–Sep · actuals to Jan 2026"
      />

      <KpiRow>
        <Kpi label={`Imports · ${latest}`} value={num(impNow, 1)} unit="lakh bales" accent="blue"
          foot={<Delta value={pctChange(impNow, impPrev)} />} />
        <Kpi label={`Exports · ${latest}`} value={num(expNow, 1)} unit="lakh bales" accent="amber"
          foot={<Delta value={pctChange(expNow, expPrev)} />} />
        <Kpi label="Net trade" value={num(expNow - impNow, 1)} unit="lakh bales (exp − imp)"
          accent={expNow - impNow >= 0 ? "green" : "red"} />
        <Kpi label="Imports 5-yr avg"
          value={num(
            seasons.slice(-6, -1).reduce((a, s) => a + (IE.import_totals[s] ?? 0), 0) / 5, 1,
          )}
          unit="lakh bales" accent="violet" />
      </KpiRow>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Tabs
          size="md"
          options={[
            { value: "import", label: "📥 Imports" },
            { value: "export", label: "📤 Exports" },
            { value: "overview", label: "📊 Overview" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <Tabs
          options={[
            { value: "lb", label: "Lakh Bales" },
            { value: "kmt", label: "KMT" },
          ]}
          value={unit}
          onChange={setUnit}
        />
      </div>

      {tab === "overview" ? (
        <div className="mt-4">
          <Card>
            <CardHeader title={`Imports vs Exports by season (${unitLabel(unit)})`} />
            <BarChart
              labels={seasons}
              series={[
                { label: "Imports", data: seasonTotals.map((r) => r.imp), color: "#2563eb" },
                { label: "Exports", data: seasonTotals.map((r) => r.exp), color: "#f59e0b" },
              ]}
              legend
              height={300}
              tooltipLabel={(c) => `${c.dataset.label}: ${num(c.parsed.y, 1)} ${unitLabel(unit)}`}
            />
          </Card>
          <Card className="mt-3.5">
            <CardHeader title={`Net trade — exports minus imports (${unitLabel(unit)})`} />
            <LineChart
              labels={seasons}
              series={[
                {
                  label: "Net",
                  data: seasons.map((s) =>
                    conv((IE.export_totals[s] ?? 0) - (IE.import_totals[s] ?? 0), unit),
                  ),
                  color: "#0d9e77",
                  width: 2,
                  fill: true,
                  fillColor: "rgba(13,158,119,0.12)",
                },
              ]}
              legend={false}
              smartX={false}
              height={240}
            />
          </Card>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <Card>
            <CardHeader
              title={`${tab === "import" ? "Imports" : "Exports"} — season totals (${unitLabel(unit)})`}
            />
            <BarChart
              labels={seasons}
              series={[
                {
                  data: seasonTotals.map((r) => (tab === "import" ? r.imp : r.exp)),
                  colors: seasons.map((s) =>
                    s === latest || s > latest
                      ? tab === "import"
                        ? "#2563eb"
                        : "#f59e0b"
                      : "rgba(100,116,139,0.35)",
                  ),
                },
              ]}
              height={300}
              tooltipLabel={(c) => `${num(c.parsed.y, 1)} ${unitLabel(unit)}`}
            />
          </Card>

          <Card>
            <CardHeader
              title={`Monthly profile — ${season}`}
              right={
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px]"
                >
                  {seasons.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              }
            />
            <LineChart
              labels={MONTH_ORDER}
              series={[
                {
                  label: season,
                  data: monthlySeries,
                  color: tab === "import" ? "#2563eb" : "#f59e0b",
                  width: 2,
                  fill: true,
                  fillColor:
                    tab === "import" ? "rgba(37,99,235,0.1)" : "rgba(245,158,11,0.1)",
                },
              ]}
              legend={false}
              smartX={false}
              height={260}
            />
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title={`${tab === "import" ? "Import" : "Export"} — YTD through ${through} by season`}
              right={
                <select
                  value={through}
                  onChange={(e) => setThrough(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px]"
                >
                  {MONTH_ORDER.map((mn) => (
                    <option key={mn}>{mn}</option>
                  ))}
                </select>
              }
            />
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Season</Th>
                    <Th align="right">YTD → {through} ({unitLabel(unit)})</Th>
                    <Th align="right">Full season</Th>
                    <Th align="right">YoY (YTD)</Th>
                  </tr>
                </thead>
                <tbody>
                  {seasons
                    .slice()
                    .reverse()
                    .map((s, i, arr) => {
                      const ytd = conv(ytdTotal(flow, s, through), unit);
                      const prevYtd = conv(ytdTotal(flow, arr[i + 1], through), unit);
                      const full = conv(
                        (flow === "import" ? IE.import_totals : IE.export_totals)[s] ?? null,
                        unit,
                      );
                      return (
                        <tr key={s}>
                          <Td>{s}</Td>
                          <Td align="right" mono>{num(ytd, 1)}</Td>
                          <Td align="right" mono>{num(full, 1)}</Td>
                          <Td align="right"><Delta value={pctChange(ytd, prevYtd)} /></Td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </div>
      )}
    </div>
  );
}
