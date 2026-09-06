"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Tabs } from "@/components/ui/Tabs";
import { DataMissing } from "@/components/ui/DataGuard";
import LineChart, { type LineSeries } from "@/components/charts/LineChart";
import { ARRIVALS, ARRIVAL_SEASONS, ARRIVAL_WEEKS } from "@/data/arrivals";
import { num, pctChange, signedPct } from "@/lib/format";

const PALETTE = ["#cbd5e1", "#94a3b8", "#64748b", "#0ea5e9", "#2563eb", "#f59e0b", "#0d9e77", "#8b6cf0"];

export default function ArrivalsPage() {
  const [mode, setMode] = useState<"all" | "compare">("all");
  const seasons = ARRIVAL_SEASONS ?? [];

  const latestKey = seasons.at(-1);
  const prevKey = seasons.at(-2);

  const series = useMemo<LineSeries[]>(() => {
    const list = mode === "compare" ? seasons.slice(-2) : seasons;
    return list.map((s, i) => ({
      label: s,
      data: ARRIVALS[s] ?? [],
      color:
        mode === "compare"
          ? i === 0
            ? "#2563eb"
            : "#ef4444"
          : PALETTE[i % PALETTE.length],
      width: s === latestKey ? 2.5 : s === prevKey ? 2 : 1.5,
      dashed: s === latestKey,
    }));
  }, [mode, seasons, latestKey, prevKey]);

  if (!seasons.length) {
    return <DataMissing title="Cotton Arrivals" icon="▨" dataset="arrivals" />;
  }

  const cur = (ARRIVALS[latestKey!] ?? []).filter((v) => v != null && !Number.isNaN(v));
  const prev = ARRIVALS[prevKey!] ?? [];
  const curLatest = cur.at(-1) ?? null;
  const prevAtSame = prev[cur.length - 1] ?? prev.filter((v) => v != null).at(-1) ?? null;
  const yoy = pctChange(curLatest, prevAtSame);
  const prevFull = prev.filter((v) => v != null && !Number.isNaN(v)).at(-1) ?? null;

  return (
    <div>
      <PageHeader
        title="Cotton Arrivals"
        icon="▨"
        sub="Cumulative market arrivals · lakh bales · weekly"
      />

      <KpiRow>
        <Kpi label={`${latestKey} to date`} value={num(curLatest, 1)} unit="lakh bales" />
        <Kpi
          label={`Same week ${prevKey}`}
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
          label={`${prevKey} full season`}
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
                  { value: "compare", label: "Latest 2" },
                ]}
                value={mode}
                onChange={setMode}
              />
            }
          />
          <LineChart
            labels={ARRIVAL_WEEKS}
            series={series}
            height={300}
            smartX={false}
            xTicks={9}
            tooltipLabel={(c) => `${c.dataset.label}: ${c.parsed.y} lakh bales`}
          />
        </Card>
      </div>
    </div>
  );
}
