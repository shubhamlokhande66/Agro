"use client";

import { useState } from "react";
import { ImdImage } from "@/components/monsoon/ImdImage";
import { PageTitle, PANEL, SegTabs } from "@/components/monsoon/ui";

const MAPS = {
  seasonal: {
    label: "Seasonal (subdivision)",
    path: "Rainfall/SUBDIVISION_RAINFALL_MAP_COUNTRY_INDIA_c.JPG",
    caption: "Subdivision-wise cumulative rainfall departure since 1 June (% of normal)",
  },
  district: {
    label: "Seasonal (district)",
    path: "Rainfall/DISTRICT_RAINFALL_MAP_COUNTRY_INDIA_c.JPG",
    caption: "District-wise cumulative rainfall departure since 1 June",
  },
  weekly: {
    label: "Weekly (subdivision)",
    path: "Rainfall/SUBDIVISION_RAINFALL_MAP_COUNTRY_INDIA_w.JPG",
    caption: "Subdivision-wise rainfall departure for the latest week",
  },
  weeklyDistrict: {
    label: "Weekly (district)",
    path: "Rainfall/DISTRICT_RAINFALL_MAP_COUNTRY_INDIA_w.JPG",
    caption: "District-wise rainfall departure for the latest week",
  },
  daily: {
    label: "Daily (district)",
    path: "Rainfall/DISTRICT_RAINFALL_MAP_COUNTRY_INDIA_d.JPG",
    caption: "District-wise rainfall for the latest day",
  },
} as const;
type MapKey = keyof typeof MAPS;

export default function CumulativeMapPage() {
  const [tab, setTab] = useState<MapKey>("seasonal");
  const m = MAPS[tab];
  return (
    <div className="max-w-5xl space-y-6">
      <PageTitle icon="▧" title="Cumulative Rainfall Maps" sub="Source: IMD Hydromet Division — mausam.imd.gov.in (official rainfall maps)" />
      <SegTabs tabs={Object.entries(MAPS).map(([id, v]) => ({ id: id as MapKey, label: v.label }))} value={tab} onChange={setTab} />
      <div className={PANEL + " p-4"}>
        <ImdImage path={m.path} alt={m.caption} fallback="https://mausam.imd.gov.in/responsive/rainfallinformation.php" />
        <p className="mt-3 text-center text-xs text-slate-500">{m.caption}</p>
      </div>
      <div className="flex gap-4">
        <a href="https://mausam.imd.gov.in/responsive/rainfallinformation.php" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 underline hover:text-emerald-300">
          IMD Rainfall Information →
        </a>
      </div>
    </div>
  );
}
