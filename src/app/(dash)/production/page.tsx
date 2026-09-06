"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import { Delta } from "@/components/ui/ChangeBadge";
import BarChart from "@/components/charts/BarChart";
import {
  DP_DATA,
  DP_REGIONS,
  DP_REGION_OF,
  DP_REGION_TINT,
  DP_SEASONS,
  DP_STATE_LABELS,
  dpValue,
  type DpMetric,
} from "@/data/production";
import { DataMissing } from "@/components/ui/DataGuard";
import { num, pctChange } from "@/lib/format";

const METRICS: { value: DpMetric; label: string; unit: string; digits: number }[] = [
  { value: "area", label: "Area", unit: "Th. Ha", digits: 0 },
  { value: "yield", label: "Yield", unit: "Kg / Ha", digits: 0 },
  { value: "prod", label: "Production", unit: "Lakh Bales", digits: 1 },
];

const ORDER = [...DP_REGIONS.NORTH, ...DP_REGIONS.WEST, ...DP_REGIONS.SOUTH, ...DP_REGIONS.OTHER];

export default function ProductionPage() {
  const seasons = DP_SEASONS ?? [];
  const [metric, setMetric] = useState<DpMetric>("prod");
  const [sB, setSB] = useState(seasons.at(-1) ?? "");
  const [sA, setSA] = useState(seasons.at(-2) ?? "");

  const m = METRICS.find((x) => x.value === metric)!;

  const rows = useMemo(
    () =>
      ORDER.map((st) => {
        const a = dpValue(metric, sA, st);
        const b = dpValue(metric, sB, st);
        return { st, region: DP_REGION_OF[st], a, b, d: pctChange(b, a) };
      }),
    [metric, sA, sB],
  );

  if (!seasons.length) {
    return <DataMissing title="Domestic Cotton Production" icon="▤" dataset="production" />;
  }

  const totA = dpValue(metric, sA, "ALL_INDIA");
  const totB = dpValue(metric, sB, "ALL_INDIA");

  const chartStates = ORDER.filter((s) => s !== "OTHERS").slice(0, 9);

  return (
    <div>
      <PageHeader
        title="Domestic Cotton Production" icon="▤"
        sub="Area · Yield · Production · state-wise · Source: GOI / CAB / state govts"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs
          size="md"
          options={METRICS.map((x) => ({ value: x.value, label: x.label }))}
          value={metric}
          onChange={setMetric}
        />
        <div className="flex items-center gap-2 text-[12px]">
          <SeasonSelect value={sA} onChange={setSA} />
          <span className="text-ink-faint">vs</span>
          <SeasonSelect value={sB} onChange={setSB} />
        </div>
      </div>

      <KpiRow>
        <Kpi label={`All-India · ${sA}`} value={num(totA, m.digits)} unit={m.unit} accent="blue" />
        <Kpi label={`All-India · ${sB}`} value={num(totB, m.digits)} unit={m.unit} />
        <Kpi
          label="YoY change"
          value={<Delta value={pctChange(totB, totA)} />}
          accent={pctChange(totB, totA)! < 0 ? "red" : "green"}
        />
        <Kpi
          label="Metric"
          value={m.label}
          unit={m.unit}
          accent="amber"
        />
      </KpiRow>

      <div className="mt-5 grid grid-cols-1 gap-3.5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title={`${m.label} by state (${m.unit})`} />
          <BarChart
            labels={chartStates.map((s) => DP_STATE_LABELS[s])}
            series={[
              { label: sA, data: chartStates.map((s) => dpValue(metric, sA, s)), color: "#2563eb" },
              { label: sB, data: chartStates.map((s) => dpValue(metric, sB, s)), color: "#0d9e77" },
            ]}
            horizontal
            legend
            height={320}
            tooltipLabel={(c) => `${c.dataset.label}: ${num(c.parsed.x, m.digits)} ${m.unit}`}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="State detail" sub={`${sA} → ${sB}`} />
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
                {rows.map((r) => (
                  <tr key={r.st}>
                    <Td>
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                        style={{ background: DP_REGION_TINT[r.region] }}
                      />
                      {DP_STATE_LABELS[r.st]}
                    </Td>
                    <Td align="right" mono>{num(r.a, m.digits)}</Td>
                    <Td align="right" mono>{num(r.b, m.digits)}</Td>
                    <Td align="right"><Delta value={r.d} /></Td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <Td>All India</Td>
                  <Td align="right" mono>{num(totA, m.digits)}</Td>
                  <Td align="right" mono>{num(totB, m.digits)}</Td>
                  <Td align="right"><Delta value={pctChange(totB, totA)} /></Td>
                </tr>
              </tbody>
            </Table>
          </TableWrap>
        </Card>
      </div>

      <p className="mt-3 text-[11px] italic text-ink-faint">
        ★ 2025/26 Estimated (provisional) · † 2026/27 Expected (forecast). 1 Bale = 170 kg.
      </p>
    </div>
  );
}

function SeasonSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] outline-none focus:border-accent"
    >
      {DP_SEASONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
