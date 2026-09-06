/** India cotton import / export by season & month (lakh bales) — loaded from the database. */

export type IeData = {
  seasons: string[];
  months: string[];
  import: Record<string, Record<string, number>>;
  export: Record<string, Record<string, number>>;
  import_totals: Record<string, number>;
  export_totals: Record<string, number>;
  actual_cutoff: { season: string; month: string };
  lb_to_kmt: number;
};

const EMPTY: IeData = {
  seasons: [], months: [], import: {}, export: {},
  import_totals: {}, export_totals: {},
  actual_cutoff: { season: "", month: "" }, lb_to_kmt: 17,
};

export let IE: IeData = EMPTY;

export function __hydrateTrade(b: IeData) {
  IE = { ...EMPTY, ...b };
}

/** 1 lakh bales = 17 KMT */
export function toKmt(lakhBales: number | null): number | null {
  return lakhBales == null ? null : Math.round(lakhBales * (IE.lb_to_kmt || 17) * 10) / 10;
}
