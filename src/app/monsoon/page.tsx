"use client";

import { DEFAULT_EXCLUSIONS, NINO_THRESHOLDS } from "@/lib/monsoon/constants";
import { commodityWeighted, rainfallSummary } from "@/lib/monsoon/metrics";
import { riskBullets, type RiskSeverity } from "@/lib/monsoon/risk";
import { isoDate, monthLabel, useMonsoon } from "@/components/monsoon/data";
import { Loaded, PageTitle, PANEL, RefreshButton, signed } from "@/components/monsoon/ui";

const TONE: Record<string, string> = {
  emerald: "text-emerald-400 bg-emerald-500/10",
  red: "text-red-400 bg-red-500/10",
  amber: "text-amber-400 bg-amber-500/10",
  slate: "text-slate-400 bg-slate-500/10",
};
const SEVERITY: Record<RiskSeverity, string> = {
  positive: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  neutral: "border-slate-500/30 bg-slate-500/5 text-slate-300",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  danger: "border-red-500/30 bg-red-500/5 text-red-400",
};

function KpiCard({ icon, title, value, sub, tone }: { icon: string; title: string; value: string; sub: string; tone: keyof typeof TONE }) {
  const [text] = TONE[tone].split(" ");
  return (
    <div className={PANEL + " p-5 transition-colors hover:border-slate-600/50"}>
      <div className="mb-3 flex items-center gap-2">
        <span className={"rounded-lg p-1.5 text-base " + TONE[tone]} aria-hidden>{icon}</span>
        <span className="text-xs font-medium text-slate-400">{title}</span>
      </div>
      <p className={"font-mono text-2xl font-bold " + text}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

const rainTone = (v: number | null) => (v == null ? "slate" : v >= -5 ? "emerald" : v >= -20 ? "amber" : "red");

function Summary() {
  const { data } = useMonsoon();
  const subs = data?.imd?.subdivisions ?? [];
  const nino = data?.enso?.nino.latest ?? null;
  const iod = data?.enso?.iod.latest ?? null;
  const { allIndia, central, deficientCount, deficientNames } = rainfallSummary(subs);
  const byCrop = Object.fromEntries(commodityWeighted(subs, DEFAULT_EXCLUSIONS).map((c) => [c.commodity, c.weightedDeparture]));

  const ninoStatus = nino == null ? "Unknown" : nino.value >= NINO_THRESHOLDS.EL_NINO ? "El Niño" : nino.value <= NINO_THRESHOLDS.LA_NINA ? "La Niña" : "Neutral";
  const iodPhase = iod == null ? "Unknown" : iod.value > 0.4 ? "Positive" : iod.value < -0.4 ? "Negative" : "Neutral";

  const bullets = riskBullets({
    nino34: nino?.value ?? null,
    iod: iod?.value ?? null,
    allIndia,
    central,
    cotton: byCrop.Cotton ?? null,
    soybean: byCrop.Soybean ?? null,
    deficientCount,
    deficientNames,
  });

  // month-on-month change of the ocean indices
  const prev = (series: { value: number }[] | undefined) => (series && series.length >= 2 ? series[series.length - 2].value : null);
  const ninoPrev = prev(data?.enso?.nino.monthly);
  const iodPrev = prev(data?.enso?.iod.monthly);
  const deltas = [
    { label: "Niño 3.4", current: nino?.value ?? null, delta: nino && ninoPrev != null ? nino.value - ninoPrev : null, goodIfUp: false },
    { label: "IOD (DMI)", current: iod?.value ?? null, delta: iod && iodPrev != null ? iod.value - iodPrev : null, goodIfUp: true },
    { label: "All-India Deficit", current: allIndia, delta: null, goodIfUp: true },
  ];

  return (
    <div className="max-w-7xl space-y-6">
      <PageTitle
        icon="▦"
        title="Dashboard Summary"
        sub={`Sources: ${data?.enso?.nino.source ?? "NOAA"} | ${data?.enso?.iod.source ?? "NOAA"} | ${data?.imd?.source ?? "IMD"}${
          data?.imd?.asOfDate ? ` (as of ${isoDate(data.imd.asOfDate)})` : ""
        }`}
        right={<RefreshButton />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="🌡"
          title={`Niño 3.4 · ${monthLabel(nino)}`}
          value={nino ? `${signed(nino.value, 2, "")}°C` : "N/A"}
          sub={ninoStatus}
          tone={ninoStatus === "La Niña" ? "emerald" : ninoStatus === "El Niño" ? "red" : "slate"}
        />
        <KpiCard
          icon="∿"
          title={`IOD (DMI) · ${monthLabel(iod)}`}
          value={iod ? signed(iod.value, 2, "") : "N/A"}
          sub={iodPhase}
          tone={iodPhase === "Positive" ? "emerald" : iodPhase === "Negative" ? "amber" : "slate"}
        />
        <KpiCard
          icon="🌧"
          title="All-India Deficit"
          value={signed(allIndia)}
          sub={`${deficientCount} subdivisions deficient`}
          tone={rainTone(allIndia)}
        />
        <KpiCard icon="💧" title="Central India Avg" value={signed(central)} sub="MP, MH, Vidarbha, CG crop belt" tone={rainTone(central)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={PANEL + " p-5 lg:col-span-2"}>
          <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
            <span className="text-amber-400">⚠</span> Risk Assessment
          </h4>
          <p className="mb-4 text-[11px] text-slate-500">Rule-based reading of the indicators on this page.</p>
          {bullets.length ? (
            <div className="space-y-2.5">
              {bullets.map((b, i) => (
                <div key={i} className={"rounded-lg border p-3 text-sm " + SEVERITY[b.severity]}>
                  {b.text}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Risk assessment unavailable — no indicator data yet.</p>
          )}
        </div>

        <div className={PANEL + " p-5"}>
          <h4 className="mb-4 text-sm font-semibold text-white">Period-on-Period Change</h4>
          <div className="space-y-4">
            {deltas.map((d) => {
              const favorable = d.delta == null || Math.abs(d.delta) < 0.005 ? null : d.delta > 0 === d.goodIfUp;
              return (
                <div key={d.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">{d.label}</p>
                    <p className="font-mono text-lg font-bold text-white">{d.current == null ? "N/A" : d.current.toFixed(2)}</p>
                  </div>
                  {d.delta == null ? (
                    <span className="text-xs text-slate-500">—</span>
                  ) : (
                    <span className={"font-mono text-sm " + (favorable === true ? "text-emerald-400" : favorable === false ? "text-red-400" : "text-slate-400")}>
                      {favorable === true ? "▲" : favorable === false ? "▼" : "•"} {signed(d.delta, 2, "")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[10.5px] text-slate-600">Ocean indices: change vs the previous month. Green = better for the monsoon.</p>
        </div>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Loaded>
      <Summary />
    </Loaded>
  );
}
