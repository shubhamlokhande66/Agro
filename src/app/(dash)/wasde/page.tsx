"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import { Delta } from "@/components/ui/ChangeBadge";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import { WD, WD_CATEGORIES } from "@/data/wasde";
import { DataMissing } from "@/components/ui/DataGuard";
import { int, pctChange } from "@/lib/format";

type CatKey = (typeof WD_CATEGORIES)[number]["key"];

export default function WasdePage() {
  const [cat, setCat] = useState<CatKey>("production");
  const yrs = WD.years ?? [];
  const li = yrs.length - 1;
  if (!yrs.length || !WD.production || !Object.keys(WD.production).length) {
    return <DataMissing title="WASDE — World Cotton Balance" icon="🌐" dataset="wasde" />;
  }
  const block = WD[cat] as Record<string, number[]>;

  const countries = Object.keys(block).filter((k) => k !== "World");
  const ranked = countries
    .map((c) => ({ c, v: block[c][li] }))
    .sort((a, b) => b.v - a.v);

  const world = (k: CatKey) => (WD[k] as Record<string, number[]>).World;

  return (
    <div>
      <PageHeader
        title="WASDE — World Cotton Balance"
        icon="🌐"
        sub={`USDA · ${String(WD.meta.latest_report)} report · 1,000 MT (KMT) · marketing year ${String(WD.meta.marketing_year)}`}
      />

      <KpiRow>
        <Kpi
          label="World production"
          value={int(world("production")[li])}
          unit="KMT"
          foot={<Delta value={pctChange(world("production")[li], world("production")[li - 1])} />}
        />
        <Kpi
          label="World mill use"
          value={int(world("mill_use")[li])}
          unit="KMT"
          accent="blue"
          foot={<Delta value={pctChange(world("mill_use")[li], world("mill_use")[li - 1])} />}
        />
        <Kpi
          label="World trade (exports)"
          value={int(world("exports")[li])}
          unit="KMT"
          accent="amber"
          foot={<Delta value={pctChange(world("exports")[li], world("exports")[li - 1])} />}
        />
        <Kpi
          label="World ending stocks"
          value={int(world("ending_stocks")[li])}
          unit="KMT"
          accent="violet"
          spark={world("ending_stocks")}
        />
      </KpiRow>

      <div className="mt-4">
        <Tabs
          size="md"
          options={WD_CATEGORIES.map((c) => ({ value: c.key, label: c.label }))}
          value={cat}
          onChange={setCat}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={`${WD_CATEGORIES.find((c) => c.key === cat)!.label} by country · ${yrs[li]}`}
          />
          <BarChart
            labels={ranked.map((r) => r.c)}
            series={[{ data: ranked.map((r) => r.v), color: "#12a277" }]}
            horizontal
            height={300}
            yFmt={(v) => (v >= 1000 ? (v / 1000).toFixed(0) + "k" : String(v))}
            tooltipLabel={(c2) => int(c2.parsed.x) + " KMT"}
          />
        </Card>

        <Card>
          <CardHeader title="World total — across report vintages (KMT)" />
          <LineChart
            labels={yrs}
            series={[
              { label: "Production", data: world("production"), color: "#12a277", width: 2 },
              { label: "Mill use", data: world("mill_use"), color: "#2f7fe0", width: 2 },
              { label: "Ending stocks", data: world("ending_stocks"), color: "#e0902f", width: 2, dashed: true },
            ]}
            smartX={false}
            height={300}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={`${WD_CATEGORIES.find((c) => c.key === cat)!.label} — country detail (KMT)`}
          />
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Country</Th>
                  {yrs.map((y) => (
                    <Th key={y} align="right">
                      {y}
                    </Th>
                  ))}
                  <Th align="right">Δ latest</Th>
                </tr>
              </thead>
              <tbody>
                {[...ranked.map((r) => r.c), "World"].map((cn) => (
                  <tr
                    key={cn}
                    className={
                      "transition-colors hover:bg-surface-2/60 " +
                      (cn === "World" ? "font-semibold" : "")
                    }
                  >
                    <Td>{cn}</Td>
                    {block[cn].map((v, i) => (
                      <Td key={i} align="right" mono>
                        {int(v)}
                      </Td>
                    ))}
                    <Td align="right">
                      <Delta value={pctChange(block[cn][li], block[cn][li - 1])} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
          <p className="num mt-2 text-[11px] text-ink-faint">{String(WD.meta.note)}</p>
        </Card>
      </div>
    </div>
  );
}
