/** USDA WASDE world cotton balance — one snapshot per monthly report, synced automatically from
 *  USDA (src/lib/server/wasde.ts). Values are stored as published: million 480-lb bales. */

export type WasdeRow = {
  beginningStocks: number;
  production: number;
  imports: number;
  domesticUse: number;
  exports: number;
  loss: number;
  endingStocks: number;
};
export type WasdeCountry = {
  current: WasdeRow;
  /** projection years only: last month's figures, as printed in this report */
  prevMonth?: WasdeRow;
  prevLabel?: string;
  label?: string;
};
export type WasdeYear = { year: string; status: "final" | "est" | "proj"; countries: Record<string, WasdeCountry> };
export type WasdeReport = { month: string; title: string; released: string; years: WasdeYear[] };
export type WasdeBlob = { reports: WasdeReport[] };

/** newest report first */
export let WASDE_REPORTS: WasdeReport[] = [];

export function __hydrateWasde(b: WasdeBlob) {
  WASDE_REPORTS = (Array.isArray(b?.reports) ? b.reports : [])
    .filter((r) => r && typeof r.month === "string" && Array.isArray(r.years))
    .sort((a, c) => c.month.localeCompare(a.month));
}

export const WASDE_ATTRS: { key: keyof WasdeRow; label: string }[] = [
  { key: "beginningStocks", label: "Beginning stocks" },
  { key: "production", label: "Production" },
  { key: "imports", label: "Imports" },
  { key: "domesticUse", label: "Domestic use" },
  { key: "exports", label: "Exports" },
  { key: "endingStocks", label: "Ending stocks" },
];

export type WasdeUnit = "kmt" | "bales" | "lakh";
export const WASDE_UNITS: { value: WasdeUnit; label: string; short: string }[] = [
  { value: "kmt", label: "1000 MT", short: "1000 MT" },
  { value: "lakh", label: "Lakh bales (170 kg)", short: "lakh bales" },
  { value: "bales", label: "Mn 480-lb bales", short: "mn 480-lb bales" },
];
/** 1 US (480-lb) bale = 217.7243 kg; 1 Indian bale = 170 kg */
const US_BALE_KG = 480 * 0.45359237;
export function convertWasde(millionBales: number, unit: WasdeUnit): number {
  if (unit === "bales") return millionBales;
  if (unit === "kmt") return millionBales * US_BALE_KG; // million bales × kg = 1000 MT
  return (millionBales * US_BALE_KG) / 170 * 10; // million Indian bales × 10 = lakh bales
}
export const wasdeDigits = (unit: WasdeUnit) => (unit === "bales" ? 2 : unit === "lakh" ? 1 : 0);

/** a marketing year's figures for a country in one report */
export function wasdeValue(report: WasdeReport | undefined, year: string, country: string): WasdeRow | null {
  return report?.years.find((y) => y.year === year)?.countries[country]?.current ?? null;
}

/** "2026-10" → "Oct 2026" */
export const reportLabel = (month: string) => {
  const [y, m] = month.split("-");
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]} ${y}`;
};
