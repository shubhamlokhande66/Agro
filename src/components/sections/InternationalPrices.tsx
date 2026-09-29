"use client";

import { SectionLabel } from "@/components/ui/Card";
import { IntlPriceCard } from "@/components/sections/IntlPriceCard";
import { type GlobalPeriod } from "@/lib/period";
import * as D from "@/data/international";

export function InternationalPrices({ globalPeriod }: { globalPeriod?: GlobalPeriod }) {
  return (
    <div>
      <SectionLabel>Futures · Daily settlements (ICE, synced daily)</SectionLabel>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <IntlPriceCard
          title="ICE Cotton No. 2"
          sub="Most-active contract · ¢ / lb"
          daily={{ l: D.ICE_D_L, v: D.ICE_D_V }}
          monthly={{ l: D.ICE_M_L, v: D.ICE_M_V }}
          annual={{ l: D.ICE_ANN_L, v: D.ICE_ANN_V }}
          fmt={(v) => v.toFixed(2) + "¢"}
          globalPeriod={globalPeriod}
        />
        <IntlPriceCard
          title="Brent Crude Oil"
          sub="ICE Brent, most-active contract · $ / bbl"
          daily={{ l: D.BR_D_L, v: D.BR_D_V }}
          monthly={{ l: D.BR_M_L, v: D.BR_M_V }}
          annual={{ l: D.BR_ANN_L, v: D.BR_ANN_V }}
          fmt={(v) => "$" + v.toFixed(2)}
          color="#f59e0b"
          globalPeriod={globalPeriod}
        />
      </div>
      <p className="mt-2 text-[11px] italic text-ink-faint">
        Monthly / 1Y: daily settlements. 3Y: monthly averages (ICE from Oct 2024, Macrotrends before).
        All: annual averages (cotton from 1969, Brent from 1987).
      </p>
    </div>
  );
}
