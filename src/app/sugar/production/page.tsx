"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import BarChart from "@/components/charts/BarChart";
import { Chg, Figure, SampleBanner, fmt, pct } from "@/components/sugar/ui";
import { DIVERSION, PROD_SEASONS, PROD_STATES } from "@/data/sugar/sample";

const COLORS = ["#0f766e", "#c2410c", "#7c3aed", "#2563eb", "#d97706", "#94a3b8"];

export default function SugarProduction() {
  const n = PROD_SEASONS.length;
  const total = PROD_SEASONS.map((_, i) => PROD_STATES.reduce((a, s) => a + s.values[i], 0));
  return (
    <div>
      <PageHeader title="Sugar Production by State" icon="▤" sub="Season Oct–Sep · lakh tonnes, after diversion to ethanol" />
      <SampleBanner datasets={["sugarProduction"]} source="ISMA / NFCSF season estimates, DFPD" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label={`All India ${PROD_SEASONS[n - 1]}`} value={fmt(total[n - 1], 1)} unit="lakh t" note={`${PROD_SEASONS[n - 2]}: ${fmt(total[n - 2], 1)}`} />
        <Figure label="Change vs last season" value={`${(pct(total[n - 1], total[n - 2]) ?? 0).toFixed(1)}%`} />
        <Figure label="Diverted to ethanol" value={fmt(DIVERSION[n - 1])} unit="lakh t" />
        <Figure label="Gross (before diversion)" value={fmt(total[n - 1] + DIVERSION[n - 1], 1)} unit="lakh t" />
      </section>
      <Card>
        <CardHeader title="Production by state" sub="Stacked · lakh tonnes" />
        <BarChart labels={PROD_SEASONS} height={300} legend stacked series={PROD_STATES.map((s, i) => ({ label: s.state, data: s.values, color: COLORS[i] }))} />
      </Card>
      <Card className="mt-4">
        <CardHeader title="State-wise production" sub="Lakh tonnes" />
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>State</Th>
                {PROD_SEASONS.map((s) => <Th key={s} align="right">{s}</Th>)}
                <Th align="right">Change</Th>
                <Th align="right">Share</Th>
              </tr>
            </thead>
            <tbody>
              {PROD_STATES.map((s) => (
                <tr key={s.state}>
                  <Td>{s.state}</Td>
                  {s.values.map((v, i) => <Td key={i} align="right" mono>{fmt(v, 1)}</Td>)}
                  <Td align="right"><Chg v={pct(s.values[n - 1], s.values[n - 2])} /></Td>
                  <Td align="right" mono>{((s.values[n - 1] / total[n - 1]) * 100).toFixed(1)}%</Td>
                </tr>
              ))}
              <tr className="bg-accent/10 font-semibold">
                <Td>All India</Td>
                {total.map((v, i) => <Td key={i} align="right" mono>{fmt(v, 1)}</Td>)}
                <Td align="right"><Chg v={pct(total[n - 1], total[n - 2])} /></Td>
                <Td align="right" mono>100%</Td>
              </tr>
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
