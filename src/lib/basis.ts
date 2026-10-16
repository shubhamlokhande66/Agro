import { VARIETIES } from "@/data/prices";
import { COTLOOK_DAILY, COTLOOK_MONTHLY } from "@/data/cotlook";
import { USDINR_M_L, USDINR_M_V } from "@/data/currency";

/** Cotton basis: Guj-29 (Shankar-29) against the Cotlook A Index, in US ¢/lb and ₹/candy. */

/** 1 candy = 356 kg = 784.85 lb */
export const LB_PER_CANDY = 356 / 0.45359237;
/** ₹/candy → US ¢/lb at a given ₹ per US$ */
export const toCentsLb = (inrCandy: number, fx: number) => (inrCandy / fx / LB_PER_CANDY) * 100;
/** US ¢/lb → ₹/candy */
export const toInrCandy = (centsLb: number, fx: number) => (centsLb / 100) * fx * LB_PER_CANDY;

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type BasisMonth = { month: string; guj: number; fx: number; gujCents: number; aIndex: number; basis: number; basisInr: number; pct: number };

/** one row per month: Guj-29 monthly average vs the A Index, at that month's RBI average rate */
export function monthlyBasis(): BasisMonth[] {
  const guj = VARIETIES.find((v) => v.key === "guj29")?.daily ?? [];
  const gujByMonth = new Map<string, number[]>();
  for (const p of guj) gujByMonth.set(p.date.slice(0, 7), [...(gujByMonth.get(p.date.slice(0, 7)) ?? []), p.price]);

  const fxByMonth = new Map<string, number>();
  USDINR_M_L.forEach((l, i) => fxByMonth.set(`20${l.slice(4)}-${String(MON.indexOf(l.slice(0, 3)) + 1).padStart(2, "0")}`, USDINR_M_V[i]));

  // World Bank monthly, with the current month from Cotlook's daily values until the World Bank catches up
  const aByMonth = new Map(COTLOOK_MONTHLY.map((m) => [m.month, m.value]));
  const dailyByMonth = new Map<string, number[]>();
  for (const p of COTLOOK_DAILY) dailyByMonth.set(p.date.slice(0, 7), [...(dailyByMonth.get(p.date.slice(0, 7)) ?? []), p.value]);
  for (const [m, vals] of dailyByMonth) if (!aByMonth.has(m)) aByMonth.set(m, vals.reduce((a, b) => a + b, 0) / vals.length);

  const out: BasisMonth[] = [];
  for (const [month, prices] of [...gujByMonth].sort(([a], [b]) => a.localeCompare(b))) {
    const fx = fxByMonth.get(month);
    const a = aByMonth.get(month);
    if (!fx || a == null) continue;
    const g = prices.reduce((x, y) => x + y, 0) / prices.length;
    const gc = toCentsLb(g, fx);
    out.push({ month, guj: g, fx, gujCents: gc, aIndex: a, basis: gc - a, basisInr: g - toInrCandy(a, fx), pct: ((gc - a) / a) * 100 });
  }
  return out;
}
