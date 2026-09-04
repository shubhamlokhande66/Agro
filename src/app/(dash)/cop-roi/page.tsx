"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import { Delta } from "@/components/ui/ChangeBadge";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { COP_DATA, COP_CROPS, COP_EMOJI } from "@/data/cop";
import { SERIES } from "@/components/charts/theme";
import { int, num, pctChange } from "@/lib/format";

export default function CopRoiPage() {
  const [crop, setCrop] = useState("Cotton");
  const c = COP_DATA[crop];
  const yrs = c.years;
  const lastIdx = yrs.length - 1;

  const t = c.totals;
  const costComponents = useMemo(
    () =>
      Object.entries(c.cost_components)
        .map(([k, arr]) => ({ k, v: arr[lastIdx] }))
        .sort((a, b) => b.v - a.v),
    [c, lastIdx],
  );

  return (
    <div>
      <PageHeader
        title="COP & ROI"
        icon="%"
        sub="Cost of production, returns and ROI — cotton vs competing kharif crops (₹ / acre)"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {COP_CROPS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setCrop(name)}
            className={
              "focusable rounded-xl border px-3 py-1.5 text-[12.5px] font-medium transition-colors " +
              (crop === name
                ? "border-accent bg-accent-soft text-ink"
                : "border-line bg-surface text-ink-soft hover:border-accent")
            }
          >
            <span className="mr-1.5">{COP_EMOJI[name] ?? "🌱"}</span>
            {name}
          </button>
        ))}
      </div>

      <KpiRow>
        <Kpi
          label={`Total cost · ${yrs[lastIdx]}`}
          value={int(t.total_cost[lastIdx])}
          unit="₹ / acre"
          foot={<Delta value={pctChange(t.total_cost[lastIdx], t.total_cost[lastIdx - 1])} />}
        />
        <Kpi label="Yield" value={num(t.yield[lastIdx], 2)} unit="qtl / acre" accent="blue" />
        <Kpi
          label="Net return"
          value={int(t.net_return[lastIdx])}
          unit="₹ / acre"
          accent={t.net_return[lastIdx] < 0 ? "red" : "green"}
        />
        <Kpi
          label="ROI"
          value={(t.roi[lastIdx] * 100).toFixed(0) + "%"}
          accent="amber"
          spark={t.roi.map((r) => r * 100)}
        />
      </KpiRow>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="ROI by crop — year on year (%)" />
          <LineChart
            labels={COP_DATA.Cotton.years}
            series={COP_CROPS.map((name, i) => ({
              label: name,
              data: COP_DATA[name].totals.roi.map((r) => r * 100),
              color: SERIES[i % SERIES.length],
              width: name === crop ? 2.5 : 1.25,
            }))}
            smartX={false}
            height={280}
            yFmt={(v) => v + "%"}
          />
        </Card>

        <Card>
          <CardHeader title={`Cost breakdown · ${crop} · ${yrs[lastIdx]}`} />
          <BarChart
            labels={costComponents.map((x) => x.k)}
            series={[{ data: costComponents.map((x) => x.v), color: SERIES[0] }]}
            horizontal
            height={280}
            yFmt={(v) => "₹" + Math.round(v / 1000) + "k"}
            tooltipLabel={(c2) => "₹" + int(c2.parsed.x)}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={`Gross vs net return · ${crop} (₹ / acre)`} />
          <BarChart
            labels={yrs}
            series={[
              { label: "Gross return", data: t.gross_return, color: SERIES[1] },
              { label: "Net return", data: t.net_return, color: SERIES[0] },
            ]}
            legend
            height={260}
            smartX={false}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={`${crop} — economics by year`} />
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Year</Th>
                  <Th align="right">Total cost</Th>
                  <Th align="right">Yield</Th>
                  <Th align="right">Price ₹/qtl</Th>
                  <Th align="right">Gross</Th>
                  <Th align="right">Net</Th>
                  <Th align="right">ROI</Th>
                </tr>
              </thead>
              <tbody>
                {yrs.map((y, i) => (
                  <tr key={y} className="transition-colors hover:bg-surface-2/60">
                    <Td>{y}</Td>
                    <Td align="right" mono>{int(t.total_cost[i])}</Td>
                    <Td align="right" mono>{num(t.yield[i], 2)}</Td>
                    <Td align="right" mono>{int(t.price[i])}</Td>
                    <Td align="right" mono>{int(t.gross_return[i])}</Td>
                    <Td align="right" mono className={t.net_return[i] < 0 ? "text-neg" : ""}>
                      {int(t.net_return[i])}
                    </Td>
                    <Td align="right" mono className={t.roi[i] < 0 ? "text-neg" : "text-pos"}>
                      {(t.roi[i] * 100).toFixed(0)}%
                    </Td>
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
