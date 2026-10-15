"use client";

import { timeAgo } from "@/lib/format";
import { HeroChart, type HeroCategory } from "@/components/overview/HeroChart";
import { HeroCategoryRail } from "@/components/overview/HeroCategoryRail";
import { PriceTable } from "@/components/overview/PriceTable";
import { OverviewSections } from "@/components/overview/OverviewSections";
import { CommentsPanel } from "@/components/ui/CommentsPanel";
import { ExportPdfButton, type PdfReport } from "@/components/ui/ExportPdfButton";
import { GlobalPeriodTabs } from "@/components/ui/GlobalPeriodTabs";
import { type GlobalPeriod } from "@/lib/period";
import { useDatasetMeta } from "@/lib/meta/context";
import { useState } from "react";

function overviewReports(now = new Date()): PdfReport[] {
  const day = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const month = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const iso = now.toISOString().slice(0, 10);
  return [
    { key: "weekly", label: "Weekly report", title: "India Cotton Weekly Report", dateLine: day, fileName: `Agrolytix India Cotton Weekly Report ${iso}` },
    { key: "monthly", label: "Monthly report", title: "India Monthly Cotton Report", dateLine: month, fileName: `Agrolytix India Monthly Cotton Report ${iso.slice(0, 7)}` },
  ];
}

const OVERVIEW_DATASETS = ["prices", "international", "balanceSheet", "production", "trade", "rainfall", "sowing"];

export default function OverviewPage() {
  const { meta } = useDatasetMeta();
  const lastUpdated = OVERVIEW_DATASETS.map((k) => meta[k]?.updatedAt)
    .filter((t): t is number => t != null)
    .sort((a, b) => b - a)[0];

  const [period, setPeriod] = useState<GlobalPeriod>("6m");
  const [heroCat, setHeroCat] = useState<HeroCategory>("domestic");
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Agrolytix Research · India Cotton</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Market Overview
          </h1>
          <p className="num mt-1 text-[11px] text-ink-faint">
            {lastUpdated != null ? `Data updated ${timeAgo(lastUpdated)}` : "Live market data"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <GlobalPeriodTabs value={period} onChange={setPeriod} />
          <ExportPdfButton
            fileName={`Agrolytix Market Overview ${new Date().toISOString().slice(0, 10)}`}
            reports={overviewReports()}
          />
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

      {view === "table" ? (
        <PriceTable />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <HeroChart category={heroCat} period={period} onPeriodChange={setPeriod} />
          <div className="flex min-w-0 flex-col gap-3">
            <HeroCategoryRail value={heroCat} onChange={setHeroCat} period={period} />
          </div>
        </div>
      )}

      <div className="mt-4">
        <CommentsPanel section="overview" title="Summary (Prices)" minHeight={120} rows={5} />
      </div>

      <OverviewSections />
    </div>
  );
}
