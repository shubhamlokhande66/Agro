"use client";

import clsx from "clsx";
import { useState } from "react";
import { parseLabelDate } from "@/lib/period";
import { VARIETIES, dailySeries } from "@/data/prices";
import { ICE_M_L, ICE_M_V, BR_M_L, BR_M_V } from "@/data/international";
import { USDINR_M_L, USDINR_M_V } from "@/data/currency";
import { seriesFor, type HeroCategory } from "./HeroChart";

/**
 * The Market Overview's table view, laid out like the weekly report sent to clients: a
 * "Domestic Market" block (CAI spot varieties, kapas, seed, oil cake, yarn) and a "Global
 * Markets" block (ICE, INR, Brent), each with the close and % change over 1 week … 5 years.
 */

type Source = { kind: "variety"; key: string } | { kind: "hero"; cat: HeroCategory };
type RowDef = { label: string; unit: string; src: Source; monthly?: () => { l: string[]; v: number[] } };

const CANDY = "₹ per candy (356 kg)";
const DOMESTIC: RowDef[] = [
  { label: "North 28 mm", unit: CANDY, src: { kind: "variety", key: "phr28" } },
  { label: "Gujarat 29 mm", unit: CANDY, src: { kind: "variety", key: "guj29" } },
  { label: "Central India 29 mm", unit: CANDY, src: { kind: "variety", key: "mmak29" } },
  { label: "Central India 30 mm", unit: CANDY, src: { kind: "variety", key: "cs30" } },
  { label: "Central India 31 mm", unit: CANDY, src: { kind: "variety", key: "cs31" } },
  { label: "Kapas", unit: "₹ per quintal", src: { kind: "hero", cat: "kapas" } },
  { label: "Cotton Seed", unit: "₹ per quintal", src: { kind: "hero", cat: "cseed" } },
  { label: "Cotton Seed Oil Cake", unit: "₹ per quintal", src: { kind: "hero", cat: "coilc" } },
  { label: "Cotton Yarn", unit: "₹ per kg", src: { kind: "hero", cat: "yarn" } },
];
// the daily ICE / Brent / RBI series hold ~1–2 years; their monthly history covers the longer periods
// (read inside functions, not at import time — the arrays are filled in when the data loads)
const GLOBAL: RowDef[] = [
  { label: "ICE Futures", unit: "US ¢ per lb", src: { kind: "hero", cat: "cotton" }, monthly: () => ({ l: ICE_M_L, v: ICE_M_V }) },
  { label: "INR", unit: "₹ per US$", src: { kind: "hero", cat: "inr" }, monthly: () => ({ l: USDINR_M_L, v: USDINR_M_V }) },
  { label: "Crude Oil (Brent)", unit: "US$ per barrel", src: { kind: "hero", cat: "crude" }, monthly: () => ({ l: BR_M_L, v: BR_M_V }) },
];

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

type TableRow = { label: string; unit: string; close: string; date: number | null; changes: (number | null)[] };

function buildRow(d: RowDef): TableRow {
  let labels: (string | number)[] = [];
  let values: (number | null)[] = [];
  let fmt = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  if (d.src.kind === "variety") {
    const key = d.src.key;
    const s = dailySeries(VARIETIES.find((v) => v.key === key));
    labels = s.labels;
    values = s.values;
    fmt = (v) => Math.round(v).toLocaleString("en-IN");
  } else {
    const s = seriesFor(d.src.cat, "1y");
    labels = s.labels;
    values = s.values;
    fmt = d.src.cat === "inr" || d.src.cat === "cotton" || d.src.cat === "crude" ? (v) => v.toFixed(2) : (v) => Math.round(v).toLocaleString("en-IN");
  }
  const daily = points(labels, values);
  const last = daily.at(-1) ?? null;
  const monthlySrc = d.monthly?.();
  const monthly = monthlySrc ? points(monthlySrc.l, monthlySrc.v) : [];
  const changes = PERIODS.map((p) => {
    if (!last) return null;
    const c = changeOver(daily, p.days, 7, last);
    if (c != null) return c;
    return monthly.length ? changeOver(monthly, p.days, 31, last) : null;
  });
  return { label: d.label, unit: d.unit, close: last ? fmt(last.v) : "—", date: last?.t ?? null, changes };
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

export function PriceTable() {
  const domestic = withUnitSpans(DOMESTIC.map(buildRow));
  const global = withUnitSpans(GLOBAL.map(buildRow));
  const asOf = Math.max(...[...domestic, ...global].map((r) => r.date ?? 0));
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
          <h2 className="text-[14px] font-semibold tracking-tight text-ink">Cotton Prices India · Weekly Update</h2>
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
              <th className="border-r border-white/30 px-3 py-2 text-left">Indian Markets</th>
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
          CAI spot rates for the cotton varieties; “—” where the price history doesn’t reach back that far. Hover a close for its date.
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
    pdf.addImage(data, "JPEG", M, 24, 140, 44.3); // logo is 1421 × 450
  } catch {
    // the table still stands without the logo
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor("#111111");
  pdf.text("Cotton Prices India Weekly Update", W - M, 44, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor("#565a52");
  pdf.text(`Close as of ${asOf ? fmtDate(asOf) : "-"}`, W - M, 60, { align: "right" });

  const cols = [
    { title: "Indian Markets", w: 150, align: "left" as const },
    { title: "Units", w: 110, align: "center" as const },
    { title: "Close", w: 70, align: "right" as const },
    ...PERIODS.map((p) => ({ title: p.label, w: 64, align: "center" as const })),
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

  // header row
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
      // cell borders (the unit column has its own merged box)
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
    "Cotton varieties: CAI spot rates. Kapas: NCDEX Rajkot. Cotton seed / oil cake: NCDEX Akola. ICE: Cotton No. 2 futures. INR: RBI reference rate. Crude: Brent. '-' = history doesn't reach back that far.",
    x0,
    y + 18,
    { maxWidth: tableW },
  );
  pdf.text("Agrolytix Research · India Cotton Market Intelligence", x0, H - 24);
  pdf.save(`Agrolytix Cotton Prices India ${new Date().toISOString().slice(0, 10)}.pdf`);
}
