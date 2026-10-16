"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import LineChart from "@/components/charts/LineChart";
import { Chg, Figure, SampleBanner, fmt, pct } from "@/components/sugar/ui";
import { CRUSH_FORTNIGHTS, CRUSH_MILLS, CRUSH_STATES, CRUSH_SUGAR } from "@/data/sugar/sample";

export default function SugarCrushing() {
  const [ly, cy] = Object.keys(CRUSH_SUGAR);
  const i = CRUSH_SUGAR[cy].findLastIndex((v) => v != null);
  const now = CRUSH_SUGAR[cy][i] ?? null;
  const then = CRUSH_SUGAR[ly][i] ?? null;
  const total = CRUSH_STATES.reduce((a, s) => ({ mills: a.mills + s.mills, cane: a.cane + s.cane, sugar: a.sugar + s.sugar, ly: a.ly + s.ly }), { mills: 0, cane: 0, sugar: 0, ly: 0 });
  return (
    <div>
      <PageHeader title="Crushing Progress" icon="⚙" sub={`Season ${cy} vs ${ly} · position as of ${CRUSH_FORTNIGHTS[i]}`} />
      <SampleBanner source="ISMA / NFCSF fortnightly crushing reports" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label={`Sugar produced to ${CRUSH_FORTNIGHTS[i]}`} value={fmt(now, 1)} unit="lakh t" note={`${ly}: ${fmt(then, 1)}`} />
        <Figure label="vs last season, same date" value={`${(pct(now, then) ?? 0) >= 0 ? "+" : ""}${(pct(now, then) ?? 0).toFixed(1)}%`} />
        <Figure label="Mills operating" value={fmt(CRUSH_MILLS[cy][i])} note={`${ly}: ${fmt(CRUSH_MILLS[ly][i])}`} />
        <Figure label="Average recovery" value={`${((total.sugar / total.cane) * 100).toFixed(2)}%`} note="sugar ÷ cane crushed" />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cumulative sugar production" sub="Lakh tonnes, after diversion" />
          <LineChart labels={CRUSH_FORTNIGHTS} height={270} legend series={[{ label: ly, data: CRUSH_SUGAR[ly], color: "#94a3b8", width: 2.5 }, { label: cy, data: CRUSH_SUGAR[cy], color: "#c2410c", width: 3.5 }]} />
        </Card>
        <Card>
          <CardHeader title="Mills operating" sub="Number of factories crushing" />
          <LineChart labels={CRUSH_FORTNIGHTS} height={270} legend series={[{ label: ly, data: CRUSH_MILLS[ly], color: "#94a3b8", width: 2.5 }, { label: cy, data: CRUSH_MILLS[cy], color: "#0f766e", width: 3.5 }]} />
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader title="State-wise position" sub={`As of ${CRUSH_FORTNIGHTS[i]} · cane and sugar in lakh tonnes`} />
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>State</Th>
                <Th align="right">Mills</Th>
                <Th align="right">Cane crushed</Th>
                <Th align="right">Sugar produced</Th>
                <Th align="right">Recovery %</Th>
                <Th align="right">Last season</Th>
                <Th align="right">Change</Th>
              </tr>
            </thead>
            <tbody>
              {CRUSH_STATES.map((s) => (
                <tr key={s.state}>
                  <Td>{s.state}</Td>
                  <Td align="right" mono>{s.mills}</Td>
                  <Td align="right" mono>{fmt(s.cane)}</Td>
                  <Td align="right" mono>{fmt(s.sugar, 1)}</Td>
                  <Td align="right" mono>{s.recovery.toFixed(2)}</Td>
                  <Td align="right" mono>{fmt(s.ly, 1)}</Td>
                  <Td align="right"><Chg v={pct(s.sugar, s.ly)} /></Td>
                </tr>
              ))}
              <tr className="bg-accent/10 font-semibold">
                <Td>All India</Td>
                <Td align="right" mono>{total.mills}</Td>
                <Td align="right" mono>{fmt(total.cane)}</Td>
                <Td align="right" mono>{fmt(total.sugar, 1)}</Td>
                <Td align="right" mono>{((total.sugar / total.cane) * 100).toFixed(2)}</Td>
                <Td align="right" mono>{fmt(total.ly, 1)}</Td>
                <Td align="right"><Chg v={pct(total.sugar, total.ly)} /></Td>
              </tr>
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
