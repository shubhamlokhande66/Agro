"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, ResultTile, btnPrimary } from "@/components/ui/Field";
import { inr } from "@/lib/format";

export default function BreakEvenPage() {
  const [f, setF] = useState({
    buy: "",
    transport: "",
    interest: "",
    months: "",
    other: "",
    margin: "",
  });
  const [res, setRes] = useState<null | { total: number; target: number }>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  function calc() {
    const buy = parseFloat(f.buy) || 0;
    const transport = parseFloat(f.transport) || 0;
    const interest = parseFloat(f.interest) || 0;
    const months = parseFloat(f.months) || 0;
    const other = parseFloat(f.other) || 0;
    const margin = parseFloat(f.margin) || 0;
    const intCost = buy * (interest / 100) * (months / 12);
    const total = buy + transport + intCost + other;
    setRes({ total, target: total * (1 + margin / 100) });
  }

  return (
    <div>
      <PageHeader title="⚖️ Break-Even Calculator" />
      <Card className="max-w-xl">
        <CardHeader title="Find your break-even selling price" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Purchase Price (₹/Candy)" value={f.buy} onChange={set("buy")} placeholder="e.g. 54000" />
          <Field label="Transport (₹/Candy)" value={f.transport} onChange={set("transport")} placeholder="e.g. 200" />
          <Field label="Interest % (annual)" value={f.interest} onChange={set("interest")} placeholder="e.g. 12" step="0.1" />
          <Field label="Holding (months)" value={f.months} onChange={set("months")} placeholder="e.g. 3" />
          <Field label="Ginning / Other (₹/Candy)" value={f.other} onChange={set("other")} placeholder="e.g. 300" />
          <Field label="Target Margin %" value={f.margin} onChange={set("margin")} placeholder="e.g. 5" step="0.1" />
        </div>
        <button type="button" onClick={calc} className={btnPrimary() + " mt-4"}>
          Calculate Break Even
        </button>
        {res ? (
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <ResultTile label="Total Cost" value={inr(res.total)} tone="amber" />
            <ResultTile label="Break-Even Price" value={inr(res.total)} tone="red" />
            <ResultTile label="Target Sell Price" value={inr(res.target)} tone="green" />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
