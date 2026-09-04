"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import { Delta } from "@/components/ui/ChangeBadge";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { SND } from "@/data/balanceSheet";
import { num, pctChange } from "@/lib/format";

const ROWS: { key: keyof (typeof SND.annual)[string]; label: string; group: "supply" | "demand" | "close" }[] = [
  { key: "opening_stocks", label: "Opening stocks", group: "supply" },
  { key: "crop_size", label: "Crop size", group: "supply" },
  { key: "imports", label: "Imports", group: "supply" },
  { key: "total_supply", label: "Total supply", group: "supply" },
  { key: "domestic_cons", label: "Domestic consumption", group: "demand" },
  { key: "exports", label: "Exports", group: "demand" },
  { key: "total_demand", label: "Total demand", group: "demand" },
  { key: "closing_stocks", label: "Closing stocks", group: "close" },
];

export default function BalanceSheetPage() {
  const [view, setView] = useState<"annual" | "monthly">("annual");
  const annualSeasons = SND.annual_seasons; // newest first
  const chrono = [...annualSeasons].reverse();

  const latest = annualSeasons[0];
  const prev = annualSeasons[1];
  const a = SND.annual[latest];
  const p = SND.annual[prev];

  const stu = a.closing_stocks / a.total_demand * 100;

  const [season, setSeason] = useState(SND.seasons.at(-1)!);
  const monthRows = useMemo(() => {
    const block = SND.monthly[season] ?? {};
    return SND.months_order.map((mn) => ({ mn, ...(block[mn] ?? {}) }));
  }, [season]);

  return (
    <div>
      <PageHeader
        title="Cotton Balance Sheet" icon="⚖"
        sub="India supply & demand · lakh bales · Source: CAB / trade estimates"
      />

      <KpiRow>
        <Kpi label={`Crop · ${latest}`} value={num(a.crop_size, 1)} unit="lakh bales"
          foot={<Delta value={pctChange(a.crop_size, p.crop_size)} />} />
        <Kpi label={`Imports · ${latest}`} value={num(a.imports, 1)} unit="lakh bales" accent="blue"
          foot={<Delta value={pctChange(a.imports, p.imports)} />} />
        <Kpi label={`Closing stocks · ${latest}`} value={num(a.closing_stocks, 1)} unit="lakh bales"
          accent={a.closing_stocks < 0 ? "red" : "amber"} />
        <Kpi label="Stocks-to-use" value={stu.toFixed(1) + "%"} accent="violet" />
      </KpiRow>

      <div className="mt-4">
        <Tabs
          size="md"
          options={[
            { value: "annual", label: "Annual balance sheet" },
            { value: "monthly", label: "Monthly detail" },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === "annual" ? (
        <div className="mt-4 space-y-3.5">
          <Card>
            <CardHeader title="Crop, consumption & closing stocks (lakh bales)" />
            <LineChart
              labels={chrono}
              series={[
                { label: "Crop size", data: chrono.map((s) => SND.annual[s]?.crop_size ?? null), color: "#0d9e77", width: 2 },
                { label: "Total demand", data: chrono.map((s) => SND.annual[s]?.total_demand ?? null), color: "#2563eb", width: 2 },
                { label: "Closing stocks", data: chrono.map((s) => SND.annual[s]?.closing_stocks ?? null), color: "#f59e0b", width: 2, dashed: true },
              ]}
              smartX={false}
              height={260}
            />
          </Card>

          <Card>
            <CardHeader title={`Balance sheet — ${latest} vs ${prev}`} />
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Item (lakh bales)</Th>
                    <Th align="right">{prev}</Th>
                    <Th align="right">{latest}</Th>
                    <Th align="right">YoY</Th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.key} className={r.key.startsWith("total") || r.key === "closing_stocks" ? "font-semibold" : ""}>
                      <Td>{r.label}</Td>
                      <Td align="right" mono>{num(p[r.key], 1)}</Td>
                      <Td align="right" mono>{num(a[r.key], 1)}</Td>
                      <Td align="right"><Delta value={pctChange(a[r.key], p[r.key])} /></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            <p className="mt-2 text-[11px] italic text-ink-faint">
              {latest} closing stocks are a trade forecast and can be provisional / negative when
              demand + exports run ahead of supply.
            </p>
          </Card>
        </div>
      ) : (
        <div className="mt-4 space-y-3.5">
          <Card>
            <CardHeader
              title={`Monthly stock movement — ${season}`}
              right={
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px]"
                >
                  {[...SND.seasons].reverse().map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              }
            />
            <LineChart
              labels={SND.months_order}
              series={[
                { label: "Opening", data: monthRows.map((r) => r.opening ?? null), color: "#94a3b8", width: 1.5 },
                { label: "Closing", data: monthRows.map((r) => r.closing ?? null), color: "#0d9e77", width: 2, fill: true, fillColor: "rgba(13,158,119,0.1)" },
              ]}
              smartX={false}
              height={230}
            />
          </Card>
          <Card>
            <CardHeader title={`Consumption vs exports — ${season} (lakh bales / month)`} />
            <BarChart
              labels={SND.months_order}
              series={[
                { label: "Domestic consumption", data: monthRows.map((r) => r.total_cons ?? null), color: "#2563eb" },
                { label: "Exports", data: monthRows.map((r) => r.exports ?? null), color: "#f59e0b" },
              ]}
              legend
              height={230}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
