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
