"use client";

import Link from "next/link";
import { timeAgo } from "@/lib/format";
import { HeroChart, type HeroCategory } from "@/components/overview/HeroChart";
import { HeroCategoryRail } from "@/components/overview/HeroCategoryRail";
import { OverviewSections } from "@/components/overview/OverviewSections";
import { CommentsPanel } from "@/components/ui/CommentsPanel";
import { GlobalPeriodTabs } from "@/components/ui/GlobalPeriodTabs";
import { type GlobalPeriod } from "@/lib/period";
import { useDatasetMeta } from "@/lib/meta/context";
import { useState } from "react";

const OVERVIEW_DATASETS = ["prices", "international", "balanceSheet", "production", "trade", "rainfall", "sowing"];

export default function OverviewPage() {
  const { meta } = useDatasetMeta();
  const lastUpdated = OVERVIEW_DATASETS.map((k) => meta[k]?.updatedAt)
    .filter((t): t is number => t != null)
    .sort((a, b) => b - a)[0];

  const [period, setPeriod] = useState<GlobalPeriod>("6m");
  const [heroCat, setHeroCat] = useState<HeroCategory>("domestic");

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
          <Link
            href="/prices"
            className="focusable rounded-xl bg-accent px-4 py-2.5 text-[12.5px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong"
          >
            Open Prices →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <HeroChart category={heroCat} period={period} onPeriodChange={setPeriod} />
        <div className="flex min-w-0 flex-col gap-3">
          <HeroCategoryRail value={heroCat} onChange={setHeroCat} period={period} />
          <CommentsPanel section="overview" minHeight={120} rows={5} />
        </div>
      </div>

      <OverviewSections />
    </div>
  );
}
