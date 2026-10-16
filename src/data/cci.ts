/** Cotton Corporation of India — procurement, sales, prices — loaded from the database. */

export type CciData = {
  datewise: { d: string; p: number | null; v: number | null; seas: string }[];
  monthly_sell: Record<string, Record<string, { vol: number; avgp: number; maxp: number; minp: number }>>;
  statewise: Record<string, number>;
  proc_monthly: Record<string, Record<string, number>>;
  proc_annual: Record<string, number>;
  sell_annual: Record<string, number>;
  stock_annual: Record<string, number>;
  season_cutoff: Record<string, string>;
  totals: Record<string, number>;
};

const EMPTY: CciData = {
  datewise: [], monthly_sell: {}, statewise: {}, proc_monthly: {},
  proc_annual: {}, sell_annual: {}, stock_annual: {}, season_cutoff: {}, totals: {},
};

export let CCI: CciData = EMPTY;

export function __hydrateCci(b: CciData) {
  CCI = { ...EMPTY, ...b };
}

/** CCI's daily sales grouped into Monday–Sunday weeks: total volume sold (lakh bales) and the
 *  volume-weighted average sale price (₹/candy) — the latest `n` weeks with any sales, optionally
 *  only one season's sales ("2025-26") */
export function cciWeekly(n = 26, season?: string): { week: string; vol: number; price: number | null }[] {
  const weeks = new Map<string, { vol: number; pv: number; pVol: number; pSum: number; pN: number }>();
  for (const r of CCI.datewise ?? []) {
    if (season && r.seas !== season) continue;
    const t = Date.parse(r.d + "T00:00:00Z");
    if (!Number.isFinite(t)) continue;
    const monday = new Date(t - ((new Date(t).getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10);
    const w = weeks.get(monday) ?? { vol: 0, pv: 0, pVol: 0, pSum: 0, pN: 0 };
    if (r.v != null) w.vol += r.v;
    if (r.p != null) {
      w.pSum += r.p;
      w.pN += 1;
      if (r.v != null) {
        w.pv += r.p * r.v;
        w.pVol += r.v;
      }
    }
    weeks.set(monday, w);
  }
  return [...weeks.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .filter(([, w]) => w.vol > 0)
    .slice(-n)
    .map(([week, w]) => ({
      week,
      vol: Math.round(w.vol * 100) / 100,
      price: w.pVol > 0 ? Math.round(w.pv / w.pVol) : w.pN ? Math.round(w.pSum / w.pN) : null,
    }));
}

/** the latest season with daily sales, e.g. "2025-26" */
export const cciLatestSalesSeason = () => (CCI.datewise ?? []).map((r) => r.seas).filter(Boolean).sort().at(-1);
