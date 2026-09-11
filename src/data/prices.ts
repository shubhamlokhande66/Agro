/**
 * Domestic cotton price series. Values are loaded from the database at runtime
 * (see DatasetProvider); this module only holds types + live bindings.
 */

import { shortDate } from "@/lib/format";

export type PriceKey = string;

/** one yearly average, e.g. { year: "2025", value: 54271 } */
export type AnnualPoint = { year: string; value: number };
/** one dated daily quote, e.g. { date: "2026-05-02", price: 54000 } */
export type PricePoint = { date: string; price: number };

export type Variety = {
  key: PriceKey;
  title: string;
  sub: string;
  group: string;
  /** yearly averages — added one year at a time in admin */
  annual: AnnualPoint[];
  /** dated daily quotes, any date range — added one at a time in admin */
  daily: PricePoint[];
};

export type PricesBlob = {
  groups: string[];
  varieties: Variety[];
};

export let VARIETY_GROUPS: string[] = [];
export let VARIETIES: Variety[] = [];

export function __hydratePrices(b: PricesBlob) {
  VARIETY_GROUPS = b.groups ?? [];
  VARIETIES = (b.varieties ?? []).map((v) => ({
    ...v,
    annual: Array.isArray(v.annual)
      ? v.annual.filter((p): p is AnnualPoint => !!p && typeof p.year === "string" && typeof p.value === "number")
      : [],
    daily: Array.isArray(v.daily)
      ? v.daily.filter((p): p is PricePoint => !!p && typeof p.date === "string" && typeof p.price === "number")
      : [],
  }));
}

export type DomPeriod = "monthly" | "1y" | "3y" | "all";

export const DOM_PERIOD_OPTS: { value: DomPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "1y", label: "1Y" },
  { value: "3y", label: "3Y" },
  { value: "all", label: "All" },
];

export const PRICES_STORE_KEY = "prices";

const sortedAnnual = (v: Variety) => [...(v.annual ?? [])].sort((a, b) => a.year.localeCompare(b.year));
const sortedDaily = (v: Variety) => [...(v.daily ?? [])].sort((a, b) => a.date.localeCompare(b.date));

/** most recent yearly average for a variety, or null if it has none yet */
export function latestAnnual(v: Variety): AnnualPoint | null {
  return sortedAnnual(v).at(-1) ?? null;
}

/** most recent dated quote for a variety, or null if it has none yet */
export function latestDaily(v: Variety): PricePoint | null {
  return sortedDaily(v).at(-1) ?? null;
}

/** the last ~month of daily quotes as a plain chronological number[] — for sparklines etc. */
export function recentPrices(v: Variety): number[] {
  return sliceVariety(v, "monthly").data;
}

/** slice a variety's yearly averages (or the last ~month of dated daily quotes) for the chosen period */
export function sliceVariety(v: Variety, period: DomPeriod) {
  if (period === "monthly") {
    const sorted = sortedDaily(v);
    if (sorted.length === 0) return { labels: [] as (string | number)[], data: [] as number[] };
    const latestTime = new Date(sorted.at(-1)!.date + "T00:00:00").getTime();
    const cutoff = latestTime - 31 * 86400000;
    const windowed = sorted.filter((p) => new Date(p.date + "T00:00:00").getTime() >= cutoff);
    return {
      labels: windowed.map((p) => shortDate(p.date)),
      data: windowed.map((p) => p.price),
    };
  }
  const sorted = sortedAnnual(v);
  const n = sorted.length;
  const start = period === "1y" ? Math.max(0, n - 2) : period === "3y" ? Math.max(0, n - 7) : 0;
  const windowed = sorted.slice(start);
  return {
    labels: windowed.map((p) => p.year) as (string | number)[],
    data: windowed.map((p) => p.value),
  };
}
