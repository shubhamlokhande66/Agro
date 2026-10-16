"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import BarChart from "@/components/charts/BarChart";
import { Chg, SampleBanner } from "@/components/sugar/ui";
import { RAIN_MONTHS, RAIN_STATES } from "@/data/sugar/sample";

const COLORS = ["#c2410c", "#f59e0b", "#0f766e", "#2563eb", "#7c3aed"];

export default function SugarWeather() {
  return (
    <div>
      <PageHeader title="Cane Belt Rainfall" icon="☂" sub="Monsoon rainfall vs normal in the main sugarcane subdivisions · % deviation" />
      <SampleBanner source="IMD subdivision rainfall (the same feed as the Weather dashboard)" />
      <Card>
        <CardHeader title="Monthly rainfall deviation" sub="% vs long-period average · positive = above normal" />
        <BarChart labels={RAIN_MONTHS} height={300} legend series={RAIN_STATES.map((s, i) => ({ label: s.state, data: s.dev, color: COLORS[i] }))} yFmt={(v) => `${v}%`} />
      </Card>
      <Card className="mt-4">
        <CardHeader title="Deviation by subdivision" sub="% vs normal" />
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Subdivision</Th>
                {RAIN_MONTHS.map((m) => <Th key={m} align="right">{m}</Th>)}
              </tr>
            </thead>
            <tbody>
              {RAIN_STATES.map((s) => (
                <tr key={s.state}>
                  <Td>{s.state}</Td>
                  {s.dev.map((v, i) => <Td key={i} align="right"><Chg v={v} /></Td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
