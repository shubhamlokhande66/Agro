"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import BarChart from "@/components/charts/BarChart";
import { Figure, SampleBanner, fmt } from "@/components/sugar/ui";
import { WORLD_CONS, WORLD_PROD, WORLD_SEASONS, WORLD_TOP } from "@/data/sugar/sample";

export default function SugarWorld() {
  const bal = WORLD_PROD.map((p, i) => Math.round((p - WORLD_CONS[i]) * 10) / 10);
  const n = WORLD_SEASONS.length;
  return (
    <div>
      <PageHeader title="World Sugar Balance" icon="◑" sub="Global production and consumption · million tonnes, raw value · Oct–Sep" />
      <SampleBanner source="ISO quarterly market outlook, USDA FAS Sugar: World Markets and Trade" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label={`Production ${WORLD_SEASONS[n - 1]}`} value={fmt(WORLD_PROD[n - 1], 1)} unit="mn t" />
        <Figure label="Consumption" value={fmt(WORLD_CONS[n - 1], 1)} unit="mn t" />
        <Figure label={bal[n - 1] >= 0 ? "Surplus" : "Deficit"} value={fmt(Math.abs(bal[n - 1]), 1)} unit="mn t" />
        <Figure label={`${WORLD_SEASONS[n - 2]} balance`} value={`${bal[n - 2] >= 0 ? "+" : "−"}${fmt(Math.abs(bal[n - 2]), 1)}`} unit="mn t" />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Surplus / deficit" sub="Production minus consumption · million tonnes" />
          <BarChart labels={WORLD_SEASONS} height={260} series={[{ label: "Balance", data: bal, colors: bal.map((v) => (v >= 0 ? "#16a34a" : "#dc2626")), valueLabel: (v) => `${v > 0 ? "+" : ""}${v}` }]} />
        </Card>
        <Card>
          <CardHeader title="Main producers & exporters" sub={`${WORLD_SEASONS[n - 1]} · million tonnes`} />
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Country</Th>
                  <Th align="right">Production</Th>
                  <Th align="right">Exports</Th>
                </tr>
              </thead>
              <tbody>
                {WORLD_TOP.map((c) => (
                  <tr key={c.country}>
                    <Td>{c.country}</Td>
                    <Td align="right" mono>{fmt(c.prod, 1)}</Td>
                    <Td align="right" mono>{fmt(c.exports, 1)}</Td>
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
