"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import AreaChart from "@/components/charts/AreaChart";
import { GlobalPeriodTabs } from "@/components/ui/GlobalPeriodTabs";
import { Delta } from "@/components/ui/ChangeBadge";
import { classForChange, inr, inrCompact } from "@/lib/format";
import { deltaOverPeriod, parseLabelDate, sliceByPeriod, type GlobalPeriod } from "@/lib/period";
import { CRUDE_DAILY, CRUDE_MONTHLY, NC, NC_DATES, S_MONTH_KEYS, sugarPrice } from "@/data/sugar/sample";

/**
 * The sugar Market Overview's price block, built like the cotton one: a rail of price cards
 * (each switches the main chart), the main chart with the 1W–5Y period, and the report-style
 * price table with Domestic Market / Global Markets bands and a table-only PDF.
 */

export type SugarCategory = "kolhapur" | "gur" | "ice11" | "ldn5" | "crude";

export const SUGAR_CATEGORIES: { value: SugarCategory; label: string }[] = [
  { value: "kolhapur", label: "Sugar · Kolhapur" },
  { value: "gur", label: "Gur · Muzaffarnagar" },
  { value: "ice11", label: "ICE Raw Sugar No.11" },
  { value: "ldn5", label: "London White No.5" },
  { value: "crude", label: "Crude Oil (Brent)" },
];

type Series = {
  title: string;
  labels: (string | number)[];
  values: (number | null)[];
  unit: string;
  headlineFmt: (v: number) => string;
  axisFmt: (v: number) => string;
  tooltipFmt: (v: number) => string;
};

export function sugarSeriesFor(cat: SugarCategory): Series {
  switch (cat) {
    case "kolhapur":
      return { title: "Sugar S · Kolhapur (NCDEX spot)", labels: NC_DATES, values: NC.sugar_kolhapur ?? [], unit: "₹/Quintal", headlineFmt: (v) => inr(v), axisFmt: inrCompact, tooltipFmt: (v) => inr(v) };
    case "gur":
      return { title: "Gur · Muzaffarnagar (NCDEX spot)", labels: NC_DATES, values: NC.gur_muzaffarnagar ?? [], unit: "₹/40 kg", headlineFmt: (v) => inr(v, 2), axisFmt: inrCompact, tooltipFmt: (v) => inr(v, 2) };
    case "ice11":
      return { title: "ICE Raw Sugar No.11", labels: S_MONTH_KEYS, values: sugarPrice("ice11")?.values ?? [], unit: "¢/lb", headlineFmt: (v) => v.toFixed(2), axisFmt: (v) => `${v}¢`, tooltipFmt: (v) => `${v.toFixed(2)}¢/lb` };
    case "ldn5":
      return { title: "London White Sugar No.5", labels: S_MONTH_KEYS, values: sugarPrice("ldn5")?.values ?? [], unit: "$/tonne", headlineFmt: (v) => v.toFixed(1), axisFmt: (v) => `$${v}`, tooltipFmt: (v) => `$${v.toFixed(1)}/t` };
    case "crude": {
      const s = CRUDE_DAILY.labels.length ? CRUDE_DAILY : CRUDE_MONTHLY;
      return { title: "Crude Oil (Brent)", labels: s.labels, values: s.values, unit: "$/bbl", headlineFmt: (v) => v.toFixed(2), axisFmt: (v) => `$${v}`, tooltipFmt: (v) => `$${v}/bbl` };
    }
  }
}

function formatAsOf(label: string | number | undefined): string | null {
  if (label == null) return null;
  const ts = parseLabelDate(label);
  if (ts == null) return String(label);
  const monthly = /^([A-Za-z]{3}-\d{2,4}|\d{4}-\d{2})$/.test(String(label));
  return new Date(ts).toLocaleDateString("en-GB", monthly ? { month: "short", year: "numeric" } : { day: "2-digit", month: "short", year: "numeric" });
}

/** the price cards — each shows its last price and change over the period, and picks the chart */
export function SugarCategoryRail({ value, onChange, period }: { value: SugarCategory; onChange: (v: SugarCategory) => void; period: GlobalPeriod }) {
  return (
    <div className="grid min-w-0 grid-cols-2 content-start gap-2 sm:grid-cols-3 lg:grid-cols-1">
      {SUGAR_CATEGORIES.map((c) => {
        const src = sugarSeriesFor(c.value);
        let li = src.values.length - 1;
        while (li >= 0 && src.values[li] == null) li--;
        const last = li >= 0 ? src.values[li] : null;
        const asOf = li >= 0 ? formatAsOf(src.labels[li]) : null;
        const delta = deltaOverPeriod(src.labels, src.values, period).pct;
        const kind = classForChange(delta);
        const active = value === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={clsx(
              "focusable rounded-xl border p-2.5 text-left transition-colors",
              active ? "border-accent ring-1 ring-accent" : "border-line hover:border-accent/60",
              !active && kind === "up" && "bg-pos-soft",
              !active && kind === "down" && "bg-neg-soft",
              !active && kind === "flat" && "bg-surface-2",
              active && "bg-accent/10",
            )}
          >
            <div className="truncate text-[10.5px] font-semibold uppercase tracking-wide text-ink-soft">{c.label}</div>
            <div className="num mt-1 text-[13.5px] font-bold leading-tight text-ink">
              {last != null ? src.headlineFmt(last) : "—"} <span className="text-[10px] font-medium text-ink-faint">{src.unit}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <Delta value={delta} />
              {asOf ? <span className="num truncate text-[10px] text-ink-faint">{asOf}</span> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** the featured chart — the selected price over the page-level period */
export function SugarHeroChart({ category, period, onPeriodChange }: { category: SugarCategory; period: GlobalPeriod; onPeriodChange: (p: GlobalPeriod) => void }) {
  const src = useMemo(() => sugarSeriesFor(category), [category]);
  const sliced = useMemo(() => sliceByPeriod(src.labels, src.values, period), [src, period]);
  const delta = useMemo(() => deltaOverPeriod(src.labels, src.values, period), [src, period]);
  let li = src.values.length - 1;
  while (li >= 0 && src.values[li] == null) li--;
  const last = li >= 0 ? src.values[li] : null;
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div className="panel flex flex-col p-4 sm:p-5">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow">{src.title}</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="num text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{last != null ? src.headlineFmt(last) : "—"}</span>
            <span className="num pb-0.5 text-[11px] text-ink-faint">{src.unit}</span>
            <span className="pb-0.5">
              <Delta value={delta.pct} />
            </span>
          </div>
        </div>
        <span className="print-hide">
          <GlobalPeriodTabs value={period} onChange={onPeriodChange} />
        </span>
      </div>
      <div className={compact ? "relative h-[220px]" : "relative min-h-[300px] flex-1 lg:min-h-[160px]"}>
        {sliced.labels.length ? (
          <AreaChart labels={sliced.labels} data={sliced.values} height="fill" smartX={false} xTicks={6} yFmt={src.axisFmt} tooltipLabel={src.tooltipFmt} />
        ) : (
          <p className="pt-16 text-center text-[12px] text-ink-faint">No prices yet — sync this source in Sugar Admin.</p>
        )}
      </div>
    </div>
  );
}

/* ── table view ─────────────────────────────────────────────────────────── */

const PERIODS: { label: string; days: number }[] = [
  { label: "1 Week", days: 7 },
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 91 },
  { label: "6 Months", days: 182 },
  { label: "1 Year", days: 365 },
  { label: "2 Years", days: 730 },
  { label: "5 Years", days: 1826 },
];
const TEAL = "#2f6b73";

type Pt = { t: number; v: number };
const points = (labels: (string | number)[], values: (number | null)[]): Pt[] =>
  labels
    .map((l, i) => ({ t: parseLabelDate(l), v: values[i] }))
    .filter((p): p is Pt => p.t != null && typeof p.v === "number" && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t);

/** % change from the price `days` before the latest — null when the history doesn't reach that far */
function changeOver(pts: Pt[], days: number, slackDays: number, last: Pt): number | null {
  if (!pts.length) return null;
  const target = last.t - days * 86400000;
  if (pts[0].t > target + slackDays * 86400000) return null;
  let base: Pt | null = null;
  for (const p of pts) {
    if (p.t <= target + slackDays * 86400000 * 0.5) base = p;
    else break;
  }
  if (!base || base.v === 0) return null;
  return ((last.v - base.v) / Math.abs(base.v)) * 100;
}

type RowDef = { label: string; unit: string; cat: SugarCategory; monthly?: () => { l: string[]; v: number[] } };
const DOMESTIC: RowDef[] = [
  { label: "Sugar (S) · Kolhapur", unit: "₹ per quintal", cat: "kolhapur" },
  { label: "Gur · Muzaffarnagar", unit: "₹ per 40 kg", cat: "gur" },
];
const GLOBAL: RowDef[] = [
  { label: "ICE Raw Sugar No.11", unit: "US ¢ per lb", cat: "ice11" },
  { label: "London White Sugar No.5", unit: "US$ per tonne", cat: "ldn5" },
  { label: "Crude Oil (Brent)", unit: "US$ per barrel", cat: "crude", monthly: () => ({ l: CRUDE_MONTHLY.labels, v: CRUDE_MONTHLY.values }) },
];

type TableRow = { label: string; unit: string; close: string; date: number | null; changes: (number | null)[] };

function buildRow(d: RowDef): TableRow {
  const src = sugarSeriesFor(d.cat);
  const pts = points(src.labels, src.values);
  const last = pts.at(-1) ?? null;
  // monthly series (or a daily one with monthly history behind it) look back with a month of slack
  const isMonthly = /^\d{4}-\d{2}$/.test(String(src.labels.at(-1) ?? ""));
  const monthly = d.monthly ? points(d.monthly().l, d.monthly().v) : [];
  const changes = PERIODS.map((p) => {
    if (!last) return null;
    if (isMonthly && p.days < 28) return null;
    const c = changeOver(pts, p.days, isMonthly ? 31 : 7, last);
    if (c != null) return c;
    return monthly.length ? changeOver(monthly, p.days, 31, last) : null;
  });
  return { label: d.label, unit: d.unit, close: last ? src.headlineFmt(last.v).replace("₹", "") : "—", date: last?.t ?? null, changes };
}

const pctText = (v: number | null) => (v == null ? "—" : `${v < -0.05 ? "-" : ""}${Math.abs(v).toFixed(1)}%`);
const tone = (v: number | null) => (v == null || Math.abs(v) < 0.05 ? "flat" : v > 0 ? "up" : "down");
const fmtDate = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** a unit shown once per run of rows that share it (like the merged unit cell on the report) */
function withUnitSpans(rows: TableRow[]) {
  return rows.map((r, i) => {
    if (i > 0 && rows[i - 1].unit === r.unit) return { ...r, span: 0 };
    let n = 1;
    while (rows[i + n]?.unit === r.unit) n++;
    return { ...r, span: n };
  });
}

/** the report-style price table: Domestic Market (NCDEX spot) and Global Markets, close + 1W…5Y */
export function SugarPriceTable() {
  const domestic = withUnitSpans(DOMESTIC.map(buildRow));
  const global = withUnitSpans(GLOBAL.map(buildRow));
  const asOf = Math.max(0, ...[...domestic, ...global].map((r) => r.date ?? 0));
  const [busy, setBusy] = useState(false);

  const section = (title: string, rows: ReturnType<typeof withUnitSpans>) => (
    <>
      <tr>
        <td colSpan={3 + PERIODS.length} className="px-3 py-1.5 text-center text-[12px] font-bold text-white" style={{ background: TEAL }}>
          {title}
        </td>
      </tr>
      {rows.map((r) => (
        <tr key={r.label} className="border-b border-line">
          <td className="whitespace-nowrap border-r border-line px-3 py-1.5 text-ink">{r.label}</td>
          {r.span ? (
            <td rowSpan={r.span} className="border-r border-line px-2 py-1.5 text-center align-middle text-[11.5px] text-ink-soft">
              {r.unit}
            </td>
          ) : null}
          <td className="num border-r border-line px-3 py-1.5 text-right font-semibold text-ink" title={r.date ? `as of ${fmtDate(r.date)}` : undefined}>
            {r.close}
          </td>
          {r.changes.map((c, i) => (
            <td
              key={i}
              className={clsx(
                "num border-r border-line px-3 py-1.5 text-center last:border-r-0",
                tone(c) === "up" && "text-pos",
                tone(c) === "down" && "text-neg",
                tone(c) === "flat" && "text-ink-faint",
              )}
            >
              {pctText(c)}
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3 pt-4 sm:px-5">
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-ink">Sugar Prices India · Weekly Update</h2>
          <p className="mt-0.5 text-[11px] text-ink-faint">Close as of {asOf ? fmtDate(asOf) : "—"} · % change over each period</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await downloadTablePdf(domestic, global, asOf);
            } finally {
              setBusy(false);
            }
          }}
          className="focusable print-hide rounded-xl border border-line px-3.5 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
        >
          {busy ? "Preparing PDF…" : "⤓ Download table PDF"}
        </button>
      </div>
      <div className="overflow-x-auto px-4 pb-4 sm:px-5">
        <table className="w-full min-w-[860px] border-collapse border border-line text-[12.5px]">
          <thead>
            <tr className="text-[11.5px] font-bold text-white" style={{ background: TEAL }}>
              <th className="border-r border-white/30 px-3 py-2 text-left">Markets</th>
              <th className="border-r border-white/30 px-2 py-2">Units</th>
              <th className="border-r border-white/30 px-3 py-2 text-right">Close</th>
              {PERIODS.map((p) => (
                <th key={p.label} className="border-r border-white/30 px-3 py-2 last:border-r-0">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section("Domestic Market", domestic)}
            {section("Global Markets", global)}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-ink-faint">
          Sugar and gur: NCDEX spot (evening price). ICE / London: monthly. Crude: Brent. “—” where the price history doesn’t reach back that far. Hover a close for its date.
        </p>
      </div>
    </section>
  );
}

/** the same table as a clean white A4 PDF: logo, title, date, the two-block table, source note */
async function downloadTablePdf(domestic: ReturnType<typeof withUnitSpans>, global: ReturnType<typeof withUnitSpans>, asOf: number) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 36;
  const pdfText = (s: string) => s.replace(/₹/g, "Rs").replace(/¢/g, "c").replace(/—/g, "-");

  try {
    const blob = await (await fetch("/agrolytix-logo.jpg")).blob();
    const data = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(new Error("logo"));
      r.readAsDataURL(blob);
    });
    pdf.addImage(data, "JPEG", M, 24, 140, 44.3);
  } catch {
    // the table still stands without the logo
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor("#111111");
  pdf.text("Sugar Prices India Weekly Update", W - M, 44, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor("#565a52");
  pdf.text(`Close as of ${asOf ? fmtDate(asOf) : "-"}`, W - M, 60, { align: "right" });

  const cols = [
    { title: "Markets", w: 160, align: "left" as const },
    { title: "Units", w: 110, align: "center" as const },
    { title: "Close", w: 70, align: "right" as const },
    ...PERIODS.map((p) => ({ title: p.label, w: 62, align: "center" as const })),
  ];
  const tableW = cols.reduce((a, c) => a + c.w, 0);
  const x0 = (W - tableW) / 2;
  const xAt = (i: number) => x0 + cols.slice(0, i).reduce((a, c) => a + c.w, 0);
  const rowH = 19;
  let y = 88;
  const cellText = (s: string, i: number, yy: number) => {
    const c = cols[i];
    const x = c.align === "left" ? xAt(i) + 6 : c.align === "right" ? xAt(i) + c.w - 6 : xAt(i) + c.w / 2;
    pdf.text(pdfText(s), x, yy, { align: c.align });
  };

  pdf.setFillColor(TEAL);
  pdf.rect(x0, y, tableW, rowH + 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor("#ffffff");
  cols.forEach((c, i) => cellText(c.title, i, y + 13.5));
  y += rowH + 2;

  pdf.setDrawColor("#9aa0a6");
  pdf.setLineWidth(0.5);
  const block = (title: string, rows: ReturnType<typeof withUnitSpans>) => {
    pdf.setFillColor(TEAL);
    pdf.rect(x0, y, tableW, rowH, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor("#ffffff");
    pdf.text(title, x0 + tableW / 2, y + 13, { align: "center" });
    y += rowH;
    rows.forEach((r) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor("#111111");
      cellText(r.label, 0, y + 13);
      if (r.span) {
        pdf.setTextColor("#444444");
        const mid = y + (r.span * rowH) / 2 + 3;
        const lines = pdf.splitTextToSize(pdfText(r.unit), cols[1].w - 10) as string[];
        lines.forEach((ln, k) => pdf.text(ln, xAt(1) + cols[1].w / 2, mid + (k - (lines.length - 1) / 2) * 10, { align: "center" }));
        pdf.rect(xAt(1), y, cols[1].w, r.span * rowH, "S");
      }
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor("#111111");
      cellText(r.close, 2, y + 13);
      pdf.setFont("helvetica", "normal");
      r.changes.forEach((c, j) => {
        const t = tone(c);
        pdf.setTextColor(t === "up" ? "#0b8a52" : t === "down" ? "#d62d20" : "#8f9389");
        cellText(pctText(c), 3 + j, y + 13);
      });
      cols.forEach((c, i) => {
        if (i !== 1) pdf.rect(xAt(i), y, c.w, rowH, "S");
      });
      y += rowH;
    });
  };
  block("Domestic Market", domestic);
  block("Global Markets", global);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor("#8f9389");
  pdf.text(
    "Sugar (S) Kolhapur and Gur Muzaffarnagar: NCDEX spot, evening price. ICE Raw Sugar No.11 and London White No.5: monthly. Crude: Brent. '-' = history doesn't reach back that far.",
    x0,
    y + 18,
    { maxWidth: tableW },
  );
  pdf.text("Agrolytix Research · India Sugar Market Intelligence", x0, H - 24);
  pdf.save(`Agrolytix Sugar Prices India ${new Date().toISOString().slice(0, 10)}.pdf`);
}
