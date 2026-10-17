"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { Figure, SampleBanner, fmt } from "@/components/sugar/ui";
import { NC, NC_DATES, NCDEX_SERIES, WHOLESALE_CITIES, WS, WS_DATES, dailyChange, dailyLatest, wsChange, wsLatest } from "@/data/sugar/sample";
import ComboChart from "@/components/charts/ComboChart";

const COLORS: Record<string, string> = {
  delhi: "#c2410c", kanpur: "#d97706", raipur: "#a16207", mumbai: "#0f766e", ranchi: "#65a30d",
  kolkata: "#2563eb", guwahati: "#0891b2", hyderabad: "#7c3aed", chennai: "#64748b",
};
const dm = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** daily wholesale sugar prices in nine cities (Chinimandi) */
export default function SugarPrices() {
  const [on, setOn] = useState<string[]>(["delhi", "kanpur", "mumbai", "kolkata", "chennai"]);
  const latestDate = WS_DATES.at(-1);
  const north = WS.kanpur ?? [];
  const west = WS.mumbai ?? [];
  const spread = WS_DATES.map((_, i) => (north[i] != null && west[i] != null ? (north[i] as number) - (west[i] as number) : null));

  return (
    <div>
      <PageHeader
        title="Domestic Sugar Prices"
        icon="₹"
        sub={`NCDEX spot (Kolhapur, Muzaffarnagar) and wholesale M-30 incl. GST in nine cities (Chinimandi) · daily${latestDate ? ` · latest ${dm(latestDate)}` : ""}`}
      />
      <SampleBanner datasets={["sugarWholesale"]} source="Chinimandi wholesale prices (sync from Sugar Admin)" />

      {NC_DATES.length ? (
        <Card className="mb-4">
          <CardHeader
            title="NCDEX spot prices"
            sub={`Evening price · Sugar S Kolhapur ₹/quintal, Gur Muzaffarnagar ₹/40 kg · latest ${dm(NC_DATES.at(-1)!)} · source: NCDEX`}
          />
          <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {NCDEX_SERIES.map((s) => (
              <Figure key={s.key} label={`NCDEX ${s.label}`} value={fmt(dailyLatest(NC_DATES, NC[s.key])?.value)} unit={s.unit} change={dailyChange(NC_DATES, NC[s.key], 7)} changeLabel="w/w" />
            ))}
            <Figure label="Sugar S Kolhapur · 1 month" value={fmt(dailyLatest(NC_DATES, NC.sugar_kolhapur)?.value)} unit="₹/qtl" change={dailyChange(NC_DATES, NC.sugar_kolhapur, 30)} changeLabel="m/m" />
            <Figure label="Gur Muzaffarnagar · 1 month" value={fmt(dailyLatest(NC_DATES, NC.gur_muzaffarnagar)?.value, 2)} unit="₹/40 kg" change={dailyChange(NC_DATES, NC.gur_muzaffarnagar, 30)} changeLabel="m/m" />
          </div>
          <ComboChart
            labels={NC_DATES.map(dm)}
            height={260}
            xTicks={8}
            left={{ label: "Sugar S Kolhapur ₹/qtl", data: NC.sugar_kolhapur, color: "#c2410c", fmt: (v) => `₹${Math.round(v).toLocaleString("en-IN")}` }}
            right={{ label: "Gur Muzaffarnagar ₹/40 kg", data: NC.gur_muzaffarnagar, color: "#92400e", fmt: (v) => `₹${Math.round(v).toLocaleString("en-IN")}` }}
          />
        </Card>
      ) : null}

      {!WS_DATES.length ? (
        <Card>
          <p className="py-10 text-center text-[13px] text-ink-faint">No wholesale prices yet — open Sugar Admin → Wholesale Sugar Prices → ⟳ Sync Chinimandi.</p>
        </Card>
      ) : (
        <>
          <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {WHOLESALE_CITIES.map((c) => (
              <Figure key={c.key} label={c.label} value={fmt(wsLatest(c.key)?.value)} unit="₹/qtl" change={wsChange(c.key, 7)} changeLabel="w/w" />
            ))}
          </section>

          <Card>
            <CardHeader
              title="Daily wholesale prices"
              sub={`₹ per quintal · ${WS_DATES.length} trading days · click a city to show or hide it`}
            />
            <div className="print-hide mb-3 flex flex-wrap gap-1.5">
              {WHOLESALE_CITIES.map((c) => {
                const active = on.includes(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setOn(active ? on.filter((k) => k !== c.key) : [...on, c.key])}
                    className={"rounded-lg border px-2.5 py-1 text-[11.5px] font-semibold " + (active ? "border-transparent text-white" : "border-line text-ink-faint")}
                    style={active ? { background: COLORS[c.key] } : undefined}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            <LineChart
              labels={WS_DATES.map(dm)}
              height={320}
              legend
              xTicks={10}
              series={WHOLESALE_CITIES.filter((c) => on.includes(c.key)).map((c) => ({ label: c.label, data: WS[c.key], color: COLORS[c.key], width: 2.25, tension: 0 }))}
              yFmt={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`}
            />
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <Card>
              <CardHeader title="North–West spread" sub="Kanpur minus Mumbai · ₹ per quintal" />
              <BarChart
                labels={WS_DATES.map(dm)}
                height={260}
                xTicks={8}
                series={[{ label: "Kanpur − Mumbai", data: spread, colors: spread.map((v) => ((v ?? 0) >= 0 ? "#c2410c" : "#0f766e")) }]}
                yFmt={(v) => `₹${v}`}
              />
            </Card>
            <Card>
              <CardHeader title="Daily prices" sub="₹ per quintal, latest first" />
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Date</Th>
                      {WHOLESALE_CITIES.map((c) => <Th key={c.key} align="right">{c.label.replace(" (S-30)", "*")}</Th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {WS_DATES.map((d, i) => ({ d, i })).reverse().map(({ d, i }) => (
                      <tr key={d}>
                        <Td className="whitespace-nowrap">{dm(d)}</Td>
                        {WHOLESALE_CITIES.map((c) => <Td key={c.key} align="right" mono>{fmt(WS[c.key][i])}</Td>)}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
              <p className="mt-1.5 text-[10.5px] text-ink-faint">* Hyderabad prices are for S-30 sugar.</p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
