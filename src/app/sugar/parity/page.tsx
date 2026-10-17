"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import LineChart from "@/components/charts/LineChart";
import { Figure, SampleBanner, fmt } from "@/components/sugar/ui";
import { S_MONTHS, S_MONTH_KEYS, sugarPrice, wsMonthAvg } from "@/data/sugar/sample";

/** export parity: what a mill earns at the factory gate exporting whites vs selling at home */
export default function SugarParity() {
  const [costs, setCosts] = useState({ freight: 35, port: 18, inland: 220, discount: 15 }); // $/t, $/t, ₹/qtl, $/t
  const ldn = sugarPrice("ldn5").values;
  const fx = sugarPrice("usdinr").values;
  // domestic: Mumbai wholesale M-30 (Chinimandi), monthly average, less 5% GST
  const dom = S_MONTH_KEYS.map((ym) => {
    const v = wsMonthAvg("mumbai", ym);
    return v == null ? null : Math.round(v / 1.05);
  });
  const lastDom = [...dom].reverse().find((v) => v != null) ?? null;
  // FOB India ≈ London No.5 − freight to destination − quality discount; per quintal = ÷10; minus port & inland costs
  const parity = ldn.map((w, i) => Math.round(((w - costs.freight - costs.discount - costs.port) * fx[i]) / 10 - costs.inland));
  const gap = lastDom != null ? lastDom - parity.at(-1)! : null;
  const field = (k: keyof typeof costs, label: string, unit: string) => (
    <label className="text-[12px]">
      <span className="mb-1 block font-semibold text-ink-soft">{label}</span>
      <span className="flex items-center gap-1.5">
        <input type="number" value={costs[k]} onChange={(e) => setCosts({ ...costs, [k]: Number(e.target.value) || 0 })} className="w-24 rounded-lg border border-line bg-surface px-2 py-1.5 text-[13px] text-ink" />
        <span className="text-ink-faint">{unit}</span>
      </span>
    </label>
  );
  return (
    <div>
      <PageHeader title="Export Parity" icon="≈" sub="London No.5 converted to an ex-mill price in India vs Mumbai wholesale (Chinimandi, less 5% GST) · ₹ per quintal" />
      <SampleBanner datasets={["sugarPrices", "sugarWholesale"]} source="London No.5, USD/INR, freight and port cost assumptions" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Figure label="Export parity (ex-mill)" value={fmt(parity.at(-1))} unit="₹/qtl" />
        <Figure label="Mumbai wholesale M-30 (ex-GST)" value={fmt(lastDom)} unit="₹/qtl" />
        <Figure label={gap == null ? "Domestic vs export" : gap > 0 ? "Domestic premium over export" : "Export premium over domestic"} value={gap == null ? "—" : fmt(Math.abs(gap))} unit="₹/qtl" note={gap == null ? undefined : gap > 0 ? "exports unviable" : "exports viable"} />
      </section>
      <Card>
        <CardHeader title="Cost assumptions" sub="Change any figure — the parity updates" />
        <div className="flex flex-wrap gap-5">
          {field("freight", "Ocean freight", "$/t")}
          {field("discount", "Quality / origin discount", "$/t")}
          {field("port", "Port & handling", "$/t")}
          {field("inland", "Mill → port transport", "₹/qtl")}
        </div>
      </Card>
      <Card className="mt-4">
        <CardHeader title="Export parity vs domestic price" sub="₹ per quintal, ex-mill" />
        <LineChart
          labels={S_MONTHS}
          height={300}
          legend
          series={[
            { label: "Export parity (London No.5)", data: parity, color: "#d97706", width: 2.5 },
            { label: "Mumbai wholesale M-30 (ex-GST, monthly avg)", data: dom, color: "#0f766e", width: 2.5, pointRadius: 3 },
          ]}
          yFmt={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`}
        />
      </Card>
    </div>
  );
}
