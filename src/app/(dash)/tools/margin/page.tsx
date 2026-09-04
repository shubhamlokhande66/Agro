"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, ResultTile, btnPrimary } from "@/components/ui/Field";
import { inr } from "@/lib/format";

const BALE_TO_CANDY = 170 / 356;

export default function MarginPage() {
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [res, setRes] = useState<null | { gross: number; net: number; pct: number }>(null);

  function calc() {
    const b = parseFloat(buy) || 0;
    const s = parseFloat(sell) || 0;
    const q = parseFloat(qty) || 1;
    const c = parseFloat(cost) || 0;
    const gross = (s - b) * q * BALE_TO_CANDY;
    const net = (s - b - c) * q * BALE_TO_CANDY;
    const pct = b > 0 ? ((s - b - c) / b) * 100 : 0;
    setRes({ gross, net, pct });
  }

  return (
    <div>
      <PageHeader title="💰 Margin Calculator" />
      <Card className="max-w-xl">
        <CardHeader title="Calculate trading margin & profit" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Buy Price (₹/Candy)" value={buy} onChange={setBuy} placeholder="e.g. 54000" />
          <Field label="Sell Price (₹/Candy)" value={sell} onChange={setSell} placeholder="e.g. 56000" />
          <Field label="Quantity (Bales)" value={qty} onChange={setQty} placeholder="e.g. 100" />
          <Field label="Other Costs (₹/Candy)" value={cost} onChange={setCost} placeholder="e.g. 500" />
        </div>
        <button type="button" onClick={calc} className={btnPrimary() + " mt-4"}>
          Calculate Margin
        </button>
        {res ? (
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <ResultTile label="Gross Profit" value={inr(res.gross)} tone={res.gross >= 0 ? "green" : "red"} />
            <ResultTile label="Net Profit" value={inr(res.net)} tone={res.net >= 0 ? "green" : "red"} />
            <ResultTile label="Margin %" value={res.pct.toFixed(2) + "%"} tone={res.pct >= 0 ? "green" : "red"} />
          </div>
        ) : null}
        <p className="mt-3 text-[11px] italic text-ink-faint">
          1 Candy = 356 kg ≈ 2.09 bales. Profit is scaled from ₹/Candy to the bale quantity entered.
        </p>
      </Card>
    </div>
  );
}
