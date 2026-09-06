"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import AreaChart from "@/components/charts/AreaChart";
import BarChart from "@/components/charts/BarChart";
import { CCI } from "@/data/cci";
import { DataMissing } from "@/components/ui/DataGuard";
import { inr, int, num } from "@/lib/format";

export default function CciPage() {
  const sellSeasons = Object.keys(CCI.monthly_sell ?? {});
  const [season, setSeason] = useState(sellSeasons.at(-1) ?? "");
  const monthlySell = useMemo(
    () => Object.entries(CCI.monthly_sell?.[season] ?? {}),
    [season],
  );

  const procSeasons = Object.keys(CCI.proc_annual ?? {});
  if (!procSeasons.length) {
    return <DataMissing title="CCI Updates" icon="🏛" dataset="cci" />;
  }
  const latestKey = procSeasons.at(-1)!;
  const prevKey = procSeasons.at(-2) ?? latestKey;

  const priceSeries = (CCI.datewise ?? []).filter((r) => r.p != null);
  const lastPrice = priceSeries.at(-1);

  const stateEntries = Object.entries(CCI.statewise ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <PageHeader
        title="CCI Updates" icon="🏛"
        sub="Cotton Corporation of India — MSP procurement, OMSS sales & prices"
      />

      <KpiRow>
        <Kpi label={`Procurement · ${latestKey}`} value={num(CCI.proc_annual[latestKey], 1)} unit="lakh bales" />
        <Kpi label={`OMSS sales · ${latestKey}`} value={num(CCI.sell_annual[latestKey], 1)} unit="lakh bales" accent="blue" />
        <Kpi label={`Closing stock · ${latestKey}`} value={num(CCI.stock_annual[latestKey], 1)} unit="lakh bales" accent="amber" />
        <Kpi
          label="Latest MSP / sale price"
          value={inr(lastPrice?.p ?? null)}
          unit={lastPrice ? `${lastPrice.d} · ₹/Candy` : "₹/Candy"}
          accent="violet"
        />
      </KpiRow>

      <div className="mt-5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Procurement vs OMSS sales — annual (lakh bales)" />
          <BarChart
            labels={procSeasons}
            series={[
              { label: "Procurement", data: procSeasons.map((s) => CCI.proc_annual[s] ?? null), color: "#0d9e77" },
              { label: "OMSS sales", data: procSeasons.map((s) => CCI.sell_annual[s] ?? null), color: "#2563eb" },
            ]}
            legend
            height={260}
          />
        </Card>

        <Card>
          <CardHeader title={`Statewise procurement · ${latestKey} (lakh bales)`} />
          <BarChart
            labels={stateEntries.map(([s]) => s)}
            series={[{ data: stateEntries.map(([, v]) => v), color: "#0d9e77" }]}
            horizontal
            height={260}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="CCI sale price (₹/Candy) — date-wise" />
          <AreaChart
            labels={priceSeries.map((r) => r.d)}
            data={priceSeries.map((r) => r.p)}
            height={220}
            yFmt={(v) => "₹" + Math.round(v / 1000) + "k"}
            tooltipLabel={(y) => inr(y)}
            smartX={false}
            xTicks={10}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={`Monthly OMSS sales — ${season}`}
            right={
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px]"
              >
                {sellSeasons.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            }
          />
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Month</Th>
                  <Th align="right">Volume (lakh bales)</Th>
                  <Th align="right">Avg ₹/Candy</Th>
                  <Th align="right">Min</Th>
                  <Th align="right">Max</Th>
                </tr>
              </thead>
              <tbody>
                {monthlySell.map(([mn, r]) => (
                  <tr key={mn}>
                    <Td>{mn}</Td>
                    <Td align="right" mono>{num(r.vol, 2)}</Td>
                    <Td align="right" mono>{int(r.avgp)}</Td>
                    <Td align="right" mono>{int(r.minp)}</Td>
                    <Td align="right" mono>{int(r.maxp)}</Td>
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
