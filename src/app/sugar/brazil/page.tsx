"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import LineChart from "@/components/charts/LineChart";
import { Figure, SampleBanner, fmt, pct } from "@/components/sugar/ui";
import { BR_FORTNIGHTS, BR_MIX, BR_SUGAR } from "@/data/sugar/sample";

export default function SugarBrazil() {
  const [cy, ly] = Object.keys(BR_SUGAR);
  const i = BR_SUGAR[cy].findLastIndex((v) => v != null);
  return (
    <div>
      <PageHeader title="Brazil Centre-South (UNICA)" icon="◕" sub={`Season ${cy} (Apr–Mar) vs ${ly} · position as of ${BR_FORTNIGHTS[i]}`} />
      <SampleBanner datasets={["sugarBrazil"]} source="UNICA fortnightly reports" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label={`Sugar to ${BR_FORTNIGHTS[i]}`} value={fmt(BR_SUGAR[cy][i], 1)} unit="mn t" note={`${ly}: ${fmt(BR_SUGAR[ly][i], 1)}`} />
        <Figure label="vs last season" value={`${(pct(BR_SUGAR[cy][i], BR_SUGAR[ly][i]) ?? 0).toFixed(1)}%`} />
        <Figure label="Sugar mix (fortnight)" value={`${fmt(BR_MIX[cy][i], 1)}%`} note={`${ly}: ${fmt(BR_MIX[ly][i], 1)}%`} />
        <Figure label="Ethanol share" value={`${fmt(100 - (BR_MIX[cy][i] ?? 0), 1)}%`} />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cumulative sugar production" sub="Million tonnes" />
          <LineChart labels={BR_FORTNIGHTS} height={270} legend series={[{ label: ly, data: BR_SUGAR[ly], color: "#94a3b8", width: 2.5 }, { label: cy, data: BR_SUGAR[cy], color: "#16a34a", width: 3.5 }]} />
        </Card>
        <Card>
          <CardHeader title="Sugar mix" sub="% of cane sugars (ATR) made into sugar rather than ethanol" />
          <LineChart labels={BR_FORTNIGHTS} height={270} legend series={[{ label: ly, data: BR_MIX[ly], color: "#94a3b8", width: 2.5 }, { label: cy, data: BR_MIX[cy], color: "#d97706", width: 3.5 }]} yFmt={(v) => `${v.toFixed(0)}%`} />
        </Card>
      </div>
    </div>
  );
}
