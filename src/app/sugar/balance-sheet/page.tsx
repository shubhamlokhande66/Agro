"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import BarChart from "@/components/charts/BarChart";
import { Chg, Figure, SampleBanner, fmt, pct } from "@/components/sugar/ui";
import { BS_ROWS, BS_SEASONS } from "@/data/sugar/sample";

export default function SugarBalance() {
  const row = (k: string) => BS_ROWS.find((r) => r.key === k)!.values;
  const n = BS_SEASONS.length;
  const closing = row("closing");
  const cons = row("consumption");
  const months = closing.map((c, i) => Math.round((c / cons[i]) * 12 * 10) / 10);
  return (
    <div>
      <PageHeader title="Sugar Balance Sheet" icon="⚖" sub="India supply & demand · season Oct–Sep · lakh tonnes" />
      <SampleBanner source="ISMA / AISTA balance sheets, DFPD; Agrolytix estimates" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label={`Net production ${BS_SEASONS[n - 1]}`} value={fmt(row("net")[n - 1], 1)} unit="lakh t" />
        <Figure label="Consumption" value={fmt(cons[n - 1], 1)} unit="lakh t" />
        <Figure label="Exports" value={fmt(row("exports")[n - 1], 1)} unit="lakh t" />
        <Figure label="Closing stock" value={fmt(closing[n - 1], 1)} unit="lakh t" note={`≈ ${months[n - 1]} months of consumption`} />
      </section>
      <Card>
        <CardHeader title="Balance sheet" sub="Lakh tonnes · change vs previous season" />
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Lakh tonnes</Th>
                {BS_SEASONS.map((s) => <Th key={s} align="right">{s}</Th>)}
                <Th align="right">YoY</Th>
              </tr>
            </thead>
            <tbody>
              {BS_ROWS.map((r) => (
                <tr key={r.key} className={r.bold ? "bg-accent/10 font-semibold" : undefined}>
                  <Td>{r.label}</Td>
                  {r.values.map((v, i) => <Td key={i} align="right" mono>{fmt(v, 1)}</Td>)}
                  <Td align="right"><Chg v={pct(Math.abs(r.values[n - 1]), Math.abs(r.values[n - 2]))} /></Td>
                </tr>
              ))}
              <tr>
                <Td className="text-ink-faint">Stock in months of consumption</Td>
                {months.map((m, i) => <Td key={i} align="right" mono className="text-ink-faint">{m}</Td>)}
                <Td />
              </tr>
            </tbody>
          </Table>
        </TableWrap>
      </Card>
      <Card className="mt-4">
        <CardHeader title="Closing stock vs consumption" sub="Lakh tonnes" />
        <BarChart labels={BS_SEASONS} height={260} legend series={[{ label: "Closing stock", data: closing, color: "#c2410c" }, { label: "Consumption", data: cons, color: "#94a3b8" }]} />
      </Card>
    </div>
  );
}
