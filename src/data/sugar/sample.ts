/**
 * The sugar dashboard's data, as the pages use it — filled from the sugar datasets in the
 * database (edited in Sugar Admin) by `hydrateSugar`. Until a dataset has been edited it holds
 * the SAMPLE values from ./defaults and `SUGAR_SAMPLE[key]` is true (the page shows a banner).
 */

import { BR_FORTNIGHT_LIST, CRUSH_FORTNIGHT_LIST, SUGAR_DEFAULTS, SUGAR_STATES, TRADE_MONTH_LIST } from "./defaults";

type Rec = Record<string, any>;
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const rowsOf = (d: Rec | undefined, k = "rows"): Rec[] => (Array.isArray(d?.[k]) ? d![k] : []);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return m ? `${MONTHS[Number(m) - 1]} ${y.slice(2)}` : ym;
};
/** "2025-26 (E)" → 2025, for sorting seasons */
const seasonStart = (s: string) => parseInt(s, 10) || 0;

/** which datasets still hold sample values */
export let SUGAR_SAMPLE: Record<string, boolean> = Object.fromEntries(Object.keys(SUGAR_DEFAULTS).map((k) => [k, true]));
export let SUGAR_UPDATED: Record<string, number | null> = {};

/* ── prices ── */
export type SugarPriceSeries = { key: string; label: string; unit: string; group: "domestic" | "global" | "byproduct"; values: number[]; digits: number };
const PRICE_META: Omit<SugarPriceSeries, "values">[] = [
  { key: "ice11", label: "ICE Raw Sugar No.11", unit: "US¢/lb", group: "global", digits: 2 },
  { key: "ldn5", label: "London White Sugar No.5", unit: "US$/tonne", group: "global", digits: 1 },
  { key: "usdinr", label: "USD / INR", unit: "₹ per US$", group: "global", digits: 2 },
  { key: "molasses", label: "Molasses (C-heavy)", unit: "₹/tonne", group: "byproduct", digits: 0 },
];
export const SUGAR_PRICE_FIELDS = PRICE_META;
export let S_MONTHS: string[] = [];
export let SUGAR_PRICES: SugarPriceSeries[] = [];
export const sugarPrice = (key: string) => SUGAR_PRICES.find((p) => p.key === key)!;
/** white premium = London No.5 − ICE No.11 converted to $/t (1 ¢/lb = 22.0462 $/t) */
export const whitePremium = () => {
  const w = sugarPrice("ldn5").values;
  const r = sugarPrice("ice11").values;
  return w.map((v, i) => Math.round((v - r[i] * 22.0462) * 10) / 10);
};

/* ── domestic wholesale (Chinimandi, daily) ── */
export const WHOLESALE_CITIES = [
  { key: "delhi", label: "Delhi" },
  { key: "kanpur", label: "Kanpur" },
  { key: "raipur", label: "Raipur" },
  { key: "mumbai", label: "Mumbai" },
  { key: "ranchi", label: "Ranchi" },
  { key: "kolkata", label: "Kolkata" },
  { key: "guwahati", label: "Guwahati" },
  { key: "hyderabad", label: "Hyderabad (S-30)" },
  { key: "chennai", label: "Chennai" },
] as const;
export type WholesaleCity = (typeof WHOLESALE_CITIES)[number]["key"];
/** trading dates, oldest first ("2026-10-16") */
export let WS_DATES: string[] = [];
export let WS: Record<string, (number | null)[]> = {};
export const wsLatest = (city: string) => {
  const v = WS[city] ?? [];
  for (let i = v.length - 1; i >= 0; i--) if (v[i] != null) return { value: v[i] as number, date: WS_DATES[i], i };
  return null;
};
/** % change of a city's price vs `days` calendar days before its latest (null when history is shorter) */
export function wsChange(city: string, days: number): number | null {
  const last = wsLatest(city);
  if (!last) return null;
  const target = Date.parse(last.date) - days * 86400000;
  if (!WS_DATES.length || Date.parse(WS_DATES[0]) > target + 3 * 86400000) return null;
  let base: number | null = null;
  for (let i = 0; i < WS_DATES.length; i++) {
    if (Date.parse(WS_DATES[i]) > target) break;
    if (WS[city][i] != null) base = WS[city][i];
  }
  return base ? ((last.value - base) / base) * 100 : null;
}
/** a city's monthly average for "YYYY-MM" (null if no prices that month) */
export function wsMonthAvg(city: string, ym: string): number | null {
  const vals = WS_DATES.map((d, i) => (d.startsWith(ym) ? WS[city]?.[i] : null)).filter((v): v is number => v != null);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}
/* ── NCDEX spot (daily evening price) ── */
export const NCDEX_SERIES = [
  { key: "sugar_kolhapur", label: "Sugar S · Kolhapur", unit: "₹/qtl" },
  { key: "gur_muzaffarnagar", label: "Gur · Muzaffarnagar", unit: "₹/40 kg" },
] as const;
export let NC_DATES: string[] = [];
export let NC: Record<string, (number | null)[]> = {};

/** latest value of a daily series */
export function dailyLatest(dates: string[], values: (number | null)[] | undefined) {
  const v = values ?? [];
  for (let i = v.length - 1; i >= 0; i--) if (v[i] != null) return { value: v[i] as number, date: dates[i], i };
  return null;
}
/** % change of a daily series vs `days` calendar days before its latest (null when history is shorter) */
export function dailyChange(dates: string[], values: (number | null)[] | undefined, days: number): number | null {
  const last = dailyLatest(dates, values);
  if (!last || !values) return null;
  const target = Date.parse(last.date) - days * 86400000;
  if (!dates.length || Date.parse(dates[0]) > target + 3 * 86400000) return null;
  let base: number | null = null;
  for (let i = 0; i < dates.length && Date.parse(dates[i]) <= target; i++) if (values[i] != null) base = values[i];
  return base ? ((last.value - base) / base) * 100 : null;
}

/** the monthly price rows' months ("2026-10"), oldest first — matches S_MONTHS */
export let S_MONTH_KEYS: string[] = [];

/* ── crushing ── */
export const CRUSH_FORTNIGHTS = CRUSH_FORTNIGHT_LIST;
export let CRUSH_SUGAR: Record<string, (number | null)[]> = {};
export let CRUSH_MILLS: Record<string, (number | null)[]> = {};
export let CRUSH_STATES: { state: string; mills: number; cane: number; sugar: number; recovery: number; ly: number }[] = [];
export let CRUSH_AS_OF = "";

/* ── production / ethanol ── */
export let PROD_SEASONS: string[] = [];
export let PROD_STATES: { state: string; values: number[] }[] = [];
export let DIVERSION: number[] = [];
export let ETHANOL: { esy: string; c_heavy: number | null; b_heavy: number | null; juice: number | null }[] = [];

/* ── cane ── */
export let CANE_YEARS: string[] = [];
export let CANE_AREA: (number | null)[] = [];
export let CANE_FRP: (number | null)[] = [];
export let CANE_SAP_UP: (number | null)[] = [];

/* ── balance sheet ── */
export let BS_SEASONS: string[] = [];
export let BS_ROWS: { key: string; label: string; bold?: boolean; values: number[] }[] = [];

/* ── trade ── */
export const TRADE_MONTHS = TRADE_MONTH_LIST;
export let EXPORTS: Record<string, (number | null)[]> = {};
export let EXPORT_DESTINATIONS: { country: string; share: number }[] = [];
export let EXPORT_QUOTA: number | null = null;
export let IMPORTS_TOTAL: number | null = null;

/* ── policy ── */
export let RELEASE_MONTHS: string[] = [];
export let RELEASE_QUOTA: number[] = [];
export let POLICY: { item: string; value: string; note: string }[] = [];
export let SUGAR_MSP: number | null = null;

/* ── weather ── */
export const RAIN_MONTHS = ["Jun", "Jul", "Aug", "Sep"];
export let RAIN_STATES: { state: string; dev: (number | null)[] }[] = [];

/* ── Brazil ── */
export let BR_FORTNIGHTS: string[] = [];
/** newest season first */
export let BR_SUGAR: Record<string, (number | null)[]> = {};
export let BR_MIX: Record<string, (number | null)[]> = {};

/* ── world ── */
export let WORLD_SEASONS: string[] = [];
export let WORLD_PROD: number[] = [];
export let WORLD_CONS: number[] = [];
export let WORLD_TOP: { country: string; prod: number; exports: number }[] = [];

/* ── CFTC ── */
export let COT_WEEKS: string[] = [];
export let COT_MM_NET: number[] = [];

/** a season → values-by-label table from rows like { season, fortnight, value } */
function bySeason(rows: Rec[], slotKey: string, slots: string[], valueKey: string, newestFirst = false) {
  const seasons = [...new Set(rows.map((r) => String(r.season)))].sort((a, b) => (newestFirst ? seasonStart(b) - seasonStart(a) : seasonStart(a) - seasonStart(b)));
  return Object.fromEntries(seasons.map((s) => [s, slots.map((slot) => num(rows.find((r) => r.season === s && r[slotKey] === slot)?.[valueKey]))]));
}

/** fills every export above from the sugar datasets (missing ones fall back to the sample defaults) */
export function hydrateSugar(blobs: Record<string, Rec | null | undefined>, updated: Record<string, number | null> = {}) {
  const d = (k: string): Rec => (blobs[k] ?? SUGAR_DEFAULTS[k]) as Rec;
  SUGAR_SAMPLE = Object.fromEntries(Object.keys(SUGAR_DEFAULTS).map((k) => [k, !blobs[k] || !!blobs[k]!._sample]));
  SUGAR_UPDATED = updated;

  const pr = [...rowsOf(d("sugarPrices"))].sort((a, b) => String(a.month).localeCompare(String(b.month)));
  S_MONTHS = pr.map((r) => monthLabel(String(r.month)));
  S_MONTH_KEYS = pr.map((r) => String(r.month));

  const ws = [...rowsOf(d("sugarWholesale"))].filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(String(r.date))).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  WS_DATES = ws.map((r) => String(r.date));
  WS = Object.fromEntries(WHOLESALE_CITIES.map((c) => [c.key, ws.map((r) => num(r[c.key]))]));

  const nc = [...rowsOf(d("sugarNcdex"))].filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(String(r.date))).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  NC_DATES = nc.map((r) => String(r.date));
  NC = Object.fromEntries(NCDEX_SERIES.map((s) => [s.key, nc.map((r) => num(r[s.key]))]));
  SUGAR_PRICES = PRICE_META.map((m) => ({ ...m, values: pr.map((r) => num(r[m.key]) as number) }));

  const cr = d("sugarCrushing");
  CRUSH_SUGAR = bySeason(rowsOf(cr), "fortnight", CRUSH_FORTNIGHT_LIST, "sugar");
  CRUSH_MILLS = bySeason(rowsOf(cr), "fortnight", CRUSH_FORTNIGHT_LIST, "mills");
  CRUSH_STATES = rowsOf(cr, "states").map((s) => ({ state: String(s.state ?? ""), mills: num(s.mills) ?? 0, cane: num(s.cane) ?? 0, sugar: num(s.sugar) ?? 0, recovery: num(s.recovery) ?? 0, ly: num(s.lastYear) ?? 0 }));
  CRUSH_AS_OF = String(cr.asOf ?? "");

  const pd = [...rowsOf(d("sugarProduction"))].sort((a, b) => seasonStart(a.season) - seasonStart(b.season));
  PROD_SEASONS = pd.map((r) => String(r.season));
  PROD_STATES = SUGAR_STATES.map((s) => ({ state: s.label, values: pd.map((r) => num(r[s.key]) ?? 0) }));
  DIVERSION = pd.map((r) => num(r.diversion) ?? 0);
  ETHANOL = [...rowsOf(d("sugarEthanol"))]
    .sort((a, b) => seasonStart(a.esy) - seasonStart(b.esy))
    .map((r) => ({ esy: String(r.esy), c_heavy: num(r.c_heavy), b_heavy: num(r.b_heavy), juice: num(r.juice) }));

  const cn = [...rowsOf(d("sugarCane"))].sort((a, b) => seasonStart(a.season) - seasonStart(b.season));
  CANE_YEARS = cn.map((r) => String(r.season));
  CANE_AREA = cn.map((r) => num(r.area));
  CANE_FRP = cn.map((r) => num(r.frp));
  CANE_SAP_UP = cn.map((r) => num(r.sap_up));

  const bs = [...rowsOf(d("sugarBalance"))].sort((a, b) => seasonStart(a.season) - seasonStart(b.season));
  BS_SEASONS = bs.map((r) => String(r.season));
  const col = (k: string) => bs.map((r) => num(r[k]) ?? 0);
  const net = bs.map((r) => (num(r.gross) ?? 0) - (num(r.diversion) ?? 0));
  const supply = bs.map((r, i) => (num(r.opening) ?? 0) + net[i] + (num(r.imports) ?? 0));
  const closing = bs.map((r, i) => supply[i] - (num(r.consumption) ?? 0) - (num(r.exports) ?? 0));
  const r1 = (a: number[]) => a.map((v) => Math.round(v * 10) / 10);
  BS_ROWS = [
    { key: "opening", label: "Opening stock (1 Oct)", values: col("opening") },
    { key: "gross", label: "Gross production", values: col("gross") },
    { key: "diversion", label: "Diversion to ethanol", values: col("diversion").map((v) => -v) },
    { key: "net", label: "Net production", bold: true, values: r1(net) },
    { key: "imports", label: "Imports", values: col("imports") },
    { key: "supply", label: "Total supply", bold: true, values: r1(supply) },
    { key: "consumption", label: "Domestic consumption", values: col("consumption") },
    { key: "exports", label: "Exports", values: col("exports") },
    { key: "closing", label: "Closing stock (30 Sep)", bold: true, values: r1(closing) },
  ];

  const tr = d("sugarTrade");
  EXPORTS = bySeason(rowsOf(tr), "month", TRADE_MONTH_LIST, "exports");
  EXPORT_DESTINATIONS = rowsOf(tr, "destinations").map((r) => ({ country: String(r.country ?? ""), share: num(r.share) ?? 0 }));
  EXPORT_QUOTA = num(tr.exportQuota);
  IMPORTS_TOTAL = num(tr.imports);

  const po = d("sugarPolicy");
  RELEASE_MONTHS = rowsOf(po, "release").map((r) => String(r.month));
  RELEASE_QUOTA = rowsOf(po, "release").map((r) => num(r.quota) ?? 0);
  POLICY = rowsOf(po, "items").map((r) => ({ item: String(r.item ?? ""), value: String(r.value ?? ""), note: String(r.note ?? "") }));
  SUGAR_MSP = num(po.msp);

  RAIN_STATES = rowsOf(d("sugarRainfall")).map((r) => ({ state: String(r.subdivision ?? ""), dev: ["jun", "jul", "aug", "sep"].map((m) => num(r[m])) }));

  const br = rowsOf(d("sugarBrazil"));
  const lastSlot = Math.max(0, ...br.map((r) => BR_FORTNIGHT_LIST.indexOf(String(r.fortnight))));
  BR_FORTNIGHTS = BR_FORTNIGHT_LIST.slice(0, lastSlot + 1);
  BR_SUGAR = bySeason(br, "fortnight", BR_FORTNIGHTS, "sugar", true);
  BR_MIX = bySeason(br, "fortnight", BR_FORTNIGHTS, "mix", true);

  const wd = d("sugarWorld");
  const wr = [...rowsOf(wd)].sort((a, b) => seasonStart(a.season) - seasonStart(b.season));
  WORLD_SEASONS = wr.map((r) => String(r.season));
  WORLD_PROD = wr.map((r) => num(r.production) ?? 0);
  WORLD_CONS = wr.map((r) => num(r.consumption) ?? 0);
  WORLD_TOP = rowsOf(wd, "top").map((r) => ({ country: String(r.country ?? ""), prod: num(r.production) ?? 0, exports: num(r.exports) ?? 0 }));

  const ct = [...rowsOf(d("sugarCftc"))].sort((a, b) => String(a.week).localeCompare(String(b.week))).slice(-52);
  COT_WEEKS = ct.map((r) => String(r.week));
  COT_MM_NET = ct.map((r) => num(r.net) ?? 0);
}

// the sample values until the database answers
hydrateSugar({});
