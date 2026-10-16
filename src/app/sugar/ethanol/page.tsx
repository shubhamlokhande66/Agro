"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { Figure, SampleBanner, fmt, pct } from "@/components/sugar/ui";
import { DIVERSION, PROD_SEASONS, S_MONTHS, sugarPrice } from "@/data/sugar/sample";

const ETHANOL_PRICES = [
  { feed: "C-heavy molasses", y: [49.41, 49.41, 56.28, 57.97] },
  { feed: "B-heavy molasses", y: [59.08, 60.73, 60.73, 60.73] },
  { feed: "Cane juice / syrup", y: [63.45, 65.61, 65.61, 65.61] },
];
const ESY = ["2021-22", "2022-23", "2023-24", "2024-25"];

export default function SugarEthanol() {
  const mol = sugarPrice("molasses").values;
  return (
    <div>
      <PageHeader title="Ethanol & Molasses" icon="⛽" sub="Diversion of sugar to ethanol, OMC procurement prices and molasses" />
      <SampleBanner source="OMC ethanol procurement prices (GoI), ISMA diversion estimates, molasses trade quotes" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label={`Diversion ${PROD_SEASONS.at(-1)}`} value={fmt(DIVERSION.at(-1))} unit="lakh t" change={pct(DIVERSION.at(-1), DIVERSION.at(-2))} />
        <Figure label="Ethanol · cane juice" value="65.61" unit="₹/L" />
        <Figure label="Ethanol · B-heavy" value="60.73" unit="₹/L" />
        <Figure label="Molasses (C-heavy)" value={fmt(mol.at(-1))} unit="₹/t" change={pct(mol.at(-1), mol.at(-2))} />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Sugar diverted to ethanol" sub="Lakh tonnes per season" />
          <BarChart labels={PROD_SEASONS} height={260} series={[{ label: "Diversion", data: DIVERSION, color: "#16a34a", valueLabel: (v) => String(v) }]} />
        </Card>
        <Card>
          <CardHeader title="Molasses price" sub="C-heavy · ₹ per tonne" />
          <LineChart labels={S_MONTHS} height={260} series={[{ label: "Molasses", data: mol, color: "#92400e", width: 2.5 }]} yFmt={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`} />
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader title="Ethanol procurement price by feedstock" sub="₹ per litre · ethanol supply year (Nov–Oct)" />
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Feedstock</Th>
                {ESY.map((y) => <Th key={y} align="right">{y}</Th>)}
              </tr>
            </thead>
            <tbody>
              {ETHANOL_PRICES.map((r) => (
                <tr key={r.feed}>
                  <Td>{r.feed}</Td>
                  {r.y.map((v, i) => <Td key={i} align="right" mono>{v.toFixed(2)}</Td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
