/** USD/INR and USD/CNY FX series — loaded from the database at runtime. */

export type CurrencyBlob = {
  monthsL: string[];
  usdinrM: number[]; usdcnyM: number[];
  usdinr1yL: string[]; usdinr1yV: number[]; usdcny1yV: number[];
  usdinr5yL: string[]; usdinr5yV: number[]; usdcny5yV: number[];
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

export function __hydrateCurrency(b: CurrencyBlob) {
  USDINR_M_L = b.monthsL ?? [];
  USDCNY_M_L = b.monthsL ?? [];
  USDINR_M_V = b.usdinrM ?? [];
  USDCNY_M_V = b.usdcnyM ?? [];
  USDINR_1Y_L = b.usdinr1yL ?? [];
  USDCNY_1Y_L = b.usdinr1yL ?? [];
  USDINR_1Y_V = b.usdinr1yV ?? [];
  USDCNY_1Y_V = b.usdcny1yV ?? [];
  USDINR_5Y_L = b.usdinr5yL ?? [];
  USDCNY_5Y_L = b.usdinr5yL ?? [];
  USDINR_5Y_V = b.usdinr5yV ?? [];
  USDCNY_5Y_V = b.usdcny5yV ?? [];
}
