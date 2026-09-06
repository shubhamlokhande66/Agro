"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { DataMissing } from "@/components/ui/DataGuard";
import LineChart from "@/components/charts/LineChart";
import { SOWING_SERIES, SOWING_WEEKS } from "@/data/sowing";
import { num, pctChange, signedPct } from "@/lib/format";

const PALETTE = ["#ef4444", "#2563eb", "#0d9e77", "#f59e0b", "#8b6cf0", "#0ea5e9", "#64748b", "#94a3b8", "#cbd5e1"];
const lastNum = (a: number[] | undefined) => {
  const v = (a ?? []).filter((x) => x != null && !Number.isNaN(x));
  return v.at(-1) ?? null;
};

export default function SowingPage() {
  const series = SOWING_SERIES ?? [];
  if (!series.length) return <DataMissing title="Cotton Sowing" icon="❊" dataset="sowing" />;

  const normalSeries = series.find((s) => /normal/i.test(s.label));
  const yearSeries = series
    .filter((s) => /^\d{4}$/.test(s.label))
    .sort((a, b) => Number(b.label) - Number(a.label));
  const curS = yearSeries[0];
  const prevS = yearSeries[1];

  const cur = lastNum(curS?.data);
  const prev = lastNum(prevS?.data);
  const normal = lastNum(normalSeries?.data);

  return (
    <div>
      <PageHeader
        title="Cotton Sowing"
        icon="❊"
        sub="Area sown · lakh ha · weekly Jun → Sep"
      />

      <KpiRow>
        <Kpi label={`${curS?.label ?? "Current"} latest`} value={num(cur, 2)} unit="lakh ha" />
        <Kpi label={`${prevS?.label ?? "Prev"} latest`} value={num(prev, 2)} unit="lakh ha" accent="blue" />
        <Kpi
          label={`${curS?.label ?? "Cur"} vs ${prevS?.label ?? "prev"}`}
          value={signedPct(pctChange(cur, prev), 1)}
          accent={(pctChange(cur, prev) ?? 0) < 0 ? "red" : "green"}
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
            series={series.map((s) => ({
              label: s.label,
              data: s.data ?? [],
              color:
                s === normalSeries
                  ? "#94a3b8"
                  : s === curS
                    ? "#ef4444"
                    : PALETTE[(yearSeries.indexOf(s) % PALETTE.length) + 1] ?? "#64748b",
              width: s === curS ? 2.5 : s === normalSeries ? 1 : 1.5,
              dashed: s === normalSeries,
            }))}
            height={320}
            smartX={false}
            xTicks={9}
            tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y} lakh ha`}
          />
        </Card>
      </div>
    </div>
  );
}
