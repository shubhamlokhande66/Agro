"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { ExportPdfButton, type PdfReport } from "@/components/ui/ExportPdfButton";
import { ReportHeading } from "@/components/overview/ReportHeading";
import { Figure, SampleBanner, fmt, pct, Chg } from "@/components/sugar/ui";
import {
  S_MONTHS, SUGAR_PRICES, sugarPrice, whitePremium, WHOLESALE_CITIES, WS, WS_DATES, wsChange, wsLatest,
  CRUSH_FORTNIGHTS, CRUSH_SUGAR, PROD_SEASONS, PROD_STATES, BS_SEASONS, BS_ROWS,
  BR_FORTNIGHTS, BR_SUGAR, WORLD_SEASONS, WORLD_PROD, WORLD_CONS,
} from "@/data/sugar/sample";

type Hero = "domestic" | "global" | "premium";

/** the cities on the domestic chart (all nine are in the table and on Domestic Prices) */
const HERO_CITIES = [
  { key: "delhi", color: "#c2410c", width: 2.5 },
  { key: "kanpur", color: "#d97706", width: 2 },
  { key: "mumbai", color: "#0f766e", width: 2.5 },
  { key: "kolkata", color: "#2563eb", width: 2 },
  { key: "hyderabad", color: "#7c3aed", width: 2 },
  { key: "chennai", color: "#64748b", width: 2 },
] as const;
const dm = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function sugarReports(now = new Date()): PdfReport[] {
  const dd = (n: number) => String(n).padStart(2, "0");
  const iso = now.toISOString().slice(0, 10);
  const contents = ["Market Prices", "Crushing Progress", "Production by State", "Balance Sheet", "Brazil & World Balance"];
  return [
    { key: "weekly", label: "Weekly report", title: "INDIA SUGAR: Weekly Report", dateLine: `${dd(now.getDate())}.${dd(now.getMonth() + 1)}.${now.getFullYear()}`, fileName: `Agrolytix India Sugar Weekly Report ${iso}`, contents, banner: null },
    { key: "monthly", label: "Monthly report", title: "INDIA SUGAR: Monthly Report", dateLine: now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }), fileName: `Agrolytix India Sugar Monthly Report ${iso.slice(0, 7)}`, contents, banner: null },
  ];
}

function More({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="print-hide text-[11px] font-semibold text-accent hover:underline">
      {label} →
    </Link>
  );
}

/** change over `months` from the latest value */
const chgOver = (v: number[], months: number) => pct(v.at(-1), v.at(-1 - months));

export default function SugarOverview() {
  const [hero, setHero] = useState<Hero>("domestic");
  const prem = whitePremium();
  const latest = (k: string) => sugarPrice(k).values.at(-1)!;
  const mm = (k: string) => chgOver(sugarPrice(k).values, 1);
  const seasons = Object.keys(CRUSH_SUGAR);
  const brSeasons = Object.keys(BR_SUGAR);
  const cur = PROD_SEASONS.length - 1;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="print-hide">
          <div className="eyebrow">Agrolytix Research · India Sugar</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Sugar Market Overview</h1>
        </div>
        <ExportPdfButton fileName={`Agrolytix Sugar Overview ${new Date().toISOString().slice(0, 10)}`} reports={sugarReports()} />
      </div>
      <SampleBanner datasets={["sugarWholesale", "sugarPrices", "sugarCrushing", "sugarProduction", "sugarBalance", "sugarBrazil", "sugarWorld"]} source="ICE / London settlements, ISMA, UNICA, ISO" />

      <ReportHeading sub="Domestic and global markets">Market Prices</ReportHeading>
      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {(["delhi", "kanpur", "mumbai"] as const).map((c) => (
          <Figure key={c} label={`M-30 wholesale · ${WHOLESALE_CITIES.find((x) => x.key === c)!.label}`} value={fmt(wsLatest(c)?.value)} unit="₹/qtl" change={wsChange(c, 7)} changeLabel="w/w" />
        ))}
        <Figure label="ICE Raw No.11" value={fmt(latest("ice11"), 2)} unit="¢/lb" change={mm("ice11")} />
        <Figure label="London White No.5" value={fmt(latest("ldn5"), 1)} unit="$/t" change={mm("ldn5")} />
        <Figure label="White premium" value={fmt(prem.at(-1), 1)} unit="$/t" change={pct(prem.at(-1), prem.at(-2))} />
      </section>

      <Card>
        <CardHeader
          title={hero === "domestic" ? "Domestic wholesale sugar prices" : hero === "global" ? "ICE No.11 vs London No.5" : "White premium (London No.5 − ICE No.11)"}
          sub={hero === "domestic" ? `M-30 wholesale incl. GST · ₹ per quintal · daily (Chinimandi)${WS_DATES.length ? ` · ${WS_DATES.length} trading days` : ""}` : hero === "global" ? "Raw ¢/lb (left) and white $/t (right) · monthly" : "US$ per tonne · refining margin signal"}
          right={
            <span className="print-hide">
              <Tabs
                options={[
                  { value: "domestic" as const, label: "Domestic" },
                  { value: "global" as const, label: "Global" },
                  { value: "premium" as const, label: "White premium" },
                ]}
                value={hero}
                onChange={setHero}
              />
            </span>
          }
        />
        {hero === "domestic" ? (
          WS_DATES.length ? (
            <LineChart
              labels={WS_DATES.map(dm)}
              height={300}
              legend
              xTicks={8}
              series={HERO_CITIES.map((c) => ({ label: WHOLESALE_CITIES.find((x) => x.key === c.key)!.label, data: WS[c.key], color: c.color, width: c.width, tension: 0 }))}
              yFmt={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`}
            />
          ) : (
            <p className="py-16 text-center text-[12px] text-ink-faint">No wholesale prices yet — run ⟳ Sync Chinimandi in Sugar Admin.</p>
          )
        ) : hero === "global" ? (
          <LineChart
            labels={S_MONTHS}
            height={300}
            legend
            series={[
              { label: "ICE No.11 × 22.05 ($/t equiv.)", data: sugarPrice("ice11").values.map((v) => Math.round(v * 22.0462)), color: "#2563eb", width: 2.5 },
              { label: "London No.5 ($/t)", data: sugarPrice("ldn5").values, color: "#d97706", width: 2.5 },
            ]}
            yFmt={(v) => `$${Math.round(v)}`}
          />
        ) : (
          <BarChart labels={S_MONTHS} height={300} series={[{ label: "White premium", data: prem, color: "#d97706" }]} yFmt={(v) => `$${Math.round(v)}`} />
        )}
      </Card>

      <Card className="mt-4">
        <CardHeader title="Price table" sub="Latest price and % change · domestic daily (Chinimandi), global monthly" right={<More href="/sugar/prices" label="All prices" />} />
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Market</Th>
                <Th>Unit</Th>
                <Th align="right">Latest</Th>
                <Th align="right">1 W</Th>
                <Th align="right">1 M</Th>
                <Th align="right">3 M</Th>
                <Th align="right">6 M</Th>
                <Th align="right">1 Y</Th>
              </tr>
            </thead>
            <tbody>
              {WHOLESALE_CITIES.map((c) => (
                <tr key={c.key}>
                  <Td>M-30 wholesale · {c.label}</Td>
                  <Td className="text-ink-faint">₹/quintal</Td>
                  <Td align="right" mono>{fmt(wsLatest(c.key)?.value)}</Td>
                  {[7, 30, 91, 182, 365].map((d) => (
                    <Td key={d} align="right"><Chg v={wsChange(c.key, d)} /></Td>
                  ))}
                </tr>
              ))}
              {SUGAR_PRICES.map((p) => (
                <tr key={p.key}>
                  <Td>{p.label}</Td>
                  <Td className="text-ink-faint">{p.unit}</Td>
                  <Td align="right" mono>{fmt(p.values.at(-1), p.digits)}</Td>
                  <Td align="right" className="text-ink-faint">—</Td>
                  {[1, 3, 6, 12].map((m) => (
                    <Td key={m} align="right"><Chg v={chgOver(p.values, m)} /></Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      <ReportHeading>Crushing &amp; Production</ReportHeading>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Crushing progress" sub={`Cumulative sugar produced · lakh tonnes · ${seasons.join(" vs ")}`} right={<More href="/sugar/crushing" label="Details" />} />
          <LineChart
            labels={CRUSH_FORTNIGHTS}
            height={240}
            legend
            series={[
              { label: seasons[0], data: CRUSH_SUGAR[seasons[0]], color: "#94a3b8", width: 2.5 },
              { label: seasons[1], data: CRUSH_SUGAR[seasons[1]], color: "#c2410c", width: 3.5 },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Production by state" sub={`Lakh tonnes, after ethanol diversion · ${PROD_SEASONS[cur - 1]} vs ${PROD_SEASONS[cur]}`} right={<More href="/sugar/production" label="Details" />} />
          <BarChart
            labels={PROD_STATES.map((s) => s.state)}
            height={240}
            legend
            series={[
              { label: PROD_SEASONS[cur - 1], data: PROD_STATES.map((s) => s.values[cur - 1]), color: "#94a3b8" },
              { label: PROD_SEASONS[cur], data: PROD_STATES.map((s) => s.values[cur]), color: "#c2410c", valueLabel: (v) => v.toFixed(0) },
            ]}
          />
        </Card>
      </div>

      <ReportHeading>Balance Sheet</ReportHeading>
      <Card className="mt-4">
        <CardHeader title="India sugar balance sheet" sub="Oct–Sep · lakh tonnes" right={<More href="/sugar/balance-sheet" label="Full balance sheet" />} />
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Lakh tonnes</Th>
                {BS_SEASONS.map((s) => <Th key={s} align="right">{s}</Th>)}
              </tr>
            </thead>
            <tbody>
              {BS_ROWS.map((r) => (
                <tr key={r.key} className={r.bold ? "bg-accent/10 font-semibold" : undefined}>
                  <Td>{r.label}</Td>
                  {r.values.map((v, i) => <Td key={i} align="right" mono>{fmt(v, 1)}</Td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      <ReportHeading>Brazil &amp; World Balance</ReportHeading>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Brazil Centre-South sugar output" sub={`UNICA · cumulative, million tonnes · ${brSeasons.join(" vs ")}`} right={<More href="/sugar/brazil" label="Brazil" />} />
          <LineChart
            labels={BR_FORTNIGHTS}
            height={240}
            legend
            series={[
              { label: brSeasons[1], data: BR_SUGAR[brSeasons[1]], color: "#94a3b8", width: 2.5 },
              { label: brSeasons[0], data: BR_SUGAR[brSeasons[0]], color: "#16a34a", width: 3.5 },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="World sugar balance" sub="Production vs consumption · million tonnes, raw value" right={<More href="/sugar/world" label="World balance" />} />
          <BarChart
            labels={WORLD_SEASONS}
            height={240}
            legend
            series={[
              { label: "Production", data: WORLD_PROD, color: "#0f766e" },
              { label: "Consumption", data: WORLD_CONS, color: "#d97706" },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
