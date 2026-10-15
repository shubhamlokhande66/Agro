/**
 * Ginning economics — the ginner's breakeven lint price and margin, per 1 tonne (10 quintals)
 * of kapas ginned: kapas cost + ginning charges, less the cotton seed recovered, spread over
 * the lint recovered.
 */

const CANDY_KG = 356;
const BALE_KG = 170;
const KG_PER_LB = 0.45359237;

export type GinInputs = {
  kapas: number; // ₹ / quintal
  seed: number; // ₹ / quintal
  lint: number; // market lint price, ₹ / candy (Guj-29)
  usdInr: number; // ₹ per US$
  ginningPct: number; // ginning charges, % of kapas cost
  seedPct: number; // seed outturn, % of kapas weight
  lintPct: number; // lint outturn, % of kapas weight
};

export function ginnerMargin(i: GinInputs) {
  const kapasCost = i.kapas * 10; // 1 tonne = 10 quintals
  const ginning = (kapasCost * i.ginningPct) / 100;
  const totalCost = kapasCost + ginning;
  const seedQtl = (10 * i.seedPct) / 100;
  const seedValue = seedQtl * i.seed;
  const netLintCost = totalCost - seedValue;
  const lintKg = (1000 * i.lintPct) / 100;
  const bePerKg = lintKg > 0 ? netLintCost / lintKg : NaN;
  const bePerCandy = bePerKg * CANDY_KG;
  const bePerBale = bePerKg * BALE_KG;
  const beCentsLb = i.usdInr > 0 ? ((bePerKg / i.usdInr) * KG_PER_LB) * 100 : NaN;
  const marginCandy = i.lint - bePerCandy;
  const lintRevenue = (i.lint / CANDY_KG) * lintKg;
  return {
    kapasCost,
    ginning,
    totalCost,
    seedQtl,
    seedValue,
    netLintCost,
    lintKg,
    bePerKg,
    bePerCandy,
    bePerBale,
    beCentsLb,
    lintRevenue,
    marginCandy,
    marginBale: (marginCandy / CANDY_KG) * BALE_KG,
    marginTonne: lintRevenue + seedValue - totalCost,
    marginPct: i.lint > 0 ? (marginCandy / i.lint) * 100 : NaN,
  };
}
