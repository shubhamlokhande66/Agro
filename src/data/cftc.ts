/** CFTC Commitments of Traders — ICE Cotton No. 2 futures, Disaggregated report (contracts), synced
 *  weekly from the CFTC API (src/lib/server/cftc.ts). Positions as of Tuesday, published Friday. */

export type CotWeek = {
  date: string; // report (position) date, Tuesday
  oi: number;
  oiChg: number;
  pmLong: number; pmShort: number; pmLongChg: number; pmShortChg: number; // producer / merchant / processor / user
  swLong: number; swShort: number; swSpread: number; swLongChg: number; swShortChg: number; // swap dealers
  mmLong: number; mmShort: number; mmSpread: number; mmLongChg: number; mmShortChg: number; // managed money
  mmTradersLong: number; mmTradersShort: number;
  orLong: number; orShort: number; orSpread: number; orLongChg: number; orShortChg: number; // other reportables
  nrLong: number; nrShort: number; nrLongChg: number; nrShortChg: number; // non-reportable
};
export type CotBlob = { market: string; report: string; weeks: CotWeek[] };

/** oldest first */
export let COT_WEEKS: CotWeek[] = [];

export function __hydrateCftc(b: CotBlob) {
  COT_WEEKS = (Array.isArray(b?.weeks) ? b.weeks : []).filter((w) => w && typeof w.date === "string").sort((a, c) => a.date.localeCompare(c.date));
}

export const COT_GROUPS = [
  { key: "mm", label: "Managed money", color: "#2563c9" },
  { key: "pm", label: "Producer / merchant", color: "#0f9d63" },
  { key: "sw", label: "Swap dealers", color: "#d97706" },
  { key: "or", label: "Other reportables", color: "#7c5cd6" },
  { key: "nr", label: "Non-reportable", color: "#94a3b8" },
] as const;
export type CotGroup = (typeof COT_GROUPS)[number]["key"];

export const cotLong = (w: CotWeek, g: CotGroup) => w[`${g}Long` as keyof CotWeek] as number;
export const cotShort = (w: CotWeek, g: CotGroup) => w[`${g}Short` as keyof CotWeek] as number;
export const cotNet = (w: CotWeek, g: CotGroup) => cotLong(w, g) - cotShort(w, g);
export const cotNetChg = (w: CotWeek, g: CotGroup) =>
  ((w[`${g}LongChg` as keyof CotWeek] as number) ?? 0) - ((w[`${g}ShortChg` as keyof CotWeek] as number) ?? 0);
export const cotSpread = (w: CotWeek, g: CotGroup) => (g === "mm" ? w.mmSpread : g === "sw" ? w.swSpread : g === "or" ? w.orSpread : 0);
