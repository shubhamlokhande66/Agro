"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { Chg, Figure, SampleBanner, fmt, pct } from "@/components/sugar/ui";
import { S_MONTHS, SUGAR_PRICES, sugarPrice } from "@/data/sugar/sample";

export default function SugarPrices() {
  const dom = SUGAR_PRICES.filter((p) => p.group === "domestic");
  const up = sugarPrice("m30_muzaffarnagar").values;
  const mh = sugarPrice("s30_kolhapur").values;
  const spread = up.map((v, i) => Math.round(v - mh[i]));
  return (
    <div>
      <PageHeader title="Domestic Sugar Prices" icon="₹" sub="Ex-mill and wholesale · ₹ per quintal · monthly" />
      <SampleBanner source="mill tender prices and trade quotes (Kolhapur, Muzaffarnagar, Belgaum, Vashi)" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {dom.map((p) => (
          <Figure key={p.key} label={p.label} value={fmt(p.values.at(-1))} unit="₹/qtl" change={pct(p.values.at(-1), p.values.at(-2))} />
        ))}
      </section>
      <Card>
        <CardHeader title="Ex-mill & wholesale prices" sub="₹ per quintal · last 24 months" />
        <LineChart
          labels={S_MONTHS}
          height={320}
          legend
          series={[
            { label: "M-30 Muzaffarnagar (UP)", data: up, color: "#c2410c", width: 2.5 },
            { label: "S-30 Kolhapur (MH)", data: mh, color: "#0f766e", width: 2.5 },
            { label: "S-30 Belgaum (KA)", data: sugarPrice("s30_belgaum").values, color: "#7c3aed", width: 2 },
            { label: "S-30 Vashi", data: sugarPrice("s30_vashi").values, color: "#64748b", width: 2, dashed: true },
          ]}
          yFmt={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`}
        />
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="North–South spread" sub="M-30 Muzaffarnagar minus S-30 Kolhapur · ₹ per quintal" />
          <BarChart labels={S_MONTHS} height={240} series={[{ label: "UP − MH", data: spread, colors: spread.map((v) => (v >= 0 ? "#c2410c" : "#0f766e")) }]} yFmt={(v) => `₹${v}`} />
        </Card>
        <Card>
          <CardHeader title="Monthly prices" sub="₹ per quintal" />
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Month</Th>
                  {dom.map((p) => <Th key={p.key} align="right">{p.label.split(" · ")[1]?.split(" (")[0] ?? p.label}</Th>)}
                  <Th align="right">m/m (UP)</Th>
                </tr>
              </thead>
              <tbody>
                {S_MONTHS.map((m, i) => ({ m, i })).reverse().slice(0, 12).map(({ m, i }) => (
                  <tr key={m}>
                    <Td>{m}</Td>
                    {dom.map((p) => <Td key={p.key} align="right" mono>{fmt(p.values[i])}</Td>)}
                    <Td align="right"><Chg v={pct(up[i], up[i - 1])} /></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>
      </div>
    </div>
  );
}
