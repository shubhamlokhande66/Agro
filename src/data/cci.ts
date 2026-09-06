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
