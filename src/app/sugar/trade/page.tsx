"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import BarChart from "@/components/charts/BarChart";
import { Figure, SampleBanner, fmt } from "@/components/sugar/ui";
import { EXPORTS, EXPORT_DESTINATIONS, TRADE_MONTHS } from "@/data/sugar/sample";

export default function SugarTrade() {
  const [ly, cy] = Object.keys(EXPORTS);
  const sum = (a: (number | null)[]) => a.reduce<number>((x, y) => x + (y ?? 0), 0);
  const i = EXPORTS[cy].findLastIndex((v) => v != null);
  const toDateLy = sum(EXPORTS[ly].slice(0, i + 1));
  return (
    <div>
      <PageHeader title="Sugar Exports & Imports" icon="⇄" sub="Monthly shipments · lakh tonnes · season Oct–Sep" />
      <SampleBanner source="DGCIS / Commerce Ministry trade data, AISTA shipment reports" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label={`Exports ${cy} to ${TRADE_MONTHS[i]}`} value={fmt(sum(EXPORTS[cy]), 1)} unit="lakh t" note={`${ly} same period: ${fmt(toDateLy, 1)}`} />
        <Figure label={`Exports ${ly} (full season)`} value={fmt(sum(EXPORTS[ly]), 1)} unit="lakh t" />
        <Figure label="Export quota" value="15.0" unit="lakh t" note={`${((sum(EXPORTS[cy]) / 15) * 100).toFixed(0)}% shipped`} />
        <Figure label="Imports" value="0.2" unit="lakh t" note="negligible" />
      </section>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Monthly exports" sub={`${ly} vs ${cy} · lakh tonnes`} />
          <BarChart labels={TRADE_MONTHS} height={280} legend series={[{ label: ly, data: EXPORTS[ly], color: "#94a3b8" }, { label: cy, data: EXPORTS[cy], color: "#c2410c" }]} />
        </Card>
        <Card>
          <CardHeader title="Export destinations" sub={`Share of ${cy} shipments · %`} />
          <BarChart labels={EXPORT_DESTINATIONS.map((d) => d.country)} height={280} horizontal series={[{ label: "Share", data: EXPORT_DESTINATIONS.map((d) => d.share), color: "#0f766e", valueLabel: (v) => `${v}%` }]} />
        </Card>
      </div>
    </div>
  );
}
