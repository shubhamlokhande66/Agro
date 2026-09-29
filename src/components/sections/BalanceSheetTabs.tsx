"use client";

import { Fragment, useMemo, useState } from "react";
import clsx from "clsx";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TableWrap, Td, Th } from "@/components/ui/DataTable";
import { SND } from "@/data/balanceSheet";
import { signedPct } from "@/lib/format";

/**
 * India cotton SND (supply & demand) balance sheet — the operator's original dashboard
 * layout: Estimated / Forecast / Historical / Monthly Detail tabs, YTD + annual blocks and
 * an Oct–Sep (India) / Jul–Jun (global) year-type toggle, styled like the other plain
 * dashboard tables. Data comes from the `balanceSheet` dataset (imported from
 * LATEST DASHBOARD.xlsx — scripts/import-balance-sheet.ts).
 */

type YearType = "india" | "global";
type Row = Record<string, number | null | undefined>;

const MONTHS_INDIA = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const MONTHS_GLOBAL = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
/** in a Jul–Jun year these months belong to the previous Oct–Sep season */
const PREV_SEASON_MONTHS = ["Jul", "Aug", "Sep"];

const BS_ROWS: { key: string; label: string; section?: string; indent?: boolean; total?: boolean; ratio?: boolean }[] = [
  { key: "opening_stocks", label: "Opening Stocks", section: "SUPPLY" },
  { key: "crop_size", label: "Crop Size", indent: true },
  { key: "farmer_selling", label: "Farmer Selling", indent: true },
  { key: "imports", label: "Imports", indent: true },
  { key: "total_supply", label: "Total Supply", total: true },
  { key: "msp_procurement", label: "MSP Procurement (CCI)", section: "DEMAND", indent: true },
  { key: "msp_auctions", label: "MSP Auctions", indent: true },
  { key: "stocks_govt", label: "Stocks with Govt/CCI", indent: true },
  { key: "domestic_cons", label: "Domestic Consumption", indent: true },
  { key: "exports", label: "Exports", indent: true },
  { key: "total_demand", label: "Total Demand", total: true },
  { key: "closing_stocks", label: "Closing Stocks", section: "CLOSING" },
  { key: "sur_free_mkt", label: "S/U Ratio (Free Mkt)", section: "RATIOS", ratio: true },
  { key: "total_sur", label: "Total S/U Ratio", ratio: true },
];

const MON_COLS = [
  { key: "opening", label: "Opening" },
  { key: "crop", label: "Crop" },
  { key: "farmer_sell", label: "Farmer Sell" },
  { key: "imports", label: "Imports" },
  { key: "dom_cons", label: "Dom Cons" },
  { key: "exports", label: "Exports" },
  { key: "closing", label: "Closing" },
];

/** "2025/26" -> "2024/25" */
const prevSeasonOf = (s: string) => {
  const y = parseInt(s, 10);
  return `${y - 1}/${String(y).slice(2)}`;
};

const monthRow = (season: string, m: string, yt: YearType): Row => {
  const s = yt === "global" && PREV_SEASON_MONTHS.includes(m) ? prevSeasonOf(season) : season;
  return ((SND.monthly?.[s] ?? {}) as Record<string, Row>)[m] ?? {};
};

/** SND over a run of months — same arithmetic as the annual sheet, so Oct→Sep equals the annual column */
function calcPeriod(season: string, months: string[], yt: YearType): Row {
  const rows = months.map((m) => monthRow(season, m, yt));
  const sum = (k: string) => rows.reduce((a, r) => a + (r[k] ?? 0), 0);
  const first = rows[0] ?? {};
  const last = rows.at(-1) ?? {};
  // crop is entered once, in October
  const oct = rows[months.indexOf("Oct")] ?? {};
  const opening = first.opening ?? null;
  const farmerSelling = sum("farmer_sell");
  const imports = sum("imports");
  const domCons = sum("total_cons");
  const exports = sum("exports");
  const closing = last.closing ?? null;
  const govt = last.stock_cci ?? null;
  const totalDemand = domCons + exports;
  return {
    opening_stocks: opening,
    crop_size: oct.crop ?? null,
    farmer_selling: farmerSelling,
    imports,
    // supply that has actually reached the market in the period
    total_supply: (opening ?? 0) + farmerSelling + imports,
    msp_procurement: sum("cci_proc"),
    msp_auctions: sum("cci_sell"),
    stocks_govt: govt,
    domestic_cons: domCons,
    exports,
    total_demand: totalDemand,
    closing_stocks: closing,
    sur_free_mkt: closing != null && totalDemand ? (closing - (govt ?? 0)) / totalDemand : null,
    total_sur: closing != null && totalDemand ? closing / totalDemand : null,
  };
}

/** full-year SND: the stored Oct–Sep annual figures, or computed from months for Jul–Jun */
const annualOf = (season: string, yt: YearType): Row =>
  yt === "india" ? ((SND.annual?.[season] ?? {}) as unknown as Row) : calcPeriod(season, MONTHS_GLOBAL, yt);

const fmt = (v: number | null | undefined, ratio?: boolean) =>
  v == null || Number.isNaN(v) ? "—" : ratio ? v.toFixed(3) : v.toFixed(2);
const pctVar = (a: number | null | undefined, b: number | null | undefined) =>
  a == null || b == null || b === 0 ? null : ((a - b) / Math.abs(b)) * 100;

/* ── plain table styling, same as the Overview production table ── */
const cellTd = "px-2 py-1 text-[11.5px] leading-5";
const cellTh = "px-2 py-1.5 text-[9.5px]";
const TOTAL_ROW = "bg-accent/10 font-semibold";
const zebra = (i: number) => (i % 2 === 1 ? "bg-surface-2/50" : undefined);

/** a % change as small green / red text */
function DeltaText({ value }: { value: number | null }) {
  const tone = value == null || Math.abs(value) < 0.05 ? "text-ink-faint" : value > 0 ? "text-pos" : "text-neg";
  return <span className={"num text-[11px] font-medium " + tone}>{signedPct(value, 1)}</span>;
}

function SectionRow({ label, span }: { label: string; span: number }) {
  return (
    <tr>
      <td colSpan={span} className="border-b border-line px-2 pb-0.5 pt-2 text-[9.5px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </td>
    </tr>
  );
}

function Select({ value, onChange, options, labels }: { value: string; onChange: (v: string) => void; options: string[]; labels?: (o: string) => string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] text-ink"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {labels ? labels(o) : o}
        </option>
      ))}
    </select>
  );
}

const YEAR_OPTS = [
  { value: "india" as const, label: "Oct–Sep" },
  { value: "global" as const, label: "Jul–Jun" },
];

const Controls = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-2 flex flex-wrap items-center gap-2">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{title}</span>
    <div className="flex-1" />
    {children}
  </div>
);
const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-2 text-[10.5px] text-ink-faint">{children}</p>
);
const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] text-ink-faint">{children}</span>
);

type Tab = "est" | "frc" | "hist" | "mon";

export function BalanceSheetTabs() {
  // newest first by starting year; the newest season is the forecast, the one before it the estimate
  const annualSeasons = useMemo(
    () => [...(SND.annual_seasons ?? [])].sort((a, b) => parseInt(b, 10) - parseInt(a, 10)),
    [],
  );
  const monthSeasons = useMemo(() => [...(SND.seasons ?? [])].sort().reverse(), []);
  const forecast = annualSeasons[0] ?? "";
  const estimate = annualSeasons[1] ?? forecast;
  const tag = (s: string) => (s === forecast ? `${s} †` : s === estimate ? `${s} ★` : s);

  const [tab, setTab] = useState<Tab>("est");
  const [yt, setYt] = useState<Record<Tab, YearType>>({ est: "india", frc: "india", hist: "india", mon: "india" });
  const setYear = (t: Tab) => (v: YearType) => setYt((p) => ({ ...p, [t]: v }));
  const [ytdMon, setYtdMon] = useState(() => {
    const cal = new Date().toLocaleString("en-US", { month: "short" });
    return MONTHS_INDIA.includes(cal) ? cal : "Mar";
  });
  const [histFrom, setHistFrom] = useState(annualSeasons.at(-1) ?? "");
  const [histTo, setHistTo] = useState(annualSeasons[0] ?? "");
  const [monSeason, setMonSeason] = useState(monthSeasons.includes(estimate) ? estimate : (monthSeasons[0] ?? ""));
  const [monFrom, setMonFrom] = useState("Oct");
  const [monTo, setMonTo] = useState("Sep");

  if (!annualSeasons.length) return null;

  /* ── tabs 1 & 2: YTD + annual, season vs previous ── */
  const renderCompare = (t: "est" | "frc") => {
    const cur = t === "est" ? estimate : forecast;
    const prev = prevSeasonOf(cur);
    const y = yt[t];
    const months = y === "india" ? MONTHS_INDIA : MONTHS_GLOBAL;
    const upTo = months.includes(ytdMon) ? ytdMon : months[months.length - 1];
    const ytdMonths = months.slice(0, months.indexOf(upTo) + 1);
    const ytdCur = calcPeriod(cur, ytdMonths, y);
    const ytdPrev = calcPeriod(prev, ytdMonths, y);
    const annCur = annualOf(cur, y);
    const annPrev = annualOf(prev, y);
    const yrLabel = y === "india" ? "Oct–Sep" : "Jul–Jun";
    const ytdLabel = `YTD (${months[0]}–${upTo})`;

    return (
      <>
        <Controls title={`${cur} balance sheet · ${t === "est" ? "★ estimated" : "† forecast"}`}>
          <Tabs options={YEAR_OPTS} value={y} onChange={setYear(t)} />
          <Label>YTD to</Label>
          <Select
            value={upTo}
            onChange={setYtdMon}
            options={months}
            labels={(m) => (m === months[months.length - 1] ? `${m} (full year)` : m)}
          />
        </Controls>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th rowSpan={2} className={cellTh}>Particulars</Th>
                <Th colSpan={3} align="center" className={cellTh + " border-l border-line"}>{ytdLabel}</Th>
                <Th colSpan={3} align="center" className={cellTh + " border-l border-line"}>Annual ({yrLabel})</Th>
              </tr>
              <tr>
                <Th align="right" className={cellTh + " border-l border-line"}>{tag(cur)}</Th>
                <Th align="right" className={cellTh}>{tag(prev)}</Th>
                <Th align="right" className={cellTh}>Δ</Th>
                <Th align="right" className={cellTh + " border-l border-line"}>{tag(cur)}</Th>
                <Th align="right" className={cellTh}>{tag(prev)}</Th>
                <Th align="right" className={cellTh}>Δ</Th>
              </tr>
            </thead>
            <tbody>
              {BS_ROWS.map((r, i) => (
                <Fragment key={r.key}>
                  {r.section ? <SectionRow label={r.section} span={7} /> : null}
                  <tr className={r.total ? TOTAL_ROW : zebra(i)}>
                    <Td className={clsx(cellTd, "whitespace-nowrap", r.indent && "pl-5")}>{r.label}</Td>
                    <Td align="right" mono className={cellTd + " border-l border-line/70"}>{fmt(ytdCur[r.key], r.ratio)}</Td>
                    <Td align="right" mono className={cellTd + " text-ink-soft"}>{fmt(ytdPrev[r.key], r.ratio)}</Td>
                    <Td align="right" className={cellTd}><DeltaText value={pctVar(ytdCur[r.key], ytdPrev[r.key])} /></Td>
                    <Td align="right" mono className={cellTd + " border-l border-line/70"}>{fmt(annCur[r.key], r.ratio)}</Td>
                    <Td align="right" mono className={cellTd + " text-ink-soft"}>{fmt(annPrev[r.key], r.ratio)}</Td>
                    <Td align="right" className={cellTd}><DeltaText value={pctVar(annCur[r.key], annPrev[r.key])} /></Td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        <Note>
          {t === "est" ? "★ Estimated / provisional" : "† Forecast"} · YTD = {months[0]} to selected month · Annual = full{" "}
          {yrLabel} season · lakh bales
        </Note>
      </>
    );
  };

  /* ── tab 3: historical, every season between two picks ── */
  const renderHistory = () => {
    const y = yt.hist;
    const i1 = annualSeasons.indexOf(histFrom);
    const i2 = annualSeasons.indexOf(histTo);
    const sel = i1 < 0 || i2 < 0 ? [] : annualSeasons.slice(Math.min(i1, i2), Math.max(i1, i2) + 1).reverse();
    const data = Object.fromEntries(sel.map((s) => [s, annualOf(s, y)]));
    const yrLabel = y === "india" ? "Oct–Sep" : "Jul–Jun";

    return (
      <>
        <Controls title="Historical balance sheet">
          <Tabs options={YEAR_OPTS} value={y} onChange={setYear("hist")} />
          <Select value={histFrom} onChange={setHistFrom} options={annualSeasons} labels={tag} />
          <Label>to</Label>
          <Select value={histTo} onChange={setHistTo} options={annualSeasons} labels={tag} />
        </Controls>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th className={cellTh}>Particulars ({yrLabel})</Th>
                {sel.map((s) => (
                  <Th key={s} align="right" className={cellTh + " whitespace-nowrap"}>{tag(s)}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BS_ROWS.map((r, i) => (
                <Fragment key={r.key}>
                  {r.section ? <SectionRow label={r.section} span={sel.length + 1} /> : null}
                  <tr className={r.total ? TOTAL_ROW : zebra(i)}>
                    <Td className={clsx(cellTd, "whitespace-nowrap", r.indent && "pl-5")}>{r.label}</Td>
                    {sel.map((s) => (
                      <Td key={s} align="right" mono className={cellTd}>{fmt(data[s][r.key], r.ratio)}</Td>
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        <Note>Annual {yrLabel} data · ★ estimated · † forecast · lakh bales</Note>
      </>
    );
  };

  /* ── tab 4: monthly detail ── */
  const renderMonthly = () => {
    const fi = MONTHS_INDIA.indexOf(monFrom);
    const ti = MONTHS_INDIA.indexOf(monTo);
    // a range that wraps (e.g. Jul → Jun) takes Jul–Sep from the previous season
    const wraps = fi > ti;
    const months = wraps ? [...MONTHS_INDIA.slice(fi), ...MONTHS_INDIA.slice(0, ti + 1)] : MONTHS_INDIA.slice(fi, ti + 1);
    const rowOf = (m: string, i: number): Row => {
      const fromPrev = wraps && i < MONTHS_INDIA.length - fi;
      return ((SND.monthly?.[fromPrev ? prevSeasonOf(monSeason) : monSeason] ?? {}) as Record<string, Row>)[m] ?? {};
    };
    const rows = months.map((m, i) => ({ m, r: rowOf(m, i) }));
    const total = (k: string) =>
      k === "opening" ? rows[0]?.r.opening : k === "closing" ? rows.at(-1)?.r.closing : rows.reduce((a, x) => a + (x.r[k] ?? 0), 0);

    return (
      <>
        <Controls title={`Monthly detail · ${monSeason}`}>
          <Label>Season</Label>
          <Select value={monSeason} onChange={setMonSeason} options={monthSeasons} />
          <Label>Months</Label>
          <Select value={monFrom} onChange={setMonFrom} options={MONTHS_INDIA} />
          <Label>to</Label>
          <Select value={monTo} onChange={setMonTo} options={MONTHS_INDIA} />
        </Controls>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th className={cellTh}>Month</Th>
                {MON_COLS.map((c) => (
                  <Th key={c.key} align="right" className={cellTh}>{c.label}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ m, r }, i) => (
                <tr key={m} className={zebra(i)}>
                  <Td className={cellTd}>{m}</Td>
                  {MON_COLS.map((c) => (
                    <Td key={c.key} align="right" mono className={cellTd}>{fmt(r[c.key])}</Td>
                  ))}
                </tr>
              ))}
              <tr className={TOTAL_ROW}>
                <Td className={cellTd}>Total / closing</Td>
                {MON_COLS.map((c) => (
                  <Td key={c.key} align="right" mono className={cellTd}>{fmt(total(c.key))}</Td>
                ))}
              </tr>
            </tbody>
          </Table>
        </TableWrap>
        <Note>Opening = first month · closing = last month · others summed · lakh bales</Note>
      </>
    );
  };

  return (
    <div className="panel p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[13.5px] font-semibold tracking-tight text-ink">India Cotton — Supply &amp; Demand Balance Sheet</h3>
          <p className="mt-0.5 text-[11px] text-ink-faint">
            Cotton year October – September · lakh bales (1 bale = 170 kg) · Source: CAB / CCI / GOI
          </p>
        </div>
        <Tabs
          options={[
            { value: "est" as const, label: `${estimate} Estimated` },
            { value: "frc" as const, label: `${forecast} Forecast` },
            { value: "hist" as const, label: "Historical" },
            { value: "mon" as const, label: "Monthly detail" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "est" || tab === "frc" ? renderCompare(tab) : tab === "hist" ? renderHistory() : renderMonthly()}
    </div>
  );
}
