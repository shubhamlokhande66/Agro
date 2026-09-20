"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Tabs } from "@/components/ui/Tabs";
import { Field, ResultTile, btnPrimary } from "@/components/ui/Field";
import AreaChart from "@/components/charts/AreaChart";
import { inr } from "@/lib/format";
import { sliceByDays, deltaOverPeriod, type GlobalPeriod } from "@/lib/period";
import { GlobalPeriodTabs } from "@/components/ui/GlobalPeriodTabs";
import * as FX from "@/data/currency";

/** the doc's exact "chart-specific" filter set — per chart, independent of the page-level
 *  global filter above it */
type P = "weekly" | "monthly" | "3m" | "6m" | "1y" | "5y";
const PERIODS: { value: P; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "5y", label: "5Y" },
];
const PERIOD_DAYS: Record<P, number> = { weekly: 7, monthly: 31, "3m": 91, "6m": 186, "1y": 366, "5y": 366 * 5 };

function pick(pair: "inr" | "cny", p: P) {
  // 1Y/5Y read straight from the longer series; weekly/monthly/3M/6M window the 1Y series
  const oneY = pair === "inr" ? { l: FX.USDINR_1Y_L, v: FX.USDINR_1Y_V } : { l: FX.USDCNY_1Y_L, v: FX.USDCNY_1Y_V };
  const fiveY = pair === "inr" ? { l: FX.USDINR_5Y_L, v: FX.USDINR_5Y_V } : { l: FX.USDCNY_5Y_L, v: FX.USDCNY_5Y_V };
  if (p === "5y") return fiveY;
  if (p === "1y") return oneY;
  const sliced = sliceByDays(oneY.l, oneY.v, PERIOD_DAYS[p]);
  return { l: sliced.labels, v: sliced.values };
}

export default function CurrencyPage() {
  const [rate, setRate] = useState("93.88");
  const [ice, setIce] = useState("");
  const [res, setRes] = useState<null | { candy: number; kg: number }>(null);
  const [inrP, setInrP] = useState<P>("6m");
  const [cnyP, setCnyP] = useState<P>("6m");
  const [period, setPeriod] = useState<GlobalPeriod>("6m");

  function convert() {
    const r = parseFloat(rate) || 93.88;
    const c = parseFloat(ice);
    if (!c) return;
    setRes({
      candy: (c / 100) * r * 785,
      kg: (c / 100) * r * 2.20462,
    });
  }

  const inrD = pick("inr", inrP);
  const cnyD = pick("cny", cnyP);

  const inrPeriodDelta = deltaOverPeriod(FX.USDINR_5Y_L, FX.USDINR_5Y_V, period).pct;
  const cnyPeriodDelta = deltaOverPeriod(FX.USDCNY_5Y_L, FX.USDCNY_5Y_V, period).pct;

  return (
    <div>
      <PageHeader
        title="Currency"
        icon="$"
        dataset="currency"
        right={<GlobalPeriodTabs value={period} onChange={setPeriod} />}
      />

      <KpiRow>
        <Kpi
          label={`USD/INR · ${period.toUpperCase()} change`}
          value={FX.USDINR_M_V.at(-1) != null ? "₹" + FX.USDINR_M_V.at(-1)!.toFixed(2) : "—"}
          unit={inrPeriodDelta != null ? (inrPeriodDelta >= 0 ? "+" : "") + inrPeriodDelta.toFixed(2) + "%" : undefined}
          accent={inrPeriodDelta != null && inrPeriodDelta < 0 ? "green" : "red"}
        />
        <Kpi
          label={`USD/CNY · ${period.toUpperCase()} change`}
          value={FX.USDCNY_M_V.at(-1) != null ? "¥" + FX.USDCNY_M_V.at(-1)!.toFixed(2) : "—"}
          unit={cnyPeriodDelta != null ? (cnyPeriodDelta >= 0 ? "+" : "") + cnyPeriodDelta.toFixed(2) + "%" : undefined}
          accent="blue"
        />
      </KpiRow>

      <Card className="mt-5 max-w-lg">
        <CardHeader title="USD ↔ INR · ICE price converter" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="USD/INR Rate" value={rate} onChange={setRate} step="0.1" />
          <Field label="ICE Price (¢/lb)" value={ice} onChange={setIce} placeholder="e.g. 67.50" step="0.01" />
        </div>
        <button type="button" onClick={convert} className={btnPrimary() + " mt-4"}>
          Convert
        </button>
        {res ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <ResultTile label="ICE in ₹/Candy" value={inr(res.candy)} tone="green" />
              <ResultTile label="ICE in ₹/Kg" value={"₹" + res.kg.toFixed(2)} tone="blue" />
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-faint">
              {ice}¢/lb × {rate} USD/INR × 785 lbs/Candy = {inr(res.candy)}/Candy
            </p>
          </>
        ) : null}
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="USD / INR rate"
            right={<Tabs options={PERIODS} value={inrP} onChange={setInrP} />}
          />
          <AreaChart
            labels={inrD.l}
            data={inrD.v}
            color="#2563eb"
            height={200}
            yFmt={(v) => "₹" + v.toFixed(0)}
            tooltipLabel={(y) => "₹" + y.toFixed(2)}
          />
          <p className="mt-2 text-[11px] italic text-ink-faint">
            Source: x-rates.com / RBI-FBIL reference rates. Rupee near all-time weak ₹93.88
            (Mar 2026) — costlier imports lift domestic cotton in ₹ terms.
          </p>
        </Card>

        <Card>
          <CardHeader
            title="USD / CNY (Chinese Yuan)"
            right={<Tabs options={PERIODS} value={cnyP} onChange={setCnyP} />}
          />
          <AreaChart
            labels={cnyD.l}
            data={cnyD.v}
            color="#f59e0b"
            height={200}
            yFmt={(v) => "¥" + v.toFixed(1)}
            tooltipLabel={(y) => "¥" + y.toFixed(2)}
          />
          <p className="mt-2 text-[11px] italic text-ink-faint">
            Source: FRED (EXCHUS). Yuan strengthened ¥7.30 → ¥6.89 over the past year —
            stronger yuan supports Chinese mill buying of global cotton.
          </p>
        </Card>
      </div>
    </div>
  );
}
