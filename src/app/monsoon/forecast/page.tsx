"use client";

import { useState } from "react";
import { PageTitle, PANEL, SegTabs } from "@/components/monsoon/ui";

const TABS = [
  { id: "rain-ecmwf", label: "Rainfall (ECMWF)", overlay: "rain", product: "ecmwf" },
  { id: "rain-gfs", label: "Rainfall (GFS)", overlay: "rain", product: "gfs" },
  { id: "temp", label: "Temperature", overlay: "temp", product: "ecmwf" },
  { id: "wind", label: "Wind", overlay: "wind", product: "ecmwf" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function ForecastPage() {
  const [tab, setTab] = useState<TabId>("rain-ecmwf");
  const t = TABS.find((x) => x.id === tab) ?? TABS[0];
  const src =
    `https://embed.windy.com/embed2.html?lat=22&lon=80&detailLat=22&detailLon=80&width=100%25&height=600&zoom=5&level=surface` +
    `&overlay=${t.overlay}&product=${t.product}&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates` +
    `&detail=&metricWind=default&metricTemp=default&radarRange=-1`;
  return (
    <div className="max-w-6xl space-y-6">
      <PageTitle icon="≋" title="Forecast Maps" sub="Forecast data from Windy.com (ECMWF & GFS models)" />
      <SegTabs tabs={TABS.map((x) => ({ id: x.id, label: x.label }))} value={tab} onChange={setTab} />
      <div className={PANEL + " overflow-hidden"}>
        <iframe key={tab} src={src} width="100%" height="600" className="border-0" title={`Windy ${t.label}`} allow="fullscreen" />
      </div>
    </div>
  );
}
