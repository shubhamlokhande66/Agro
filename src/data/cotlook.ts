/** Cotlook A Index — the average of the cheapest five cotton quotations delivered to Far East
 *  ports (US cents / lb). Monthly history from the World Bank Pink Sheet ("Cotton, A Index"),
 *  daily values from Cotlook's public index widget — both synced by src/lib/server/cotlook.ts. */

export type CotlookPoint = { date: string; value: number }; // daily, "YYYY-MM-DD"
export type CotlookMonth = { month: string; value: number }; // monthly average, "YYYY-MM"
export type CotlookBlob = { daily: CotlookPoint[]; monthly: CotlookMonth[] };

export let COTLOOK_DAILY: CotlookPoint[] = [];
export let COTLOOK_MONTHLY: CotlookMonth[] = [];

export function __hydrateCotlook(b: CotlookBlob) {
  COTLOOK_DAILY = (Array.isArray(b?.daily) ? b.daily : [])
    .filter((p) => p && typeof p.date === "string" && typeof p.value === "number")
    .sort((a, c) => a.date.localeCompare(c.date));
  COTLOOK_MONTHLY = (Array.isArray(b?.monthly) ? b.monthly : [])
    .filter((p) => p && typeof p.month === "string" && typeof p.value === "number")
    .sort((a, c) => a.month.localeCompare(c.month));
}
