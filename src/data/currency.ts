/** USD/INR and USD/CNY FX series — loaded from the database at runtime.
 *  USD/INR is synced daily from the RBI reference rate (src/lib/server/rbiUsd.ts);
 *  USD/CNY is entered by hand and has its own label axes. */

export type CurrencyBlob = {
  monthsL: string[]; usdinrM: number[];
  usdinr1yL: string[]; usdinr1yV: number[]; // daily, "dd/mm/yy"
  usdinr5yL: string[]; usdinr5yV: number[];
  cnyMonthsL?: string[]; usdcnyM: number[];
  usdcny1yL?: string[]; usdcny1yV: number[];
  usdcny5yL?: string[]; usdcny5yV: number[];
};

export let USDINR_M_L: string[] = [];
export let USDCNY_M_L: string[] = [];
export let USDINR_M_V: number[] = [];
export let USDCNY_M_V: number[] = [];
export let USDINR_1Y_L: string[] = [];
export let USDCNY_1Y_L: string[] = [];
export let USDINR_1Y_V: number[] = [];
export let USDCNY_1Y_V: number[] = [];
export let USDINR_5Y_L: string[] = [];
export let USDCNY_5Y_L: string[] = [];
export let USDINR_5Y_V: number[] = [];
export let USDCNY_5Y_V: number[] = [];
/** latest daily USD/INR reference rate (falls back to the latest monthly value) */
export let USDINR_LATEST: number | null = null;

/** pair labels with values, dropping entries with no number (e.g. blank admin cells) */
function pairs(labels: string[] | undefined, values: number[] | undefined): [string[], number[]] {
  const l: string[] = [];
  const v: number[] = [];
  (labels ?? []).forEach((label, i) => {
    const n = values?.[i];
    if (typeof n === "number" && Number.isFinite(n)) {
      l.push(label);
      v.push(n);
    }
  });
  return [l, v];
}

export function __hydrateCurrency(b: CurrencyBlob) {
  [USDINR_M_L, USDINR_M_V] = pairs(b.monthsL, b.usdinrM);
  [USDINR_1Y_L, USDINR_1Y_V] = pairs(b.usdinr1yL, b.usdinr1yV);
  [USDINR_5Y_L, USDINR_5Y_V] = pairs(b.usdinr5yL, b.usdinr5yV);
  [USDCNY_M_L, USDCNY_M_V] = pairs(b.cnyMonthsL ?? b.monthsL, b.usdcnyM);
  [USDCNY_1Y_L, USDCNY_1Y_V] = pairs(b.usdcny1yL ?? b.usdinr1yL, b.usdcny1yV);
  [USDCNY_5Y_L, USDCNY_5Y_V] = pairs(b.usdcny5yL ?? b.usdinr5yL, b.usdcny5yV);
  USDINR_LATEST = USDINR_1Y_V.at(-1) ?? USDINR_M_V.at(-1) ?? null;
}
