/** IMD subdivision rainfall for the cotton belt (mm) — loaded from the database.
 *  Each 8-value array = [May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]. JJAS = indices 1-4. */

export type RfSub = { label: string; normal: number[] } & Record<string, number[]>;

export type RainfallBlob = {
  rfh: Record<string, Record<string, RfSub>>;
  composite: Record<string, number[]>;
  months: string[];
  jjasIdx: number[];
  allYears: string[];
  yearPalette: Record<string, string>;
  stateColors: Record<string, string>;
  stateImd: Record<string, string>;
  weights: Record<string, number>;
};

export let RF_RFH: Record<string, Record<string, RfSub>> = {};
export let RFH: Record<string, Record<string, RfSub>> = {};
export let RF_COMPOSITE: Record<string, number[]> = {};
export let RF_COMPOSITE_T: Record<string, number[]> = {};
export let RF_MONTHS_L: string[] = [];
export let RF_JJAS: number[] = [1, 2, 3, 4];
export let RF_ALL_YEARS: string[] = [];
export let RF_YEAR_PALETTE: Record<string, string> = {};
export let RF_STATE_COLORS: Record<string, string> = {};
export let RF_STATE_IMD: Record<string, string> = {};
export let RF_WEIGHTS: Record<string, number> = {};
export let RF_STATES: string[] = [];

export function __hydrateRainfall(b: RainfallBlob) {
  RF_RFH = b.rfh ?? {};
  RFH = RF_RFH;
  RF_COMPOSITE = b.composite ?? {};
  RF_COMPOSITE_T = RF_COMPOSITE;
  RF_MONTHS_L = b.months ?? [];
  RF_JJAS = b.jjasIdx ?? [1, 2, 3, 4];
  RF_ALL_YEARS = b.allYears ?? [];
  RF_YEAR_PALETTE = b.yearPalette ?? {};
  RF_STATE_COLORS = b.stateColors ?? {};
  RF_STATE_IMD = b.stateImd ?? {};
  RF_WEIGHTS = b.weights ?? {};
  RF_STATES = Object.keys(RF_RFH);
}

/** sum Jun–Sep (indices 1-4) */
export function jjas(arr: number[] | undefined): number | null {
  if (!arr) return null;
  return RF_JJAS.reduce((s, i) => s + (arr[i] ?? 0), 0);
}
export function seasonTotal(arr: number[] | undefined): number | null {
  if (!arr) return null;
  return arr.reduce((s, v) => s + (v ?? 0), 0);
}
