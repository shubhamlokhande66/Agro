import { DEFICIENT_BELOW, weightedDeparture, type Subdivision } from "./constants";
import type { RegionalConfig } from "./config";

/** headline rainfall aggregates, as the original monsoon app computes them */
export function rainfallSummary(subs: Subdivision[], cfg: Pick<RegionalConfig, "centralIndia">) {
  const valid = subs.filter((s) => typeof s.departure === "number");
  const deficient = valid.filter((s) => s.departure < DEFICIENT_BELOW).sort((a, b) => a.departure - b.departure);
  return {
    allIndia: weightedDeparture(valid),
    central: weightedDeparture(valid.filter((s) => cfg.centralIndia.includes(s.name))),
    deficientCount: deficient.length,
    deficientNames: deficient.map((s) => `${s.name} ${s.departure}%`),
  };
}

export type CommodityResult = {
  commodity: string;
  weightedDeparture: number;
  states: { state: string; weight: number; avgDeparture: number; subdivisions: string[] }[];
};

/** production-weighted departure per commodity: each state = mean of its subdivisions,
 *  states combined by production share (renormalised over the states that have data) */
export function commodityWeighted(subs: Subdivision[], cfg: RegionalConfig, exclusions: string[] = cfg.exclusions): CommodityResult[] {
  return Object.entries(cfg.commodityWeights).map(([commodity, weights]) => {
    let totalW = 0;
    let sum = 0;
    const states: CommodityResult["states"] = [];
    for (const { state, weight } of weights) {
      const names = (cfg.stateSubdivisions[state] ?? []).filter((n) => !exclusions.includes(n));
      const matching = subs.filter((s) => names.includes(s.name));
      if (!matching.length) continue;
      const avg = matching.reduce((a, s) => a + s.departure, 0) / matching.length;
      sum += avg * weight;
      totalW += weight;
      states.push({ state, weight, avgDeparture: Math.round(avg * 10) / 10, subdivisions: matching.map((s) => s.name) });
    }
    return { commodity, weightedDeparture: totalW > 0 ? Math.round((sum / totalW) * 10) / 10 : 0, states };
  });
}
