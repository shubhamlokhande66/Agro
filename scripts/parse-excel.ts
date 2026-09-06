/* Parsers for the operator-supplied Excel workbooks in /data.
   These override the corresponding seed blobs so the DB starts from the
   freshest data the operator provided. */
import * as XLSX from "xlsx";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const DATA_DIR = resolve(process.cwd(), "data");

function sheetRows(file: string, sheet?: string): any[][] {
  const path = resolve(DATA_DIR, file);
  if (!existsSync(path)) return [];
  const wb = XLSX.read(readFileSync(path), { type: "buffer" });
  const name = sheet ?? wb.SheetNames[0];
  return XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null });
}

const toNum = (v: any): number | null => {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null;
};

const serialToLabel = (serial: number): string => {
  const d = XLSX.SSF.parse_date_code(serial);
  if (!d) return String(serial);
  const mm = String(d.m).padStart(2, "0");
  const dd = String(d.d).padStart(2, "0");
  return `${d.y}-${mm}-${dd}`;
};

/* ---- Arrivals ------------------------------------------------------------- */
export function parseArrivals() {
  const rows = sheetRows("Cotton Arrivals.xlsx");
  if (!rows.length) return null;
  const header = rows[0];
  const seasons = header.slice(1).map((s) => String(s).trim());
  const weeks: string[] = [];
  const values: Record<string, number[]> = {};
  seasons.forEach((s) => (values[s] = []));
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row[0] == null) continue;
    weeks.push(typeof row[0] === "number" ? serialToLabel(row[0]) : String(row[0]));
    seasons.forEach((s, i) => values[s].push(toNum(row[i + 1]) ?? NaN));
  }
  return { weeks, seasons, values };
}

/* ---- Sowing ------------------------------------------------------------- */
export function parseSowing() {
  const rows = sheetRows("Indian_Cotton_Sowing Progress.xlsx", "Cotton_Sowing_Progress");
  if (!rows.length) return null;
  const header = rows[0];
  const cols = header.slice(1).map((s) => String(s).trim());
  const weeks: string[] = [];
  const byCol: number[][] = cols.map(() => []);
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row[0] == null) continue;
    weeks.push(String(row[0]).replace(/\s*W\s*$/i, "").trim());
    cols.forEach((_, i) => byCol[i].push(toNum(row[i + 1]) ?? NaN));
  }
  const series = cols.map((label, i) => ({ label, data: byCol[i] }));
  return { weeks, series };
}

/* ---- Production ------------------------------------------------------------- */
const STATE_MAP: Record<string, string> = {
  PUNJAB: "PUNJAB", HARYANA: "HARYANA", RAJASTHAN: "RAJASTHAN", GUJARAT: "GUJARAT",
  MAHARASHTRA: "MAHARASHTRA", MADHYA_PRADESH: "MP", ANDHRA_PRADESH: "AP",
  TELANGANA: "TELANGANA", KARNATAKA: "KARNATAKA", TAMIL_NADU: "TNADU",
  "ORISSA & OTHERS": "OTHERS", ALL_STATES: "ALL_INDIA",
};
const STATE_LABELS: Record<string, string> = {
  PUNJAB: "Punjab", HARYANA: "Haryana", RAJASTHAN: "Rajasthan", GUJARAT: "Gujarat",
  MAHARASHTRA: "Maharashtra", MP: "Madhya Pradesh", AP: "Andhra Pradesh",
  TELANGANA: "Telangana", KARNATAKA: "Karnataka", TNADU: "Tamil Nadu",
  OTHERS: "Others", ALL_INDIA: "All India",
};

function parseProductionSheet(rows: any[][]) {
  const hdrIdx = rows.findIndex((r) => String(r?.[2]).toUpperCase() === "SEASON");
  if (hdrIdx < 0) return null;
  const header = rows[hdrIdx].map((h: any) => String(h ?? "").trim());
  const colKeys = header.map((h) => STATE_MAP[h.toUpperCase()] ?? null);
  const block: Record<string, Record<string, number>> = {};
  const seasons: string[] = [];
  for (let r = hdrIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    const season = String(row?.[2] ?? "").trim();
    if (!season || /^var\.?$/i.test(season)) continue;
    if (!/\d{4}\/\d{2}/.test(season)) continue;
    seasons.push(season);
    block[season] = {};
    for (let c = 3; c < header.length; c++) {
      const key = colKeys[c];
      if (!key) continue;
      const n = toNum(row[c]);
      if (n != null) block[season][key] = n;
    }
  }
  return { block, seasons };
}

export function parseProduction() {
  const wbPath = resolve(DATA_DIR, "Cotton_ProductionN.xlsx");
  if (!existsSync(wbPath)) return null;
  const wb = XLSX.read(readFileSync(wbPath), { type: "buffer" });
  const find = (frag: string) =>
    wb.SheetNames.find((n) => n.toLowerCase().replace(/\s+/g, "").includes(frag));

  const areaSheet = find("area");
  const yieldSheet = find("yield");
  const prodSheet = find("prodn") ?? find("production");
  if (!areaSheet || !yieldSheet || !prodSheet) return null;

  const get = (name: string) =>
    parseProductionSheet(XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null }));

  const area = get(areaSheet);
  const yld = get(yieldSheet);
  const prod = get(prodSheet);
  if (!area || !yld || !prod) return null;

  const seasons = Array.from(
    new Set([...area.seasons, ...yld.seasons, ...prod.seasons]),
  ).sort();
  const states = Object.values(STATE_MAP);

  return {
    area: area.block,
    yield: yld.block,
    prod: prod.block,
    seasons,
    states,
    stateLabels: STATE_LABELS,
  };
}
