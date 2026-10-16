"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import BarChart from "@/components/charts/BarChart";
import { Figure, SampleBanner, fmt } from "@/components/sugar/ui";
import { POLICY, RELEASE_MONTHS, RELEASE_QUOTA } from "@/data/sugar/sample";

export default function SugarPolicy() {
  return (
    <div>
      <PageHeader title="Policy & Quotas" icon="🏛" sub="Monthly domestic sales quota, minimum selling price, export policy" />
      <SampleBanner source="DFPD monthly release orders and notifications" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label={`Release quota · ${RELEASE_MONTHS.at(-1)}`} value={fmt(RELEASE_QUOTA.at(-1), 1)} unit="lakh t" note={`${RELEASE_MONTHS.at(-2)}: ${fmt(RELEASE_QUOTA.at(-2), 1)}`} />
        <Figure label="12-month quota total" value={fmt(RELEASE_QUOTA.reduce((a, b) => a + b, 0), 1)} unit="lakh t" />
        <Figure label="Minimum selling price" value="₹31" unit="/ kg" />
        <Figure label="Export quota" value="15" unit="lakh t" />
      </section>
      <Card>
        <CardHeader title="Monthly release quota" sub="Sugar mills may sell in the domestic market · lakh tonnes" />
        <BarChart labels={RELEASE_MONTHS} height={280} series={[{ label: "Quota", data: RELEASE_QUOTA, color: "#c2410c", valueLabel: (v) => v.toFixed(1) }]} />
      </Card>
      <Card className="mt-4">
        <CardHeader title="Policy snapshot" />
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Measure</Th>
                <Th>Current</Th>
                <Th>Note</Th>
              </tr>
            </thead>
            <tbody>
              {POLICY.map((p) => (
                <tr key={p.item}>
                  <Td>{p.item}</Td>
                  <Td className="font-semibold">{p.value}</Td>
                  <Td className="text-ink-faint">{p.note}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
