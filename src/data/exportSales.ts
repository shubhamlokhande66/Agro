/** USDA FAS weekly export sales of US upland cotton (running bales) — synced from the FAS Open Data
 *  API (src/lib/server/exportSales.ts). Marketing year Aug–Jul. */

export type EsWeek = {
  week: string; // week ending, "YYYY-MM-DD"
  netSales: number; // current marketing year net sales in the week
  exports: number; // shipments in the week
  accExports: number; // exports so far this marketing year
  outstanding: number; // sold, not yet shipped
  commitment: number; // accExports + outstanding
  nextNetSales: number; // net sales for next marketing year
  nextOutstanding: number;
};
export type EsYear = { year: string; weeks: EsWeek[] }; // "2026/27"
export type EsDest = { country: string; commitment: number; lastYear: number };
export type EsBlob = { commodity: string; unit: string; years: EsYear[]; destinations: EsDest[]; destWeek: string | null };

/** newest marketing year first */
export let ES_YEARS: EsYear[] = [];
export let ES_DEST: EsDest[] = [];
export let ES_DEST_WEEK: string | null = null;

export function __hydrateExportSales(b: EsBlob) {
  ES_YEARS = (Array.isArray(b?.years) ? b.years : []).filter((y) => y && Array.isArray(y.weeks)).sort((a, c) => c.year.localeCompare(a.year));
  ES_DEST = Array.isArray(b?.destinations) ? b.destinations : [];
  ES_DEST_WEEK = b?.destWeek ?? null;
}
