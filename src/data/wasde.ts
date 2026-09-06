/** USDA WASDE world cotton balance (1000 MT / KMT) — loaded from the database. */

type WdCat = Record<string, number[]>;
export type WdData = {
  meta: Record<string, unknown>;
  years: string[];
  production: WdCat; mill_use: WdCat; imports: WdCat; exports: WdCat; ending_stocks: WdCat;
};

const EMPTY: WdData = {
  meta: {}, years: [],
  production: {}, mill_use: {}, imports: {}, exports: {}, ending_stocks: {},
};

export let WD: WdData = EMPTY;

export function __hydrateWasde(b: WdData) {
  WD = { ...EMPTY, ...b };
}

export const WD_CATEGORIES = [
  { key: "production", label: "Production" },
  { key: "mill_use", label: "Mill use" },
  { key: "imports", label: "Imports" },
  { key: "exports", label: "Exports" },
  { key: "ending_stocks", label: "Ending stocks" },
] as const;
