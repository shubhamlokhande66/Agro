"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { ExportPdfButton, type PdfReport } from "@/components/ui/ExportPdfButton";
import { ReportHeading } from "@/components/overview/ReportHeading";
import { SampleBanner, fmt } from "@/components/sugar/ui";
import { SugarCategoryRail, SugarHeroChart, SugarPriceTable, type SugarCategory } from "@/components/sugar/SugarOverviewParts";
import { GlobalPeriodTabs } from "@/components/ui/GlobalPeriodTabs";
import type { GlobalPeriod } from "@/lib/period";
import { timeAgo } from "@/lib/format";
import {
  SUGAR_UPDATED,
  CRUSH_FORTNIGHTS, CRUSH_SUGAR, PROD_SEASONS, PROD_STATES, BS_SEASONS, BS_ROWS,
  BR_FORTNIGHTS, BR_SUGAR, WORLD_SEASONS, WORLD_PROD, WORLD_CONS,
} from "@/data/sugar/sample";

function sugarReports(now = new Date()): PdfReport[] {
  const dd = (n: number) => String(n).padStart(2, "0");
  const iso = now.toISOString().slice(0, 10);
  const contents = ["Market Prices", "Crushing Progress", "Production by State", "Balance Sheet", "Brazil & World Balance"];
  return [
    { key: "weekly", label: "Weekly report", title: "INDIA SUGAR: Weekly Report", dateLine: `${dd(now.getDate())}.${dd(now.getMonth() + 1)}.${now.getFullYear()}`, fileName: `Agrolytix India Sugar Weekly Report ${iso}`, contents, banner: null },
    { key: "monthly", label: "Monthly report", title: "INDIA SUGAR: Monthly Report", dateLine: now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }), fileName: `Agrolytix India Sugar Monthly Report ${iso.slice(0, 7)}`, contents, banner: null },
  ];
}

function More({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="print-hide text-[11px] font-semibold text-accent hover:underline">
      {label} →
    </Link>
  );
}

export default function SugarOverview() {
  const [period, setPeriod] = useState<GlobalPeriod>("1m");
  const [cat, setCat] = useState<SugarCategory>("kolhapur");
  const [view, setView] = useState<"chart" | "table">("chart");
  const seasons = Object.keys(CRUSH_SUGAR);
  const brSeasons = Object.keys(BR_SUGAR);
  const cur = PROD_SEASONS.length - 1;
  const updated = Math.max(0, ...Object.values(SUGAR_UPDATED).map((t) => t ?? 0));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        {/* page title and "data updated" are dashboard chrome — the PDF has its cover page instead */}
        <div className="print-hide">
          <div className="eyebrow">Agrolytix Research · India Sugar</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Market Overview</h1>
          <p className="num mt-1 text-[11px] text-ink-faint">{updated ? `Data updated ${timeAgo(updated)}` : "Live market data"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="print-hide">
            <GlobalPeriodTabs value={period} onChange={setPeriod} />
          </span>
          <ExportPdfButton fileName={`Agrolytix Sugar Overview ${new Date().toISOString().slice(0, 10)}`} reports={sugarReports()} />
          <div className="print-hide flex rounded-xl bg-surface-2 p-1" role="tablist" aria-label="View">
            {(["chart", "table"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={
                  "focusable rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors " +
                  (view === v ? "bg-accent text-accent-contrast" : "text-ink-faint hover:text-ink")
                }
              >
                {v === "chart" ? "Chart view" : "Table view"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <SampleBanner datasets={["sugarPrices", "sugarCrushing", "sugarProduction", "sugarBalance", "sugarBrazil", "sugarWorld"]} source="ICE / London sugar prices, crushing, production, balance sheet, Brazil and world data — still to be connected" />

      <ReportHeading sub="Domestic and global markets">Market Prices</ReportHeading>
      {/* the PDF report always carries the price table, never the chart — in chart view the table is
          kept hidden on screen and swapped in while the PDF is captured */}
      <div className={view === "table" ? undefined : "pdf-only"}>
        <SugarPriceTable />
      </div>
      {view === "chart" ? (
        <div className="print-hide grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <SugarHeroChart category={cat} period={period} onPeriodChange={setPeriod} />
          <SugarCategoryRail value={cat} onChange={setCat} period={period} />
        </div>
      ) : null}

      <ReportHeading>Crushing &amp; Production</ReportHeading>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Crushing progress" sub={`Cumulative sugar produced · lakh tonnes · ${seasons.join(" vs ")}`} right={<More href="/sugar/crushing" label="Details" />} />
          <LineChart
            labels={CRUSH_FORTNIGHTS}
            height={240}
            legend
            series={[
              { label: seasons[0], data: CRUSH_SUGAR[seasons[0]], color: "#94a3b8", width: 2.5 },
              { label: seasons[1], data: CRUSH_SUGAR[seasons[1]], color: "#c2410c", width: 3.5 },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Production by state" sub={`Lakh tonnes, after ethanol diversion · ${PROD_SEASONS[cur - 1]} vs ${PROD_SEASONS[cur]}`} right={<More href="/sugar/production" label="Details" />} />
          <BarChart
            labels={PROD_STATES.map((s) => s.state)}
            height={240}
            legend
            series={[
              { label: PROD_SEASONS[cur - 1], data: PROD_STATES.map((s) => s.values[cur - 1]), color: "#94a3b8" },
              { label: PROD_SEASONS[cur], data: PROD_STATES.map((s) => s.values[cur]), color: "#c2410c", valueLabel: (v) => v.toFixed(0) },
            ]}
          />
        </Card>
      </div>

      <ReportHeading>Balance Sheet</ReportHeading>
      <Card className="mt-4">
        <CardHeader title="India sugar balance sheet" sub="Oct–Sep · lakh tonnes" right={<More href="/sugar/balance-sheet" label="Full balance sheet" />} />
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Lakh tonnes</Th>
                {BS_SEASONS.map((s) => <Th key={s} align="right">{s}</Th>)}
              </tr>
            </thead>
            <tbody>
              {BS_ROWS.map((r) => (
                <tr key={r.key} className={r.bold ? "bg-accent/10 font-semibold" : undefined}>
                  <Td>{r.label}</Td>
                  {r.values.map((v, i) => <Td key={i} align="right" mono>{fmt(v, 1)}</Td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      <ReportHeading>Brazil &amp; World Balance</ReportHeading>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Brazil Centre-South sugar output" sub={`UNICA · cumulative, million tonnes · ${brSeasons.join(" vs ")}`} right={<More href="/sugar/brazil" label="Brazil" />} />
          <LineChart
            labels={BR_FORTNIGHTS}
            height={240}
            legend
            series={[
              { label: brSeasons[1], data: BR_SUGAR[brSeasons[1]], color: "#94a3b8", width: 2.5 },
              { label: brSeasons[0], data: BR_SUGAR[brSeasons[0]], color: "#16a34a", width: 3.5 },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="World sugar balance" sub="Production vs consumption · million tonnes, raw value" right={<More href="/sugar/world" label="World balance" />} />
          <BarChart
            labels={WORLD_SEASONS}
            height={240}
            legend
            series={[
              { label: "Production", data: WORLD_PROD, color: "#0f766e" },
              { label: "Consumption", data: WORLD_CONS, color: "#d97706" },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
