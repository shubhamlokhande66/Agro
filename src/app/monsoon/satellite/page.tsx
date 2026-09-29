"use client";

import { useEffect, useState } from "react";
import { ImdImage } from "@/components/monsoon/ImdImage";
import { PageTitle, PANEL, SegTabs } from "@/components/monsoon/ui";

const SAT = {
  ir: { label: "IR (Infrared)", path: "Satellite/3Dasiasec_ir1.jpg" },
  wv: { label: "Water Vapor", path: "Satellite/3Dasiasec_wv.jpg" },
  vis: { label: "Visible", path: "Satellite/3Dasiasec_vis.jpg" },
} as const;
type SatKey = keyof typeof SAT;

export default function SatellitePage() {
  const [tab, setTab] = useState<SatKey>("ir");
  const [stamp, setStamp] = useState(0);
  // re-fetch the latest image every 30 minutes
  useEffect(() => {
    setStamp(Date.now());
    const id = setInterval(() => setStamp(Date.now()), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const s = SAT[tab];
  return (
    <div className="max-w-5xl space-y-6">
      <PageTitle icon="◉" title="Satellite View" sub="Source: IMD INSAT-3D — mausam.imd.gov.in · auto-refreshes every 30 min" />
      <SegTabs
        tabs={Object.entries(SAT).map(([id, v]) => ({ id: id as SatKey, label: v.label }))}
        value={tab}
        onChange={(v) => {
          setTab(v);
          setStamp(Date.now());
        }}
      />
      <div className={PANEL + " p-4"}>
        {stamp ? (
          <ImdImage
            path={s.path}
            stamp={stamp}
            alt={`IMD satellite ${s.label}`}
            fallback="https://mausam.imd.gov.in/imd_latest/contents/satellite.php"
          />
        ) : null}
      </div>
      <a href="https://www.mosdac.gov.in" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 underline hover:text-emerald-300">
        More satellite products on MOSDAC →
      </a>
    </div>
  );
}
