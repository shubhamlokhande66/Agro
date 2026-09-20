/** Landed-cost inputs for the import-parity view on the Balance Sheet page — loaded from the
 *  database at runtime, admin-editable (duty / freight / insurance change with policy). */

export type ImportParityBlob = {
  dutyPct: number;
  freightPerCandy: number;
  insurancePerCandy: number;
};

export let IMPORT_DUTY_PCT = 0;
export let IMPORT_FREIGHT_PER_CANDY = 0;
export let IMPORT_INSURANCE_PER_CANDY = 0;

export function __hydrateImportParity(b: ImportParityBlob) {
  IMPORT_DUTY_PCT = b.dutyPct ?? 0;
  IMPORT_FREIGHT_PER_CANDY = b.freightPerCandy ?? 0;
  IMPORT_INSURANCE_PER_CANDY = b.insurancePerCandy ?? 0;
}

/** 1 candy = 356 kg, the standard Indian cotton trade unit ≈ 784.8 lb. */
export const LBS_PER_CANDY = 784.8;

/** Landed cost of imported cotton, ₹/candy, from the ICE price (¢/lb) and USD/INR rate:
 *  ICE ¢/lb → $/lb → $/candy → ₹/candy, plus duty, freight & insurance. */
export function landedCostPerCandy(icePriceCents: number, usdInr: number): number | null {
  if (icePriceCents == null || usdInr == null) return null;
  const fobPerCandy = (icePriceCents / 100) * LBS_PER_CANDY * usdInr;
  return fobPerCandy * (1 + IMPORT_DUTY_PCT / 100) + IMPORT_FREIGHT_PER_CANDY + IMPORT_INSURANCE_PER_CANDY;
}
