"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { Figure, SampleBanner, fmt, pct } from "@/components/sugar/ui";
import { CANE_AREA, CANE_FRP, CANE_SAP_UP, CANE_YEARS } from "@/data/sugar/sample";

export default function SugarCane() {
  const n = CANE_YEARS.length;
  return (
    <div>
      <PageHeader title="Cane Area & FRP" icon="❊" sub="Sugarcane area and the cane price mills must pay" />
      <SampleBanner source="Ministry of Agriculture area estimates, CACP / cabinet FRP, state advised prices (SAP)" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label={`Cane area ${CANE_YEARS[n - 1]}`} value={fmt(CANE_AREA[n - 1], 1)} unit="lakh ha" note={`${(pct(CANE_AREA[n - 1], CANE_AREA[n - 2]) ?? 0).toFixed(1)}% vs last year`} />
        <Figure label={`FRP ${CANE_YEARS[n - 1]}`} value={`₹${CANE_FRP[n - 1]}`} unit="/ quintal" note="at 10.25% recovery" />
        <Figure label="UP state advised price" value={`₹${CANE_SAP_UP[n - 1]}`} unit="/ quintal" note="early variety" />
        <Figure label="FRP rise vs last year" value={`₹${CANE_FRP[n - 1] - CANE_FRP[n - 2]}`} unit="/ quintal" />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Sugarcane area" sub="Lakh hectares" />
          <BarChart labels={CANE_YEARS} height={260} series={[{ label: "Area", data: CANE_AREA, color: "#16a34a", valueLabel: (v) => v.toFixed(1) }]} />
        </Card>
        <Card>
          <CardHeader title="Cane price" sub="₹ per quintal · FRP (all India) vs UP state advised price" />
          <LineChart labels={CANE_YEARS} height={260} legend series={[{ label: "FRP", data: CANE_FRP, color: "#c2410c", width: 3, pointRadius: 3 }, { label: "UP SAP", data: CANE_SAP_UP, color: "#0f766e", width: 3, pointRadius: 3 }]} yFmt={(v) => `₹${v}`} />
        </Card>
      </div>
    </div>
  );
}
