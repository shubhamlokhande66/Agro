/**
 * SAMPLE DATA for the sugar dashboard's first build — every number here is a placeholder so the
 * pages can be laid out and reviewed. Each block names the source it is expected to come from;
 * as sources are confirmed, blocks move to real datasets (admin-editable / auto-synced) and the
 * page's "sample data" banner disappears.
 */

/** deterministic pseudo-random walk, so the sample charts don't change on every load */
function walk(seed: number, n: number, start: number, step: number, drift = 0): number[] {
  let x = seed;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280) - 0.5;
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    v = v + rnd() * step + drift;
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** the last 24 months, "Nov 24" … "Oct 26" */
export const S_MONTHS = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(2024, 10 + i, 1);
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
});

/* ── prices ─────────────────────────────────────────────────────────────── */
// expected source: domestic — mill tender / trade quotes (Kolhapur, Muzaffarnagar, Vashi, Belgaum);
// ICE No.11 and London No.5 — exchange settlements; ethanol — OMC procurement prices (GoI)
export type SugarPriceSeries = { key: string; label: string; unit: string; group: "domestic" | "global" | "byproduct"; values: number[]; digits: number };

export const SUGAR_PRICES: SugarPriceSeries[] = [
  { key: "s30_kolhapur", label: "S-30 ex-mill · Kolhapur (MH)", unit: "₹/quintal", group: "domestic", values: walk(11, 24, 3720, 70, 6), digits: 0 },
  { key: "m30_muzaffarnagar", label: "M-30 ex-mill · Muzaffarnagar (UP)", unit: "₹/quintal", group: "domestic", values: walk(23, 24, 3980, 70, 7), digits: 0 },
  { key: "s30_belgaum", label: "S-30 ex-mill · Belgaum (KA)", unit: "₹/quintal", group: "domestic", values: walk(37, 24, 3700, 70, 6), digits: 0 },
  { key: "s30_vashi", label: "S-30 wholesale · Vashi (Mumbai)", unit: "₹/quintal", group: "domestic", values: walk(41, 24, 3840, 70, 6), digits: 0 },
  { key: "ice11", label: "ICE Raw Sugar No.11", unit: "US¢/lb", group: "global", values: walk(53, 24, 21.5, 1.4, -0.12), digits: 2 },
  { key: "ldn5", label: "London White Sugar No.5", unit: "US$/tonne", group: "global", values: walk(67, 24, 610, 22, -3.2), digits: 1 },
  { key: "usdinr", label: "USD / INR", unit: "₹ per US$", group: "global", values: walk(79, 24, 84, 0.45, 0.4), digits: 2 },
  { key: "ethanol_bheavy", label: "Ethanol · B-heavy molasses", unit: "₹/litre", group: "byproduct", values: Array(24).fill(60.73), digits: 2 },
  { key: "ethanol_juice", label: "Ethanol · cane juice / syrup", unit: "₹/litre", group: "byproduct", values: Array(24).fill(65.61), digits: 2 },
  { key: "molasses", label: "Molasses (C-heavy)", unit: "₹/tonne", group: "byproduct", values: walk(91, 24, 9800, 260, 30), digits: 0 },
];
export const sugarPrice = (key: string) => SUGAR_PRICES.find((p) => p.key === key)!;

/** white premium = London No.5 − ICE No.11 converted to $/t (1 ¢/lb = 22.0462 $/t) */
export const whitePremium = () => {
  const w = sugarPrice("ldn5").values;
  const r = sugarPrice("ice11").values;
  return w.map((v, i) => Math.round((v - r[i] * 22.0462) * 10) / 10);
};

/* ── crushing progress (fortnightly, current season vs last) ───────────── */
// expected source: ISMA / NFCSF fortnightly crushing reports
export const CRUSH_FORTNIGHTS = ["15 Nov", "30 Nov", "15 Dec", "31 Dec", "15 Jan", "31 Jan", "15 Feb", "28 Feb", "15 Mar", "31 Mar", "15 Apr", "30 Apr"];
export const CRUSH_SEASONS = ["2024-25", "2025-26"] as const;
/** cumulative sugar produced, lakh tonnes */
export const CRUSH_SUGAR: Record<string, (number | null)[]> = {
  "2024-25": [16, 43, 77, 113, 145, 175, 197, 219, 237, 249, 255, 258],
  "2025-26": [19, 49, 86, 126, 161, null, null, null, null, null, null, null],
};
/** mills operating at each fortnight */
export const CRUSH_MILLS: Record<string, (number | null)[]> = {
  "2024-25": [395, 482, 498, 500, 499, 487, 452, 380, 260, 140, 72, 40],
  "2025-26": [410, 495, 512, 516, 514, null, null, null, null, null, null, null],
};
/** latest fortnight, by state — mills, cane crushed (lakh t), sugar (lakh t), recovery % */
export const CRUSH_STATES = [
  { state: "Uttar Pradesh", mills: 121, cane: 610, sugar: 58.6, recovery: 9.6, ly: 54.2 },
  { state: "Maharashtra", mills: 201, cane: 545, sugar: 52.3, recovery: 9.6, ly: 47.1 },
  { state: "Karnataka", mills: 78, cane: 290, sugar: 27.5, recovery: 9.5, ly: 25.3 },
  { state: "Gujarat", mills: 15, cane: 58, sugar: 5.9, recovery: 10.2, ly: 5.5 },
  { state: "Tamil Nadu", mills: 26, cane: 42, sugar: 3.6, recovery: 8.6, ly: 3.2 },
  { state: "Others", mills: 73, cane: 140, sugar: 13.1, recovery: 9.4, ly: 11.8 },
];

/* ── production by state (season totals, lakh tonnes, after ethanol diversion) ── */
// expected source: ISMA / NFCSF season estimates; DFPD
export const PROD_SEASONS = ["2021-22", "2022-23", "2023-24", "2024-25", "2025-26 (E)"];
export const PROD_STATES: { state: string; values: number[] }[] = [
  { state: "Maharashtra", values: [137.3, 105.3, 110.2, 80.9, 94.0] },
  { state: "Uttar Pradesh", values: [101.6, 104.8, 103.6, 92.8, 98.5] },
  { state: "Karnataka", values: [59.8, 55.2, 51.6, 40.4, 48.0] },
  { state: "Gujarat", values: [11.6, 10.1, 9.2, 8.3, 9.0] },
  { state: "Tamil Nadu", values: [9.5, 11.8, 9.9, 8.9, 9.6] },
  { state: "Others", values: [39.6, 41.5, 35.8, 30.1, 33.4] },
];
/** sugar diverted to ethanol, lakh tonnes */
export const DIVERSION = [36, 43, 21, 35, 40];

/* ── cane ───────────────────────────────────────────────────────────────── */
// expected source: Ministry of Agriculture (area), CACP / cabinet (FRP), state govts (SAP)
export const CANE_YEARS = ["2021-22", "2022-23", "2023-24", "2024-25", "2025-26"];
export const CANE_AREA = [55.6, 58.8, 57.0, 56.0, 57.8]; // lakh ha
export const CANE_FRP = [290, 305, 315, 340, 355]; // ₹/quintal at 10.25% recovery
export const CANE_SAP_UP = [350, 350, 370, 370, 400]; // ₹/quintal, UP state advised price

/* ── balance sheet (Oct–Sep, lakh tonnes) ───────────────────────────────── */
// expected source: ISMA / AISTA balance sheets, DFPD; Agrolytix estimates
export const BS_SEASONS = ["2022-23", "2023-24", "2024-25", "2025-26 (E)"];
export const BS_ROWS: { key: string; label: string; bold?: boolean; values: number[] }[] = [
  { key: "opening", label: "Opening stock (1 Oct)", values: [70.0, 57.1, 79.9, 52.4] },
  { key: "gross", label: "Gross production", values: [372.5, 340.6, 296.5, 332.5] },
  { key: "diversion", label: "Diversion to ethanol", values: [-43.0, -21.5, -35.0, -40.0] },
  { key: "net", label: "Net production", bold: true, values: [329.5, 319.1, 261.5, 292.5] },
  { key: "imports", label: "Imports", values: [0.5, 0.3, 0.2, 0.2] },
  { key: "supply", label: "Total supply", bold: true, values: [400.0, 376.5, 341.6, 345.1] },
  { key: "consumption", label: "Domestic consumption", values: [279.0, 290.0, 281.0, 284.0] },
  { key: "exports", label: "Exports", values: [63.9, 6.6, 8.2, 12.0] },
  { key: "closing", label: "Closing stock (30 Sep)", bold: true, values: [57.1, 79.9, 52.4, 49.1] },
];

/* ── trade (monthly, lakh tonnes) ──────────────────────────────────────── */
// expected source: DGCIS / Commerce Ministry, AISTA shipment data
export const TRADE_MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
export const EXPORTS: Record<string, (number | null)[]> = {
  "2024-25": [0, 0, 0, 0.2, 1.4, 2.1, 1.8, 1.2, 0.8, 0.4, 0.2, 0.1],
  "2025-26": [0, 0, 0.6, 1.9, 2.8, null, null, null, null, null, null, null],
};
export const EXPORT_DESTINATIONS = [
  { country: "Afghanistan", share: 21 },
  { country: "Sri Lanka", share: 17 },
  { country: "Somalia", share: 12 },
  { country: "Djibouti", share: 10 },
  { country: "UAE", share: 9 },
  { country: "Others", share: 31 },
];

/* ── policy ─────────────────────────────────────────────────────────────── */
// expected source: DFPD monthly release orders, notifications
export const RELEASE_MONTHS = ["Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26", "Oct 26"];
export const RELEASE_QUOTA = [22.0, 22.5, 22.0, 22.5, 23.5, 23.5, 25.5, 25.5, 24.0, 23.5, 23.5, 24.0]; // lakh tonnes
export const POLICY = [
  { item: "Minimum selling price (MSP) of sugar", value: "₹31 / kg", note: "unchanged since 2019" },
  { item: "Export policy 2025-26", value: "Quota 15 LMT", note: "restricted category" },
  { item: "FRP of cane 2025-26", value: "₹355 / quintal", note: "at 10.25% recovery" },
  { item: "Ethanol blending target", value: "20% (E20)", note: "ESY 2025-26" },
  { item: "Stock limit / disclosure", value: "Weekly stock reporting", note: "on the DFPD portal" },
];

/* ── weather: cane belt monthly rainfall vs normal, % deviation ─────────── */
// expected source: IMD subdivision rainfall (same feed as the weather dashboard)
export const RAIN_MONTHS = ["Jun", "Jul", "Aug", "Sep"];
export const RAIN_STATES = [
  { state: "West UP", dev: [-12, 8, 15, -4] },
  { state: "East UP", dev: [-30, -6, 4, 11] },
  { state: "Madhya Maharashtra", dev: [22, 35, -10, 18] },
  { state: "Marathwada", dev: [-8, 14, 27, 40] },
  { state: "North Karnataka", dev: [5, 18, -12, 9] },
];

/* ── Brazil Centre-South (UNICA, fortnightly cumulative) ────────────────── */
// expected source: UNICA fortnightly reports
export const BR_FORTNIGHTS = ["1H Apr", "2H Apr", "1H May", "2H May", "1H Jun", "2H Jun", "1H Jul", "2H Jul", "1H Aug", "2H Aug", "1H Sep", "2H Sep", "1H Oct", "2H Oct"];
export const BR_SUGAR: Record<string, (number | null)[]> = {
  "2025-26": [0.6, 2.2, 4.4, 7.0, 10.0, 13.1, 16.4, 20.0, 23.6, 27.0, 30.2, 33.1, 35.4, null],
  "2024-25": [0.8, 2.5, 5.0, 7.9, 11.0, 14.2, 17.6, 21.3, 25.0, 28.4, 31.4, 34.0, 36.1, 37.8],
};
export const BR_MIX: Record<string, (number | null)[]> = {
  "2025-26": [47.8, 49.1, 50.6, 51.9, 52.8, 53.4, 53.9, 54.2, 54.0, 53.6, 52.9, 52.0, 51.1, null],
  "2024-25": [45.2, 47.5, 49.4, 50.6, 51.3, 51.9, 52.3, 52.6, 52.5, 52.1, 51.5, 50.6, 49.8, 48.9],
};

/* ── world balance (Oct–Sep, million tonnes raw value) ─────────────────── */
// expected source: ISO quarterly balance, USDA FAS Sugar: World Markets and Trade
export const WORLD_SEASONS = ["2021-22", "2022-23", "2023-24", "2024-25", "2025-26 (F)"];
export const WORLD_PROD = [174.0, 177.2, 180.1, 175.0, 181.8];
export const WORLD_CONS = [174.2, 177.3, 178.9, 177.9, 179.2];
export const WORLD_TOP = [
  { country: "Brazil", prod: 44.7, exports: 35.0 },
  { country: "India", prod: 31.0, exports: 1.2 },
  { country: "EU", prod: 15.6, exports: 1.0 },
  { country: "Thailand", prod: 10.3, exports: 7.5 },
  { country: "China", prod: 11.2, exports: 0.2 },
  { country: "USA", prod: 8.4, exports: 0.1 },
];

/* ── CFTC sugar No.11 (weekly, managed money net, contracts) ───────────── */
// expected source: CFTC Commitments of Traders (disaggregated, futures only)
export const COT_WEEKS = Array.from({ length: 52 }, (_, i) => {
  const d = new Date(Date.UTC(2025, 9, 14) + i * 7 * 86400000);
  return d.toISOString().slice(0, 10);
});
export const COT_MM_NET = walk(131, 52, -45000, 14000, -900).map((v) => Math.round(v));
