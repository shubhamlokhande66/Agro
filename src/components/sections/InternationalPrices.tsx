"use client";

import { useState } from "react";
import { Card, CardHeader, SectionLabel } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import AreaChart from "@/components/charts/AreaChart";
import ComboChart from "@/components/charts/ComboChart";
import { cents, usd } from "@/lib/format";
import * as D from "@/data/international";

export function InternationalPrices() {
  const [corr, setCorr] = useState<"2010" | "all">("2010");
  const [ice, setIce] = useState<"all" | "2010" | "1yr">("1yr");
  const [brent, setBrent] = useState<"all" | "2010">("2010");

  const corrLabels = corr === "2010" ? D.ICE_M_L : D.BR_ANN_L;
  const corrIce =
    corr === "2010"
      ? D.ICE_M_V
      : D.ICE_ANN_V.slice(D.ICE_ANN_L.indexOf("1987"));
  const corrBr = corr === "2010" ? D.BR_M_V : D.BR_ANN_V;

  const iceSet =
    ice === "all"
      ? { l: D.ICE_ANN_L, v: D.ICE_ANN_V, x: 10, note: "Annual average 1969–2026. Peak 133¢ (2011), 2022 rally to 112¢. Source: Macrotrends." }
      : ice === "2010"
        ? { l: D.ICE_M_L, v: D.ICE_M_V, x: 14, note: "Monthly Jan 2010 – Mar 2026. Source: Macrotrends." }
        : { l: D.ICE_D_L, v: D.ICE_D_V, x: 12, note: "Daily Mar 2025 – Mar 2026. Peak 74¢ (May 2025), trough 56.81¢ (Aug 2025)." };

  const brSet =
    brent === "all"
      ? { l: D.BR_ANN_L, v: D.BR_ANN_V, x: 10, note: "Annual 1987–2026. All-time high $138 (Jun 2008). Mar 2026: ~$101." }
      : { l: D.BR_M_L, v: D.BR_M_V, x: 14, note: "Monthly Brent 2010–2026. COVID low $14 (Apr 2020), Ukraine spike $126 (Mar 2022)." };

  return (
    <div>
      <SectionLabel>ICE Cotton vs Brent Crude — Correlation</SectionLabel>
      <Card>
        <CardHeader
          title="ICE cotton (¢/lb) vs Brent crude ($/bbl)"
          right={
            <Tabs
              options={[
                { value: "2010", label: "2010–2026" },
                { value: "all", label: "Full history" },
              ]}
              value={corr}
              onChange={setCorr}
            />
          }
        />
        <ComboChart
          labels={corrLabels}
          left={{ label: "ICE cotton ¢/lb", data: corrIce, color: "#0d9e77", fmt: cents }}
          right={{ label: "Brent crude $/bbl", data: corrBr, color: "#f59e0b", fmt: usd }}
          height={230}
          xTicks={corr === "2010" ? 14 : 10}
        />
        <p className="mt-2 text-[11px] italic text-ink-faint">
          {corr === "2010"
            ? "Monthly 2010–2026. 2011 supercycle, 2020 COVID crash, 2022 Russia–Ukraine spike. Higher energy lifts synthetic-fibre costs — bullish for cotton."
            : "Annual 1987–2026. Higher energy = higher synthetic costs = cotton premium. Both peaked in 2011 and 2022."}
        </p>
      </Card>

      <SectionLabel>ICE Cotton #2 Futures</SectionLabel>
      <Card>
        <CardHeader
          title="ICE cotton price (¢/lb)"
          right={
            <Tabs
              options={[
                { value: "all", label: "1969–2026" },
                { value: "2010", label: "2010–2026" },
                { value: "1yr", label: "Last 1 yr" },
              ]}
              value={ice}
              onChange={setIce}
            />
          }
        />
        <AreaChart
          labels={iceSet.l}
          data={iceSet.v}
          height={210}
          yFmt={cents}
          xTicks={iceSet.x}
          smartX={ice === "2010"}
          tooltipLabel={(y) => y + "¢/lb"}
        />
        <p className="mt-2 text-[11px] italic text-ink-faint">{iceSet.note}</p>
      </Card>

      <SectionLabel>Brent Crude Oil</SectionLabel>
      <Card>
        <CardHeader
          title="Brent crude ($/barrel)"
          right={
            <Tabs
              options={[
                { value: "all", label: "1987–2026" },
                { value: "2010", label: "2010–2026" },
              ]}
              value={brent}
              onChange={setBrent}
            />
          }
        />
        <AreaChart
          labels={brSet.l}
          data={brSet.v}
          color="#f59e0b"
          height={190}
          yFmt={usd}
          xTicks={brSet.x}
          smartX={brent === "2010"}
          tooltipLabel={(y) => "$" + y + "/bbl"}
        />
        <p className="mt-2 text-[11px] italic text-ink-faint">{brSet.note}</p>
      </Card>
    </div>
  );
}
