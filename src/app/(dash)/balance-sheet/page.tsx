"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Delta } from "@/components/ui/ChangeBadge";
import LineChart from "@/components/charts/LineChart";
import { SND } from "@/data/balanceSheet";
import { DataMissing } from "@/components/ui/DataGuard";
import { CommentsPanel } from "@/components/ui/CommentsPanel";
import { BalanceSheetTabs } from "@/components/sections/BalanceSheetTabs";
import { num, pctChange, inr, signedPct } from "@/lib/format";
import { ICE_D_V } from "@/data/international";
import { USDINR_LATEST } from "@/data/currency";
import { VARIETIES, latestDaily } from "@/data/prices";
import { landedCostPerCandy, IMPORT_DUTY_PCT } from "@/data/importParity";

export default function BalanceSheetPage() {
  // newest first by starting year
  const annualSeasons = [...(SND.annual_seasons ?? [])].sort((x, y) => parseInt(y, 10) - parseInt(x, 10));

  if (!annualSeasons.length || !SND.annual?.[annualSeasons[0]]) {
    return <DataMissing title="Cotton Balance Sheet" icon="⚖" dataset="balanceSheet" />;
  }

  const chrono = [...annualSeasons].reverse();
  const latest = annualSeasons[0];
  const prev = annualSeasons[1];
  const a = SND.annual[latest];
  const p = SND.annual[prev] ?? a;
  const stu = a.total_demand ? (a.closing_stocks / a.total_demand) * 100 : 0;

  const icePrice = ICE_D_V.at(-1) ?? null;
  const usdInr = USDINR_LATEST;
  const landed = icePrice != null && usdInr != null ? landedCostPerCandy(icePrice, usdInr) : null;
  const guj29 = VARIETIES.find((v) => v.key === "guj29");
  const domesticPrice = guj29 ? (latestDaily(guj29)?.price ?? null) : null;
  const parityGap = landed != null && domesticPrice != null ? domesticPrice - landed : null;
  const parityGapPct = pctChange(domesticPrice, landed);

  return (
    <div>
      <PageHeader
        title="Cotton Balance Sheet" icon="⚖"
        sub="India supply & demand · lakh bales · Source: CAB / trade estimates"
        dataset="balanceSheet"
      />

      <KpiRow>
        <Kpi label={`Crop · ${latest}`} value={num(a.crop_size, 1)} unit="lakh bales"
          foot={<Delta value={pctChange(a.crop_size, p.crop_size)} />} />
        <Kpi label={`Imports · ${latest}`} value={num(a.imports, 1)} unit="lakh bales" accent="blue"
          foot={<Delta value={pctChange(a.imports, p.imports)} />} />
        <Kpi label={`Closing stocks · ${latest}`} value={num(a.closing_stocks, 1)} unit="lakh bales"
          accent={a.closing_stocks < 0 ? "red" : "amber"} />
        <Kpi label="Stocks-to-use" value={stu.toFixed(1) + "%"} accent="violet" />
      </KpiRow>

      <div className="mt-4 space-y-3.5">
        <BalanceSheetTabs />
        <Card>
          <CardHeader title="Crop, consumption & closing stocks (lakh bales)" />
          <LineChart
            labels={chrono}
            series={[
              { label: "Crop size", data: chrono.map((s) => SND.annual[s]?.crop_size ?? null), color: "#0d9e77", width: 2 },
              { label: "Total demand", data: chrono.map((s) => SND.annual[s]?.total_demand ?? null), color: "#2563eb", width: 2 },
              { label: "Closing stocks", data: chrono.map((s) => SND.annual[s]?.closing_stocks ?? null), color: "#f59e0b", width: 2, dashed: true },
            ]}
            smartX={false}
            height={260}
          />
        </Card>
      </div>

      <div className="mt-3.5">
        <Card>
          <CardHeader
            title="Import parity"
            sub="Landed cost of imported cotton (ICE × USD/INR × duty + freight) vs Gujarat Shankar-29 domestic · ₹ / Candy"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="ICE Cotton #2" value={icePrice != null ? icePrice.toFixed(2) : "—"} unit="¢/lb" />
            <Kpi label="USD/INR" value={usdInr != null ? usdInr.toFixed(2) : "—"} unit="₹" accent="blue" />
            <Kpi label={`Landed cost · ${IMPORT_DUTY_PCT}% duty`} value={landed != null ? num(landed, 0) : "—"} unit="₹/candy" accent="amber" />
            <Kpi
              label="Domestic vs landed"
              value={parityGapPct != null ? signedPct(parityGapPct, 1) : "—"}
              unit={parityGap != null ? `₹${num(Math.abs(parityGap), 0)}/candy ${parityGap >= 0 ? "premium" : "discount"}` : undefined}
              accent={parityGap != null && parityGap < 0 ? "green" : "red"}
            />
          </div>
          <p className="mt-3 text-[11px] italic text-ink-faint">
            Domestic latest: {inr(domesticPrice)} / candy. Duty, freight & insurance are admin-editable
            under Import Parity.
          </p>
        </Card>
      </div>

      <div className="mt-3.5">
        <CommentsPanel section="balanceSheet" />
      </div>
    </div>
  );
}
