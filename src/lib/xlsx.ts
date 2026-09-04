import * as XLSX from "xlsx";

export type SheetRows = Record<string, string | number | null>[];

export async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  const buf = await file.arrayBuffer();
  return XLSX.read(buf, { type: "array" });
}

/** sheet → array of row objects keyed by header cell */
export function sheetToRows(wb: XLSX.WorkBook, name: string): SheetRows | null {
  const ws = wb.Sheets[name];
  if (!ws) return null;
  return XLSX.utils.sheet_to_json(ws, { defval: null }) as SheetRows;
}

/** case / whitespace tolerant sheet lookup */
export function findSheet(wb: XLSX.WorkBook, ...candidates: string[]): string | null {
  const norm = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, "");
  const entries = wb.SheetNames.map((n) => ({ k: norm(n), n }));
  for (const c of candidates) {
    const cn = norm(c);
    const exact = entries.find((e) => e.k === cn);
    if (exact) return exact.n;
  }
  for (const c of candidates) {
    const cn = norm(c);
    const partial = entries.find((e) => e.k.includes(cn) || cn.includes(e.k));
    if (partial) return partial.n;
  }
  return null;
}

export function toNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/* ---------------------------------------------------------------- */
/* Section-specific parsers                                          */
/* ---------------------------------------------------------------- */

const PRICE_COLS: Record<string, string[]> = {
  guj29: ["guj29", "guj-29", "gujarat29", "shankar29", "guj 29"],
  guj28: ["guj28", "guj-28", "gujarat28", "guj 28"],
  mmak29: ["mmak29", "mmak-29", "mmak 29"],
  mma28: ["mma28", "mma-28", "mma 28"],
  phr28: ["phr28", "phr-28", "phr 28", "punjabharyana28"],
  cs30: ["cs30", "cs-30", "cs 30"],
  cs31: ["cs31", "cs-31", "cs 31"],
  kapas: ["kapas", "rawcotton"],
  cseed: ["cseed", "cottonseed", "seed"],
  coilc: ["coilc", "oilcake", "cottonoilcake"],
  yarn: ["yarn", "cottonyarn"],
};

/**
 * Parse a domestic price workbook. Expects a sheet with a Year/Season column and
 * one column per variety (any of the aliases above). Missing columns are skipped.
 */
export function parsePrices(wb: XLSX.WorkBook) {
  const sheet =
    findSheet(wb, "Domestic", "Prices", "1_Prices", "DomesticPrices") ?? wb.SheetNames[0];
  const rows = sheetToRows(wb, sheet);
  if (!rows || !rows.length) throw new Error(`Sheet "${sheet}" is empty.`);

  const headers = Object.keys(rows[0]);
  const norm = (s: string) => s.toLowerCase().replace(/[\s_\-./]+/g, "");
  const yearHeader =
    headers.find((h) => /year|season|date/i.test(h)) ?? headers[0];

  const colMap: Partial<Record<string, string>> = {};
  for (const [key, aliases] of Object.entries(PRICE_COLS)) {
    const hit = headers.find((h) => aliases.some((a) => norm(h) === norm(a)));
    if (hit) colMap[key] = hit;
  }
  if (!Object.keys(colMap).length)
    throw new Error("No recognised variety columns (e.g. GUJ29, MMAK29, PHR28…).");

  const years = rows.map((r) => String(r[yearHeader] ?? "").trim()).filter(Boolean);
  const series: Record<string, number[]> = {};
  for (const [key, header] of Object.entries(colMap)) {
    series[key] = rows.map((r) => toNum(r[header!]) ?? NaN);
  }

  return {
    data: { years, series },
    summary: `${years.length} rows · ${Object.keys(colMap).length} varieties`,
  };
}
