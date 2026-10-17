"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import BarChart from "@/components/charts/BarChart";
import { Figure, SampleBanner } from "@/components/sugar/ui";
import { COT_MM_NET, COT_WEEKS } from "@/data/sugar/sample";

export default function SugarCftc() {
  const net = COT_MM_NET.at(-1)!;
  const chg = net - COT_MM_NET.at(-2)!;
  const short = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const signed = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toLocaleString("en-US")}`;
  return (
    <div>
      <PageHeader title="CFTC · Sugar No.11" icon="◔" sub="Commitments of Traders · managed money (funds) net position · contracts" />
      <SampleBanner datasets={["sugarCftc"]} source="CFTC disaggregated Commitments of Traders, futures only (code 080732)" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Figure label={`Funds net · ${short(COT_WEEKS.at(-1)!)}`} value={signed(net)} note={net >= 0 ? "net long" : "net short"} />
        <Figure label="Change on week" value={signed(chg)} />
        <Figure label="52-week range" value={`${signed(Math.min(...COT_MM_NET))} to ${signed(Math.max(...COT_MM_NET))}`} />
      </section>
      <Card>
        <CardHeader title="Managed money net position" sub="Contracts · weekly · green net long, red net short" />
        <BarChart
          labels={COT_WEEKS.map(short)}
          height={300}
          xTicks={10}
          series={[{ label: "Funds net", data: COT_MM_NET, colors: COT_MM_NET.map((v) => (v >= 0 ? "#16a34a" : "#dc2626")) }]}
          yFmt={(v) => `${Math.round(v / 1000)}k`}
        />
      </Card>
    </div>
  );
}
