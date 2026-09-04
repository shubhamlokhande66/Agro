"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import LineChart from "@/components/charts/LineChart";
import { SOWING_SERIES, SOWING_WEEKS } from "@/data/sowing";
import { num, pctChange, signedPct } from "@/lib/format";

const COLORS = ["#ef4444", "#2563eb", "#0d9e77", "#94a3b8"];

export default function SowingPage() {
  const cur = SOWING_SERIES[0].data.at(-1) ?? null;
  const prev = SOWING_SERIES[1].data.at(-1) ?? null;
  const normal = SOWING_SERIES[3].data.at(-1) ?? null;

  return (
    <div>
      <PageHeader
        title="Cotton Sowing"
        sub="Area sown · lakh ha · weekly Jun → Oct"
      />

      <KpiRow>
        <Kpi label="2025 final" value={num(cur, 1)} unit="lakh ha" />
        <Kpi label="2024 final" value={num(prev, 1)} unit="lakh ha" accent="blue" />
        <Kpi
          label="2025 vs 2024"
          value={signedPct(pctChange(cur, prev), 1)}
          accent={pctChange(cur, prev)! < 0 ? "red" : "green"}
        />
        <Kpi
          label="vs Normal"
          value={signedPct(pctChange(cur, normal), 1)}
          accent="amber"
        />
      </KpiRow>

      <div className="mt-5">
        <Card>
          <CardHeader title="Sowing progress (lakh ha) — weekly" />
          <LineChart
            labels={SOWING_WEEKS}
            series={SOWING_SERIES.map((s, i) => ({
              label: s.label,
              data: s.data,
              color: COLORS[i],
              width: i === 0 ? 2.5 : i === 3 ? 1 : 1.5,
              dashed: i === 3,
            }))}
            height={300}
            smartX={false}
            xTicks={8}
            tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y} lakh ha`}
          />
        </Card>
      </div>
    </div>
  );
}
