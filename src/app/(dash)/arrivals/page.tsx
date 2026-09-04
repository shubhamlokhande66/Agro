"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Tabs } from "@/components/ui/Tabs";
import LineChart, { type LineSeries } from "@/components/charts/LineChart";
import {
  ARRIVALS,
  ARRIVAL_SEASONS,
  ARRIVAL_WEEKS,
} from "@/data/arrivals";
import { num, pctChange, signedPct } from "@/lib/format";

const PALETTE = ["#cbd5e1", "#94a3b8", "#64748b", "#0ea5e9", "#2563eb", "#f59e0b", "#0d9e77"];

export default function ArrivalsPage() {
  const [mode, setMode] = useState<"all" | "compare">("all");

  const series = useMemo<LineSeries[]>(() => {
    if (mode === "compare") {
      return [
        { label: "24-25", data: ARRIVALS["24-25"], color: "#2563eb", width: 2 },
        { label: "25-26", data: ARRIVALS["25-26"], color: "#ef4444", width: 2.5, dashed: true },
      ];
    }
    return ARRIVAL_SEASONS.map((s, i) => ({
      label: s,
      data: ARRIVALS[s],
      color: PALETTE[i % PALETTE.length],
      width: s === "25-26" ? 2.5 : s === "24-25" ? 2 : 1.5,
      dashed: s === "25-26",
    }));
  }, [mode]);

  const cur = ARRIVALS["25-26"].filter((v) => v != null);
  const prev = ARRIVALS["24-25"];
  const curLatest = cur.at(-1) ?? null;
  const prevAtSame = prev[cur.length - 1] ?? prev.at(-1) ?? null;
  const yoy = pctChange(curLatest, prevAtSame);
  const prevFull = prev.at(-1) ?? null;

  return (
    <div>
      <PageHeader
        title="Cotton Arrivals"
        sub="Cumulative market arrivals · lakh bales · weekly Oct → Feb"
      />

      <KpiRow>
        <Kpi label="2025-26 to date" value={num(curLatest, 1)} unit="lakh bales" />
        <Kpi
          label="Same week 2024-25"
          value={num(prevAtSame, 1)}
          unit="lakh bales"
          accent="blue"
        />
        <Kpi
          label="YoY at this point"
          value={signedPct(yoy, 1)}
          accent={yoy != null && yoy < 0 ? "red" : "green"}
        />
        <Kpi
          label="2024-25 full season"
          value={num(prevFull, 1)}
          unit="lakh bales"
          accent="amber"
        />
      </KpiRow>

      <div className="mt-5">
        <Card>
          <CardHeader
            title="Cumulative arrivals (lakh bales)"
            right={
              <Tabs
                options={[
                  { value: "all", label: "All seasons" },
                  { value: "compare", label: "vs last yr" },
                ]}
                value={mode}
                onChange={setMode}
              />
            }
          />
          <LineChart
            labels={ARRIVAL_WEEKS}
            series={series}
            height={280}
            smartX={false}
            xTicks={8}
            tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y} lakh bales`}
          />
        </Card>
      </div>
    </div>
  );
}
