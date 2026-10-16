"use client";

import { timeAgo } from "@/lib/format";
import { HeroChart, type HeroCategory } from "@/components/overview/HeroChart";
import { HeroCategoryRail } from "@/components/overview/HeroCategoryRail";
import { PriceTable } from "@/components/overview/PriceTable";
import { OverviewSections } from "@/components/overview/OverviewSections";
import { CommentsPanel } from "@/components/ui/CommentsPanel";
import { autoCommentary } from "@/lib/autoCommentary";
import { ReportHeading } from "@/components/overview/ReportHeading";
import { fieldPulseHidden } from "@/components/overview/ReportExtras";
import { GROUND_REPORTS, GROUND_STATES, imageUrl } from "@/data/groundReport";
import { ExportPdfButton, type PdfReport } from "@/components/ui/ExportPdfButton";
import { GlobalPeriodTabs } from "@/components/ui/GlobalPeriodTabs";
import { type GlobalPeriod } from "@/lib/period";
import { useDatasetMeta } from "@/lib/meta/context";
import { useState } from "react";

/** what each report covers, for its cover page (the weekly report leaves out the balance sheet and benchmarks) */
const WEEKLY_CONTENTS = [
  "Market Prices",
  "Weather & Rainfall",
  "Cotton Arrivals & Sowing",
  "India Cotton Production",
  "CCI Updates",
  "Cotton Basis",
  "USDA WASDE",
  "CFTC & USDA Export Sales",
  "Field Pulse · From the Fields",
];
const MONTHLY_CONTENTS = [...WEEKLY_CONTENTS.slice(0, 5), "India Balance Sheet", ...WEEKLY_CONTENTS.slice(5, 8), "Production Benchmarks", WEEKLY_CONTENTS[8]];

/** up to three photographs from the latest Field Pulse report, one per state, for the cover (not from states hidden on the Overview) */
function coverPhotos(): { src: string; caption: string }[] {
  const r = GROUND_REPORTS[0];
  if (!r) return [];
  const label = (code: string) => GROUND_STATES.find((s) => s.code === code)?.label ?? code;
  const hidden = fieldPulseHidden(r.id);
  return r.states
    .filter((s) => s.photos.length && !hidden.includes(s.state))
    .slice(0, 3)
    .map((s) => ({ src: imageUrl(s.photos[0].id), caption: [label(s.state), s.photos[0].location].filter(Boolean).join(" · ") }));
}

function overviewReports(now = new Date()): PdfReport[] {
  const dd = (n: number) => String(n).padStart(2, "0");
  const day = `${dd(now.getDate())}.${dd(now.getMonth() + 1)}.${now.getFullYear()}`; // 16.10.2026, as on the weekly report
  const month = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const iso = now.toISOString().slice(0, 10);
  return [
    { key: "weekly", label: "Weekly report", title: "INDIA COTTON: Weekly Report", dateLine: day, fileName: `Agrolytix India Cotton Weekly Report ${iso}`, contents: WEEKLY_CONTENTS, photos: coverPhotos },
    { key: "monthly", label: "Monthly report", title: "INDIA COTTON: Monthly Report", dateLine: month, fileName: `Agrolytix India Cotton Monthly Report ${iso.slice(0, 7)}`, contents: MONTHLY_CONTENTS, photos: coverPhotos },
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
        {/* page title and "data updated" are dashboard chrome — the PDF has its cover page instead */}
        <div className="print-hide">
          <div className="eyebrow">Agrolytix Research · India Cotton</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Market Overview
          </h1>
          <p className="num mt-1 text-[11px] text-ink-faint">
            {lastUpdated != null ? `Data updated ${timeAgo(lastUpdated)}` : "Live market data"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="print-hide">
            <GlobalPeriodTabs value={period} onChange={setPeriod} />
          </span>
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

      <ReportHeading sub="Domestic and global markets">Market Prices</ReportHeading>
      {/* the PDF report always carries the price table, never the chart — in chart view the table is
          kept hidden on screen and swapped in while the PDF is captured */}
      <div className={view === "table" ? undefined : "pdf-only"}>
        <PriceTable />
      </div>
      {view === "chart" ? (
        <div className="print-hide grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <HeroChart category={heroCat} period={period} onPeriodChange={setPeriod} />
          <div className="flex min-w-0 flex-col gap-3">
            <HeroCategoryRail value={heroCat} onChange={setHeroCat} period={period} />
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <CommentsPanel section="overview" title="Summary (Prices)" pdfTitle="Market review" minHeight={120} rows={5} autoWrite={() => autoCommentary("overview")} />
      </div>

      <OverviewSections />
    </div>
  );
}
