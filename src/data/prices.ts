/**
 * Domestic cotton price series. Values are loaded from the database at runtime
 * (see DatasetProvider); this module only holds types + live bindings.
 */

export type PriceKey = string;

export type Variety = {
  key: PriceKey;
  title: string;
  sub: string;
  group: string;
  annual: number[];
  daily: number[];
};

export type PricesBlob = {
  years: string[];
  dayLabels: string[];
  groups: string[];
  varieties: Variety[];
};

export let DOM_YEARS: string[] = [];
export let DOM_DAY_LABELS: string[] = [];
export let VARIETY_GROUPS: string[] = [];
export let VARIETIES: Variety[] = [];

export function __hydratePrices(b: PricesBlob) {
  DOM_YEARS = b.years ?? [];
  DOM_DAY_LABELS = b.dayLabels ?? [];
  VARIETY_GROUPS = b.groups ?? [];
  VARIETIES = b.varieties ?? [];
}

export type DomPeriod = "monthly" | "1y" | "3y" | "all";

export const DOM_PERIOD_OPTS: { value: DomPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "1y", label: "1Y" },
  { value: "3y", label: "3Y" },
  { value: "all", label: "All" },
];

export const PRICES_STORE_KEY = "prices";

/** slice an annual series (or the daily set) for the chosen period */
export function sliceVariety(
  v: Variety,
  period: DomPeriod,
  years: string[] = DOM_YEARS,
) {
  const annual = v.annual ?? [];
  const daily = v.daily ?? [];
  if (period === "monthly") {
    return { labels: DOM_DAY_LABELS as (string | number)[], data: daily };
  }
  const n = years.length;
  const start =
    period === "1y" ? Math.max(0, n - 2) : period === "3y" ? Math.max(0, n - 7) : 0;
  return {
    labels: years.slice(start) as (string | number)[],
    data: annual.slice(start),
  };
}
