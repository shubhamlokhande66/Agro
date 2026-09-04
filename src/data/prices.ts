/**
 * Domestic cotton price series — ported from the legacy dashboard `DOM` /
 * `DOM_D_*` constants. Annual averages (May snapshots) 2012–2025 plus the
 * most recent month of daily quotes.
 */

export const DOM_YEARS = [
  "2012", "2013", "2014", "2015", "2016", "2017", "2018",
  "2019", "2020", "2021", "2022", "2023", "2024", "2025",
];

export const DOM_DAY_LABELS = [
  "2 May", "3 May", "5 May", "6 May", "8 May", "9 May", "12 May", "13 May",
  "14 May", "15 May", "16 May", "17 May", "19 May", "20 May", "21 May",
  "22 May", "23 May", "28 May", "29 May", "30 May", "31 May",
];

export type PriceKey =
  | "guj29" | "guj28" | "mmak29" | "mma28"
  | "phr28" | "cs30" | "cs31"
  | "kapas" | "cseed" | "coilc" | "yarn";

export type Variety = {
  key: PriceKey;
  title: string;
  sub: string;
  group: string;
  annual: number[];
  daily: number[];
};

export const VARIETIES: Variety[] = [
  {
    key: "guj29", title: "Gujarat Shankar-29 (Guj-29)", sub: "Rajkot Spot Market · ₹ / Candy",
    group: "Gujarat Varieties",
    annual: [33568, 37688, 42118, 34890, 35309, 42387, 42243, 45287, 35314, 46714, 99559, 59539, 57350, 54271],
    daily: [54400, 54600, 54700, 54700, 54600, 54400, 54500, 54400, 54400, 54300, 54200, 54200, 54200, 54100, 54000, 54000, 54000, 54000, 54000, 54000, 54000],
  },
  {
    key: "guj28", title: "Gujarat Shankar-28 (Guj-28)", sub: "Rajkot Spot Market · ₹ / Candy",
    group: "Gujarat Varieties",
    annual: [32968, 37223, 41559, 34290, 34723, 41074, 41226, 44500, 33995, 45390, 97718, 58470, 56350, 53086],
    daily: [53400, 53600, 53700, 53300, 53200, 53000, 53100, 53000, 53000, 52900, 52800, 52800, 53000, 53000, 53000, 53000, 53000, 53000, 53000, 53000, 53000],
  },
  {
    key: "mmak29", title: "MMAK Shankar-29 (MMAK-29)", sub: "Maharashtra · ₹ / Candy",
    group: "Maharashtra Varieties",
    annual: [33618, 37450, 41777, 35010, 35527, 41865, 41278, 45300, 35357, 46390, 101191, 58843, 57375, 54714],
    daily: [55100, 55300, 55200, 55200, 55100, 54900, 55000, 55000, 54900, 54900, 54700, 54600, 54600, 54500, 54400, 54400, 54400, 54200, 54200, 54200, 54200],
  },
  {
    key: "mma28", title: "MMA Shankar-28 (MMA-28)", sub: "Maharashtra · ₹ / Candy",
    group: "Maharashtra Varieties",
    annual: [32768, 36819, 40295, 34171, 34732, 40648, 39387, 44243, 34333, 45038, 98482, 57609, 55912, 53167],
    daily: [54100, 54300, 54300, 53300, 53200, 53000, 53100, 53100, 53000, 53000, 52800, 52700, 53100, 53100, 53100, 53100, 53000, 52800, 52800, 52800, 52800],
  },
  {
    key: "phr28", title: "Punjab / Haryana-28 (PHR-28)", sub: "North India · ₹ / Candy",
    group: "North & Central India",
    annual: [34168, 37442, 45659, 36204, 36286, 44339, 42673, 46700, 34604, 44023, 98745, 59169, 55175, 55028],
    daily: [55000, 55200, 55200, 55300, 55400, 55400, 55300, 55200, 55200, 55100, 55100, 55100, 55000, 54900, 54900, 54900, 54800, 54700, 54700, 54600, 54600],
  },
  {
    key: "cs30", title: "Central India CS-30", sub: "MP / Vidarbha · ₹ / Candy",
    group: "North & Central India",
    annual: [34277, 38254, 42664, 35890, 36477, 42970, 42678, 46570, 35800, 48395, 103923, 59722, 58462, 55662],
    daily: [56000, 56200, 56200, 56200, 56200, 56000, 56000, 56000, 55900, 55900, 55700, 55700, 55700, 55500, 55400, 55400, 55300, 54800, 54800, 55000, 55000],
  },
  {
    key: "cs31", title: "Central India CS-31", sub: "MP / Vidarbha · ₹ / Candy",
    group: "North & Central India",
    annual: [35014, 39142, 43695, 36643, 37468, 44035, 43630, 47448, 37257, 49071, 105659, 60552, 59725, 56686],
    daily: [56600, 56700, 57000, 57000, 57000, 57000, 57000, 57000, 57000, 57000, 56800, 56800, 56800, 56600, 56500, 56400, 56200, 56100, 56300, 56300, 56300],
  },
  {
    key: "kapas", title: "Kapas (Raw Cotton)", sub: "Farm Gate · ₹ / Quintal",
    group: "By-products",
    annual: [5035, 5653, 6318, 5234, 5296, 6358, 6337, 6793, 5297, 7007, 14934, 8931, 8602, 8141],
    daily: [8160, 8190, 8205, 8205, 8190, 8160, 8175, 8160, 8160, 8145, 8130, 8130, 8130, 8115, 8100, 8100, 8100, 8100, 8100, 8100, 8100],
  },
  {
    key: "cseed", title: "Cotton Seed", sub: "By-product · ₹ / Quintal",
    group: "By-products",
    annual: [2266, 2544, 2843, 2355, 2383, 2861, 2851, 3057, 2384, 3153, 6720, 4019, 3871, 3663],
    daily: [3672, 3685, 3692, 3692, 3685, 3672, 3678, 3672, 3672, 3665, 3658, 3658, 3658, 3651, 3645, 3645, 3645, 3645, 3645, 3645, 3645],
  },
  {
    key: "coilc", title: "Cotton Oil Cake", sub: "Animal Feed · ₹ / Quintal",
    group: "By-products",
    annual: [2039, 2290, 2559, 2120, 2145, 2575, 2566, 2751, 2145, 2838, 6048, 3617, 3484, 2931],
    daily: [2937, 2948, 2953, 2953, 2948, 2937, 2943, 2937, 2937, 2932, 2926, 2926, 2926, 2921, 2916, 2916, 2916, 2916, 2916, 2916, 2916],
  },
  {
    key: "yarn", title: "Cotton Yarn", sub: "Downstream · ₹ / Candy",
    group: "By-products",
    annual: [204, 229, 256, 212, 215, 258, 257, 275, 215, 284, 605, 362, 348, 293],
    daily: [293, 294, 295, 295, 294, 293, 294, 293, 293, 293, 292, 292, 292, 292, 291, 291, 291, 291, 291, 291, 291],
  },
];

export const VARIETY_GROUPS = [
  "Gujarat Varieties",
  "Maharashtra Varieties",
  "North & Central India",
  "By-products",
];

export type DomPeriod = "monthly" | "1y" | "3y" | "all";

export const DOM_PERIOD_OPTS: { value: DomPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "1y", label: "1Y" },
  { value: "3y", label: "3Y" },
  { value: "all", label: "All" },
];

export type PriceOverride = {
  years: string[];
  series: Partial<Record<PriceKey, number[]>>;
};

/** apply an uploaded override on top of the bundled variety list */
export function applyPriceOverride(base: Variety[], ov?: PriceOverride): Variety[] {
  if (!ov) return base;
  return base.map((v) => {
    const col = ov.series[v.key];
    return col && col.length ? { ...v, annual: col } : v;
  });
}

export const PRICES_STORE_KEY = "prices";

/** slice an annual series (or the daily set) for the chosen period */
export function sliceVariety(
  v: Variety,
  period: DomPeriod,
  years: string[] = DOM_YEARS,
) {
  if (period === "monthly") {
    return { labels: DOM_DAY_LABELS as (string | number)[], data: v.daily };
  }
  const n = years.length;
  const start =
    period === "1y" ? Math.max(0, n - 2) : period === "3y" ? Math.max(0, n - 7) : 0;
  return {
    labels: years.slice(start) as (string | number)[],
    data: v.annual.slice(start),
  };
}
