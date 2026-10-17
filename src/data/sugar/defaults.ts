/**
 * Starting values for the sugar dashboard's datasets — SAMPLE placeholders, written to the
 * database (flagged `_sample: true`) the first time the dashboard loads. Editing a dataset in
 * Sugar Admin clears the flag and its page's "Sample data" banner.
 * Plain module (no React) so the server can seed from it.
 */

/** deterministic pseudo-random walk, so the sample charts are stable */
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

/** the 24 months Nov 2024 … Oct 2026 as "YYYY-MM" */
const MONTH_KEYS = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(Date.UTC(2024, 10 + i, 1));
  return d.toISOString().slice(0, 7);
});

export const SUGAR_STATES = [
  { key: "maharashtra", label: "Maharashtra" },
  { key: "uttar_pradesh", label: "Uttar Pradesh" },
  { key: "karnataka", label: "Karnataka" },
  { key: "gujarat", label: "Gujarat" },
  { key: "tamil_nadu", label: "Tamil Nadu" },
  { key: "others", label: "Others" },
] as const;

export const CRUSH_FORTNIGHT_LIST = ["15 Nov", "30 Nov", "15 Dec", "31 Dec", "15 Jan", "31 Jan", "15 Feb", "28 Feb", "15 Mar", "31 Mar", "15 Apr", "30 Apr"];
export const BR_FORTNIGHT_LIST = ["1H Apr", "2H Apr", "1H May", "2H May", "1H Jun", "2H Jun", "1H Jul", "2H Jul", "1H Aug", "2H Aug", "1H Sep", "2H Sep", "1H Oct", "2H Oct", "1H Nov", "2H Nov", "1H Dec", "2H Dec"];
export const TRADE_MONTH_LIST = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

const prices = (() => {
  const s = {
    ice11: walk(53, 24, 21.5, 1.4, -0.12),
    ldn5: walk(67, 24, 610, 22, -3.2),
    usdinr: walk(79, 24, 84, 0.45, 0.4),
    molasses: walk(91, 24, 9800, 260, 30),
  };
  return MONTH_KEYS.map((month, i) => ({
    month,
    ...Object.fromEntries(Object.entries(s).map(([k, v]) => [k, k === "ice11" || k === "usdinr" ? v[i] : Math.round(v[i] * 10) / 10])),
  }));
})();

const crushSugar: Record<string, (number | null)[]> = {
  "2024-25": [16, 43, 77, 113, 145, 175, 197, 219, 237, 249, 255, 258],
  "2025-26": [19, 49, 86, 126, 161, null, null, null, null, null, null, null],
};
const crushMills: Record<string, (number | null)[]> = {
  "2024-25": [395, 482, 498, 500, 499, 487, 452, 380, 260, 140, 72, 40],
  "2025-26": [410, 495, 512, 516, 514, null, null, null, null, null, null, null],
};
const brSugar: Record<string, (number | null)[]> = {
  "2024-25": [0.8, 2.5, 5.0, 7.9, 11.0, 14.2, 17.6, 21.3, 25.0, 28.4, 31.4, 34.0, 36.1, 37.8],
  "2025-26": [0.6, 2.2, 4.4, 7.0, 10.0, 13.1, 16.4, 20.0, 23.6, 27.0, 30.2, 33.1, 35.4, null],
};
const brMix: Record<string, (number | null)[]> = {
  "2024-25": [45.2, 47.5, 49.4, 50.6, 51.3, 51.9, 52.3, 52.6, 52.5, 52.1, 51.5, 50.6, 49.8, 48.9],
  "2025-26": [47.8, 49.1, 50.6, 51.9, 52.8, 53.4, 53.9, 54.2, 54.0, 53.6, 52.9, 52.0, 51.1, null],
};
const exportsBySeason: Record<string, (number | null)[]> = {
  "2024-25": [0, 0, 0, 0.2, 1.4, 2.1, 1.8, 1.2, 0.8, 0.4, 0.2, 0.1],
  "2025-26": [0, 0, 0.6, 1.9, 2.8, null, null, null, null, null, null, null],
};
const prod: [string, number[]][] = [
  ["2021-22", [137.3, 101.6, 59.8, 11.6, 9.5, 39.6]],
  ["2022-23", [105.3, 104.8, 55.2, 10.1, 11.8, 41.5]],
  ["2023-24", [110.2, 103.6, 51.6, 9.2, 9.9, 35.8]],
  ["2024-25", [80.9, 92.8, 40.4, 8.3, 8.9, 30.1]],
  ["2025-26 (E)", [94.0, 98.5, 48.0, 9.0, 9.6, 33.4]],
];
const diversion = [36, 43, 21, 35, 40];

export const SUGAR_DEFAULTS: Record<string, Record<string, unknown>> = {
  // filled by the daily Chinimandi sync — nothing to sample
  sugarWholesale: { rows: [] },
  sugarPrices: { rows: prices },
  sugarCrushing: {
    asOf: "",
    rows: Object.entries(crushSugar).flatMap(([season, vals]) =>
      vals.map((sugar, i) => ({ season, fortnight: CRUSH_FORTNIGHT_LIST[i], sugar, mills: crushMills[season][i] })).filter((r) => r.sugar != null),
    ),
    states: [
      { state: "Uttar Pradesh", mills: 121, cane: 610, sugar: 58.6, recovery: 9.6, lastYear: 54.2 },
      { state: "Maharashtra", mills: 201, cane: 545, sugar: 52.3, recovery: 9.6, lastYear: 47.1 },
      { state: "Karnataka", mills: 78, cane: 290, sugar: 27.5, recovery: 9.5, lastYear: 25.3 },
      { state: "Gujarat", mills: 15, cane: 58, sugar: 5.9, recovery: 10.2, lastYear: 5.5 },
      { state: "Tamil Nadu", mills: 26, cane: 42, sugar: 3.6, recovery: 8.6, lastYear: 3.2 },
      { state: "Others", mills: 73, cane: 140, sugar: 13.1, recovery: 9.4, lastYear: 11.8 },
    ],
  },
  sugarProduction: {
    rows: prod.map(([season, v], i) => ({ season, ...Object.fromEntries(SUGAR_STATES.map((s, j) => [s.key, v[j]])), diversion: diversion[i] })),
  },
  sugarEthanol: {
    rows: [
      { esy: "2021-22", c_heavy: 49.41, b_heavy: 59.08, juice: 63.45 },
      { esy: "2022-23", c_heavy: 49.41, b_heavy: 60.73, juice: 65.61 },
      { esy: "2023-24", c_heavy: 56.28, b_heavy: 60.73, juice: 65.61 },
      { esy: "2024-25", c_heavy: 57.97, b_heavy: 60.73, juice: 65.61 },
    ],
  },
  sugarCane: {
    rows: [
      { season: "2021-22", area: 55.6, frp: 290, sap_up: 350 },
      { season: "2022-23", area: 58.8, frp: 305, sap_up: 350 },
      { season: "2023-24", area: 57.0, frp: 315, sap_up: 370 },
      { season: "2024-25", area: 56.0, frp: 340, sap_up: 370 },
      { season: "2025-26", area: 57.8, frp: 355, sap_up: 400 },
    ],
  },
  sugarBalance: {
    rows: [
      { season: "2022-23", opening: 70.0, gross: 372.5, diversion: 43.0, imports: 0.5, consumption: 279.0, exports: 63.9 },
      { season: "2023-24", opening: 57.1, gross: 340.6, diversion: 21.5, imports: 0.3, consumption: 290.0, exports: 6.6 },
      { season: "2024-25", opening: 79.9, gross: 296.5, diversion: 35.0, imports: 0.2, consumption: 281.0, exports: 8.2 },
      { season: "2025-26 (E)", opening: 52.4, gross: 332.5, diversion: 40.0, imports: 0.2, consumption: 284.0, exports: 12.0 },
    ],
  },
  sugarTrade: {
    exportQuota: 15,
    imports: 0.2,
    rows: Object.entries(exportsBySeason).flatMap(([season, vals]) =>
      vals.map((exports, i) => ({ season, month: TRADE_MONTH_LIST[i], exports })).filter((r) => r.exports != null),
    ),
    destinations: [
      { country: "Afghanistan", share: 21 },
      { country: "Sri Lanka", share: 17 },
      { country: "Somalia", share: 12 },
      { country: "Djibouti", share: 10 },
      { country: "UAE", share: 9 },
      { country: "Others", share: 31 },
    ],
  },
  sugarPolicy: {
    msp: 31,
    release: [
      ["Nov 25", 22.0], ["Dec 25", 22.5], ["Jan 26", 22.0], ["Feb 26", 22.5], ["Mar 26", 23.5], ["Apr 26", 23.5],
      ["May 26", 25.5], ["Jun 26", 25.5], ["Jul 26", 24.0], ["Aug 26", 23.5], ["Sep 26", 23.5], ["Oct 26", 24.0],
    ].map(([month, quota]) => ({ month, quota })),
    items: [
      { item: "Minimum selling price (MSP) of sugar", value: "₹31 / kg", note: "unchanged since 2019" },
      { item: "Export policy 2025-26", value: "Quota 15 LMT", note: "restricted category" },
      { item: "FRP of cane 2025-26", value: "₹355 / quintal", note: "at 10.25% recovery" },
      { item: "Ethanol blending target", value: "20% (E20)", note: "ESY 2025-26" },
      { item: "Stock limit / disclosure", value: "Weekly stock reporting", note: "on the DFPD portal" },
    ],
  },
  sugarRainfall: {
    rows: [
      { subdivision: "West UP", jun: -12, jul: 8, aug: 15, sep: -4 },
      { subdivision: "East UP", jun: -30, jul: -6, aug: 4, sep: 11 },
      { subdivision: "Madhya Maharashtra", jun: 22, jul: 35, aug: -10, sep: 18 },
      { subdivision: "Marathwada", jun: -8, jul: 14, aug: 27, sep: 40 },
      { subdivision: "North Karnataka", jun: 5, jul: 18, aug: -12, sep: 9 },
    ],
  },
  sugarBrazil: {
    rows: Object.entries(brSugar).flatMap(([season, vals]) =>
      vals.map((sugar, i) => ({ season, fortnight: BR_FORTNIGHT_LIST[i], sugar, mix: brMix[season][i] })).filter((r) => r.sugar != null),
    ),
  },
  sugarWorld: {
    rows: [
      { season: "2021-22", production: 174.0, consumption: 174.2 },
      { season: "2022-23", production: 177.2, consumption: 177.3 },
      { season: "2023-24", production: 180.1, consumption: 178.9 },
      { season: "2024-25", production: 175.0, consumption: 177.9 },
      { season: "2025-26 (F)", production: 181.8, consumption: 179.2 },
    ],
    top: [
      { country: "Brazil", production: 44.7, exports: 35.0 },
      { country: "India", production: 31.0, exports: 1.2 },
      { country: "EU", production: 15.6, exports: 1.0 },
      { country: "Thailand", production: 10.3, exports: 7.5 },
      { country: "China", production: 11.2, exports: 0.2 },
      { country: "USA", production: 8.4, exports: 0.1 },
    ],
  },
  sugarCftc: {
    rows: (() => {
      const net = walk(131, 52, -45000, 14000, -900);
      return net.map((v, i) => ({ week: new Date(Date.UTC(2025, 9, 14) + i * 7 * 86400000).toISOString().slice(0, 10), net: Math.round(v) }));
    })(),
  },
};

export const SUGAR_DATASET_KEYS = Object.keys(SUGAR_DEFAULTS);
