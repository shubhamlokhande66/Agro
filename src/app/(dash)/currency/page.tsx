"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Field, ResultTile, btnPrimary } from "@/components/ui/Field";
import AreaChart from "@/components/charts/AreaChart";
import { inr } from "@/lib/format";
import * as FX from "@/data/currency";

type P = "5yr" | "1yr" | "all";
const PERIODS = [
  { value: "5yr" as const, label: "5 Year" },
  { value: "1yr" as const, label: "1 Year" },
  { value: "all" as const, label: "Since 2020" },
];

function pick(pair: "inr" | "cny", p: P) {
  if (pair === "inr") {
    return p === "1yr"
      ? { l: FX.USDINR_1Y_L, v: FX.USDINR_1Y_V }
      : p === "5yr"
        ? { l: FX.USDINR_5Y_L, v: FX.USDINR_5Y_V }
        : { l: FX.USDINR_M_L, v: FX.USDINR_M_V };
  }
  return p === "1yr"
    ? { l: FX.USDCNY_1Y_L, v: FX.USDCNY_1Y_V }
    : p === "5yr"
      ? { l: FX.USDCNY_5Y_L, v: FX.USDCNY_5Y_V }
      : { l: FX.USDCNY_M_L, v: FX.USDCNY_M_V };
}

export default function CurrencyPage() {
  const [rate, setRate] = useState("93.88");
  const [ice, setIce] = useState("");
  const [res, setRes] = useState<null | { candy: number; kg: number }>(null);
  const [inrP, setInrP] = useState<P>("5yr");
  const [cnyP, setCnyP] = useState<P>("5yr");

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

  return (
    <div>
      <PageHeader title="💱 Currency" />

      <Card className="max-w-lg">
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
