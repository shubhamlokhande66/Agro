"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Figure, fmt } from "@/components/sugar/ui";

type Inputs = {
  cane: number; // ₹/qtl cane
  recovery: number; // % sugar from cane
  sugarPrice: number; // ₹/qtl sugar ex-mill
  molassesYield: number; // % of cane
  molassesPrice: number; // ₹/t
  bagasseSurplus: number; // % of cane sold
  bagassePrice: number; // ₹/t
  conversion: number; // ₹ per qtl of sugar
  harvest: number; // ₹/t cane, if paid by the mill
};

const DEFAULTS: Inputs = { cane: 355, recovery: 10.25, sugarPrice: 3900, molassesYield: 4.5, molassesPrice: 9800, bagasseSurplus: 6, bagassePrice: 1800, conversion: 650, harvest: 0 };

/** a sugar mill's margin per tonne of cane crushed — enter your own numbers */
export default function MillMargin() {
  const [x, setX] = useState<Inputs>(DEFAULTS);
  const sugarQtl = x.recovery / 10; // quintals of sugar per tonne of cane
  const rev = { sugar: sugarQtl * x.sugarPrice, molasses: (x.molassesYield / 100) * x.molassesPrice, bagasse: (x.bagasseSurplus / 100) * x.bagassePrice };
  const revenue = rev.sugar + rev.molasses + rev.bagasse;
  const cost = { cane: x.cane * 10, harvest: x.harvest, conversion: sugarQtl * x.conversion };
  const costs = cost.cane + cost.harvest + cost.conversion;
  const margin = revenue - costs;
  const breakEven = (costs - rev.molasses - rev.bagasse) / sugarQtl;

  const field = (k: keyof Inputs, label: string, unit: string, step = 1) => (
    <label className="text-[12px]">
      <span className="mb-1 block font-semibold text-ink-soft">{label}</span>
      <span className="flex items-center gap-1.5">
        <input type="number" step={step} value={x[k]} onChange={(e) => setX({ ...x, [k]: Number(e.target.value) || 0 })} className="w-28 rounded-lg border border-line bg-surface px-2 py-1.5 text-[13px] text-ink" />
        <span className="text-ink-faint">{unit}</span>
      </span>
    </label>
  );
  const line = (label: string, v: number, strong?: boolean) => (
    <div className={"flex justify-between border-t border-line py-1.5 text-[13px] " + (strong ? "font-semibold text-ink" : "text-ink-soft")}>
      <span>{label}</span>
      <span className="num">₹{fmt(v)}</span>
    </div>
  );

  return (
    <div>
      <PageHeader title="Mill Margin Calculator" icon="∑" sub="Sugar mill economics per tonne of cane crushed · change any input" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label="Margin per tonne of cane" value={`₹${fmt(margin)}`} note={margin >= 0 ? "profit" : "loss"} />
        <Figure label="Margin per quintal of sugar" value={`₹${fmt(margin / sugarQtl)}`} />
        <Figure label="Break-even sugar price" value={`₹${fmt(breakEven)}`} unit="/ qtl" />
        <Figure label="Sugar made per tonne of cane" value={`${fmt(sugarQtl * 100, 1)} kg`} />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Inputs" sub="Defaults are illustrative — enter your own" />
          <div className="grid grid-cols-2 gap-4">
            {field("cane", "Cane price (FRP / SAP)", "₹/qtl")}
            {field("recovery", "Sugar recovery", "%", 0.05)}
            {field("sugarPrice", "Sugar price ex-mill", "₹/qtl")}
            {field("conversion", "Conversion cost", "₹/qtl sugar")}
            {field("molassesYield", "Molasses yield", "% of cane", 0.1)}
            {field("molassesPrice", "Molasses price", "₹/t")}
            {field("bagasseSurplus", "Surplus bagasse sold", "% of cane", 0.5)}
            {field("bagassePrice", "Bagasse price", "₹/t")}
            {field("harvest", "Harvest & transport (mill-paid)", "₹/t cane")}
          </div>
          <button type="button" onClick={() => setX(DEFAULTS)} className="mt-4 text-[12px] font-semibold text-accent">Reset to defaults</button>
        </Card>
        <Card>
          <CardHeader title="Per tonne of cane" />
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Revenue</div>
          {line(`Sugar (${fmt(sugarQtl, 3)} qtl)`, rev.sugar)}
          {line("Molasses", rev.molasses)}
          {line("Bagasse", rev.bagasse)}
          {line("Total revenue", revenue, true)}
          <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Costs</div>
          {line("Cane", cost.cane)}
          {cost.harvest ? line("Harvest & transport", cost.harvest) : null}
          {line("Conversion", cost.conversion)}
          {line("Total cost", costs, true)}
          <div className={"mt-3 flex justify-between rounded-lg px-3 py-2 text-[14px] font-bold " + (margin >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
            <span>Margin</span>
            <span className="num">₹{fmt(margin)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
