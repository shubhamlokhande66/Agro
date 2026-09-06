"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, ResultTile, btnPrimary } from "@/components/ui/Field";
import { VARIETIES } from "@/data/prices";
import { ICE_D_V } from "@/data/international";
import { inr } from "@/lib/format";

export default function BasisPage() {
  const gujLast = VARIETIES.find((v) => v.key === "guj29")?.daily?.at(-1);
  const iceLast = ICE_D_V.at(-1);

  const [ice, setIce] = useState(iceLast != null ? String(iceLast) : "");
  const [fx, setFx] = useState("93.88");
  const [dom, setDom] = useState(gujLast != null ? String(gujLast) : "");
  const [res, setRes] = useState<null | { iceInr: number; basis: number; pct: number }>(null);

  function calc() {
    const i = parseFloat(ice);
    const f = parseFloat(fx) || 93.88;
    const d = parseFloat(dom);
    if (!i || !d) return;
    const iceInr = (i / 100) * f * 785;
    const basis = d - iceInr;
    setRes({ iceInr, basis, pct: (basis / iceInr) * 100 });
  }

  return (
    <div>
      <PageHeader
        title="Cotton Basis"
        icon="≈"
        sub="Basis = domestic price − ICE futures (converted to ₹/Candy at 785 lbs/candy)"
      />
      <Card className="max-w-xl">
        <CardHeader title="Domestic vs ICE parity" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="ICE Price (¢/lb)" value={ice} onChange={setIce} step="0.01" />
          <Field label="USD/INR Rate" value={fx} onChange={setFx} step="0.1" />
          <Field label="Domestic (₹/Candy)" value={dom} onChange={setDom} />
        </div>
        <button type="button" onClick={calc} className={btnPrimary() + " mt-4"}>
          Calculate Basis
        </button>

        {res ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <ResultTile label="ICE in ₹/Candy" value={inr(res.iceInr)} />
              <ResultTile label="Domestic ₹/Candy" value={inr(parseFloat(dom))} />
              <ResultTile
                label="Basis"
                value={(res.basis >= 0 ? "+" : "") + inr(res.basis)}
                tone={res.basis >= 0 ? "green" : "red"}
              />
            </div>
            <div
              className={
                "rounded-xl p-3.5 text-[12.5px] leading-relaxed ring-1 " +
                (res.basis >= 0
                  ? "bg-pos-soft text-pos ring-pos/20"
                  : "bg-neg-soft text-neg ring-neg/20")
              }
            >
              {res.basis >= 0 ? (
                <>
                  <strong>Positive basis</strong> ({res.pct.toFixed(1)}%): domestic cotton at a
                  premium to ICE parity — Indian cotton is expensive vs global, watch for import
                  pressure.
                </>
              ) : (
                <>
                  <strong>Negative basis</strong> ({res.pct.toFixed(1)}%): domestic cotton at a
                  discount to ICE parity — Indian cotton is cheap vs global, favourable for
                  exporters.
                </>
              )}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
