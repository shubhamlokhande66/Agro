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
