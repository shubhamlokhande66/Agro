"use client";

import Link from "next/link";
import { Card, CardHeader, SectionLabel } from "@/components/ui/Card";
import { Kpi, KpiRow } from "@/components/ui/Kpi";
import { Delta } from "@/components/ui/ChangeBadge";
import Sparkline from "@/components/charts/Sparkline";
import AreaChart from "@/components/charts/AreaChart";
import { VARIETIES } from "@/data/prices";
import { ICE_D_L, ICE_D_V } from "@/data/international";
import { SND } from "@/data/balanceSheet";
import { DP_DATA } from "@/data/production";
import { IE } from "@/data/trade";
import { RF_COMPOSITE_T, RF_MONTHS_L, jjas } from "@/data/rainfall";
import { inr, inrCompact, num, pctChange, signedPct, todayStamp } from "@/lib/format";

export default function OverviewPage() {
  const guj29 = VARIETIES.find((v) => v.key === "guj29")!;
  const g = guj29.daily;
  const gLast = g.at(-1)!;
  const gDay = pctChange(gLast, g.at(-2) ?? null);
  const gMonth = pctChange(gLast, g[0]);

  const iceLast = ICE_D_V.at(-1)!;
  const iceDelta = pctChange(iceLast, ICE_D_V.at(-2) ?? null);

  const bsLatest = SND.annual_seasons[0];
  const bsPrev = SND.annual_seasons[1];
  const bs = SND.annual[bsLatest];
  const bsP = SND.annual[bsPrev];

  const prodSeason = DP_DATA.seasons.at(-2)!;
  const prodPrev = DP_DATA.seasons.at(-3)!;
  const prod = DP_DATA.prod[prodSeason].ALL_INDIA;
  const prodPrevV = DP_DATA.prod[prodPrev].ALL_INDIA;

  const impSeason = IE.actual_cutoff.season;
  const imp = IE.import_totals[impSeason];
  const impPrev = IE.import_totals[IE.seasons[IE.seasons.indexOf(impSeason) - 1]];

  const rfJjas = jjas(RF_COMPOSITE_T.y2025);
  const rfNormal = jjas(RF_COMPOSITE_T.normal);
  const rfDep = pctChange(rfJjas, rfNormal);

  const topVarieties = VARIETIES.filter((v) =>
    ["guj29", "mmak29", "phr28", "cs31"].includes(v.key),
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Agrolityx Research · India Cotton</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Market Overview
          </h1>
          <p className="num mt-1 text-[11px] text-ink-faint">Snapshot as of {todayStamp()}</p>
        </div>
        <Link
          href="/prices"
          className="focusable rounded-xl bg-accent px-4 py-2.5 text-[12.5px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong"
        >
          Open Prices →
        </Link>
      </div>

      {/* hero band */}
      <div className="panel overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.1fr_1.4fr] lg:items-center">
          <div>
            <div className="eyebrow">Gujarat Shankar-29 · Rajkot spot</div>
            <div className="mt-2 flex items-end gap-3">
              <span className="num text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                {inr(gLast)}
              </span>
              <span className="pb-1">
                <Delta value={gDay} />
              </span>
            </div>
            <div className="mt-1 text-[12px] text-ink-faint">
              per Candy · <span className="num">{signedPct(gMonth, 1)}</span> vs season open
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Mini label="MMAK-29" value={inr(VARIETIES.find((v) => v.key === "mmak29")!.daily.at(-1)!)} />
              <Mini label="ICE #2" value={iceLast.toFixed(2) + "¢"} delta={iceDelta} />
              <Mini label="Kapas" value={inr(VARIETIES.find((v) => v.key === "kapas")!.daily.at(-1)!) + "/qtl"} />
            </div>
          </div>
          <div className="rounded-2xl bg-surface-2/60 p-4">
            <div className="mb-1 text-[11px] font-medium text-ink-faint">
              ICE Cotton #2 — last 12 months (¢/lb)
            </div>
            <AreaChart
              labels={ICE_D_L}
              data={ICE_D_V}
              height={180}
              smartX={false}
              xTicks={6}
              yFmt={(v) => v + "¢"}
              tooltipLabel={(y) => y + "¢/lb"}
            />
          </div>
        </div>
      </div>

      <SectionLabel>Fundamentals at a glance</SectionLabel>
      <KpiRow>
        <Kpi
          label={`Crop · ${bsLatest}`}
          value={num(bs.crop_size, 1)}
          unit="lakh bales"
          foot={<Delta value={pctChange(bs.crop_size, bsP.crop_size)} />}
        />
        <Kpi
          label={`Production · ${prodSeason.split(" ")[0]}`}
          value={num(prod, 1)}
          unit="lakh bales"
          accent="blue"
          foot={<Delta value={pctChange(prod, prodPrevV)} />}
        />
        <Kpi
          label={`Imports · ${impSeason}`}
          value={num(imp, 1)}
          unit="lakh bales"
          accent="amber"
          foot={<Delta value={pctChange(imp, impPrev)} />}
        />
        <Kpi
          label="Monsoon (JJAS 2025)"
          value={signedPct(rfDep, 0)}
          unit="composite vs LPA normal"
          accent={rfDep != null && rfDep < 0 ? "red" : "green"}
          spark={RF_MONTHS_L.map((_, i) => RF_COMPOSITE_T.y2025[i])}
        />
      </KpiRow>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Key domestic varieties"
            sub="Last month of quotes · ₹ / Candy"
            right={
              <Link href="/prices" className="text-[11px] font-semibold text-accent hover:underline">
                All prices →
              </Link>
            }
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {topVarieties.map((v) => {
              const d = pctChange(v.daily.at(-1)!, v.daily[0]);
              return (
                <div
                  key={v.key}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-ink">{v.title}</div>
                    <div className="num text-[15px] font-semibold text-ink">
                      {inr(v.daily.at(-1)!)}
                    </div>
                  </div>
                  <div className="h-8 w-20 shrink-0">
                    <Sparkline data={v.daily} color={d != null && d < 0 ? "#e0605a" : undefined} />
                  </div>
                  <Delta value={d} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Balance sheet" sub={bsLatest} />
          <dl className="space-y-2.5 text-[12.5px]">
            {[
              ["Opening stocks", bs.opening_stocks],
              ["+ Crop", bs.crop_size],
              ["+ Imports", bs.imports],
              ["− Consumption", -bs.domestic_cons],
              ["− Exports", -bs.exports],
              ["= Closing stocks", bs.closing_stocks],
            ].map(([label, val], i, arr) => (
              <div
                key={label as string}
                className={
                  i === arr.length - 1
                    ? "flex justify-between border-t border-line pt-2.5 font-semibold"
                    : "flex justify-between"
                }
              >
                <dt className="text-ink-soft">{label}</dt>
                <dd className="num text-ink">{num(Math.abs(val as number), 1)}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/balance-sheet"
            className="mt-4 inline-flex text-[11px] font-semibold text-accent hover:underline"
          >
            Full balance sheet →
          </Link>
        </Card>
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number | null;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
      <div className="text-[9.5px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </div>
      <div className="num mt-1 text-[13px] font-semibold text-ink">{value}</div>
      {delta !== undefined ? (
        <div className="mt-0.5">
          <Delta value={delta ?? null} />
        </div>
      ) : null}
    </div>
  );
}
