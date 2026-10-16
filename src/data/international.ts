/** ICE Cotton #2 and Brent crude series — loaded from the database at runtime. */

export type IntlBlob = {
  iceAnnL: string[]; iceAnnV: number[];
  iceML: string[]; iceMV: number[];
  iceDL: string[]; iceDV: number[];
  brAnnL: string[]; brAnnV: number[];
  brMV: number[];
  /** Brent daily settlements ("dd/mm/yy") — synced from ICE */
  brDL?: string[]; brDV?: number[];
  /** first "YYYY-MM" month whose monthly averages the ICE sync recomputes */
  monthlySyncFrom?: string;
};

export let ICE_ANN_L: string[] = [];
export let ICE_ANN_V: number[] = [];
export let ICE_M_L: string[] = [];
export let ICE_M_V: number[] = [];
export let ICE_D_L: string[] = [];
export let ICE_D_V: number[] = [];
export let BR_ANN_L: string[] = [];
export let BR_ANN_V: number[] = [];
export let BR_M_V: number[] = [];
export let BR_M_L: string[] = [];
export let BR_D_L: string[] = [];
export let BR_D_V: number[] = [];

export function __hydrateInternational(b: IntlBlob) {
  ICE_ANN_L = b.iceAnnL ?? [];
  ICE_ANN_V = b.iceAnnV ?? [];
  ICE_M_L = b.iceML ?? [];
  ICE_M_V = b.iceMV ?? [];
  ICE_D_L = b.iceDL ?? [];
  ICE_D_V = b.iceDV ?? [];
  BR_ANN_L = b.brAnnL ?? [];
  BR_ANN_V = b.brAnnV ?? [];
  BR_M_V = b.brMV ?? [];
  BR_M_L = b.iceML ?? []; // brent monthly shares the ICE monthly axis
  BR_D_L = b.brDL ?? [];
  BR_D_V = b.brDV ?? [];
}

/** ICE cotton (¢/lb) on a date: that day's settlement (or the last one within 5 days before),
 *  else that month's average — e.g. to pair a weekly COT report with the price */
export function icePriceOn(date: string): number | null {
  const iso = (l: string) => `20${l.slice(6, 8)}-${l.slice(3, 5)}-${l.slice(0, 2)}`;
  for (let i = ICE_D_L.length - 1; i >= 0; i--) {
    const d = iso(ICE_D_L[i]);
    if (d <= date) {
      if ((Date.parse(date) - Date.parse(d)) / 86400000 <= 5) return ICE_D_V[i];
      break;
    }
  }
  const m = ICE_M_L.indexOf(date.slice(0, 7));
  return m >= 0 ? ICE_M_V[m] : null;
}
