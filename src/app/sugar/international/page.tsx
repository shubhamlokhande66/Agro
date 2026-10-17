"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { Figure, SampleBanner, fmt, pct } from "@/components/sugar/ui";
import { S_MONTHS, sugarPrice, whitePremium } from "@/data/sugar/sample";

export default function SugarInternational() {
  const ice = sugarPrice("ice11").values;
  const ldn = sugarPrice("ldn5").values;
  const fx = sugarPrice("usdinr").values;
  const prem = whitePremium();
  return (
    <div>
      <PageHeader title="ICE No.11 & London No.5" icon="🌐" sub="World raw and white sugar futures · front month · monthly average" />
      <SampleBanner datasets={["sugarPrices"]} source="ICE Futures US (Sugar No.11) and ICE Futures Europe (White Sugar No.5) settlements" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label="ICE Raw Sugar No.11" value={fmt(ice.at(-1), 2)} unit="¢/lb" change={pct(ice.at(-1), ice.at(-2))} />
        <Figure label="London White No.5" value={fmt(ldn.at(-1), 1)} unit="$/t" change={pct(ldn.at(-1), ldn.at(-2))} />
        <Figure label="White premium" value={fmt(prem.at(-1), 1)} unit="$/t" change={pct(prem.at(-1), prem.at(-2))} />
        <Figure label="USD / INR" value={fmt(fx.at(-1), 2)} unit="₹" change={pct(fx.at(-1), fx.at(-2))} />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="ICE Raw Sugar No.11" sub="US cents per lb" />
          <LineChart labels={S_MONTHS} height={260} series={[{ label: "ICE No.11", data: ice, color: "#2563eb", width: 2.5, fill: true }]} yFmt={(v) => `${v.toFixed(0)}¢`} />
        </Card>
        <Card>
          <CardHeader title="London White Sugar No.5" sub="US$ per tonne" />
          <LineChart labels={S_MONTHS} height={260} series={[{ label: "London No.5", data: ldn, color: "#d97706", width: 2.5, fill: true }]} yFmt={(v) => `$${Math.round(v)}`} />
        </Card>
        <Card>
          <CardHeader title="White premium" sub="London No.5 − ICE No.11 × 22.05 · US$ per tonne · above ~$100 favours refining" />
          <BarChart labels={S_MONTHS} height={240} series={[{ label: "White premium", data: prem, colors: prem.map((v) => (v >= 100 ? "#16a34a" : "#d97706")) }]} yFmt={(v) => `$${Math.round(v)}`} />
        </Card>
        <Card>
          <CardHeader title="USD / INR" sub="Rupees per US dollar · drives export parity" />
          <LineChart labels={S_MONTHS} height={240} series={[{ label: "USD/INR", data: fx, color: "#0f766e", width: 2.5 }]} yFmt={(v) => `₹${v.toFixed(1)}`} />
        </Card>
      </div>
    </div>
  );
}
