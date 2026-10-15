/** India cotton production benchmarks — trade houses' estimates (lakh bales of 170 kg), entered in
 *  admin. Agrolytix's own numbers come from the production dataset and USDA's from the latest WASDE. */

export type BenchHouse = { source: string; a: number | null; b: number | null; asOf?: string };
/** `seasons` names the two columns: a = seasons[0], b = seasons[1] */
export type BenchBlob = { seasons: [string, string]; houses: BenchHouse[] };

export let BENCH: BenchBlob = { seasons: ["2025/26", "2026/27"], houses: [] };

export function __hydrateBenchmarks(b: BenchBlob) {
  BENCH = {
    seasons: Array.isArray(b?.seasons) && b.seasons.length === 2 ? b.seasons : ["2025/26", "2026/27"],
    houses: (Array.isArray(b?.houses) ? b.houses : []).filter((h) => h && typeof h.source === "string" && h.source.trim()),
  };
}

/** 1 lakh bales of 170 kg = 17,000 tonnes */
export const LAKH_BALES_TO_KMT = 17;
