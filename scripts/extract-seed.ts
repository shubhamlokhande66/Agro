/* Reads the CURRENT src/data modules and writes seed/<key>.json blobs.
   Run once, before the data modules are refactored to DB-backed bindings. */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import * as prices from "../src/data/prices";
import * as intl from "../src/data/international";
import * as currency from "../src/data/currency";
import * as arrivals from "../src/data/arrivals";
import * as sowing from "../src/data/sowing";
import * as production from "../src/data/production";
import * as balanceSheet from "../src/data/balanceSheet";
import * as trade from "../src/data/trade";
import * as cci from "../src/data/cci";
import * as rainfall from "../src/data/rainfall";
import * as cop from "../src/data/cop";
import * as calendar from "../src/data/calendar";
import * as wasde from "../src/data/wasde";

const OUT = resolve(process.cwd(), "seed");
mkdirSync(OUT, { recursive: true });

const blobs: Record<string, unknown> = {
  prices: {
    years: prices.DOM_YEARS,
    dayLabels: prices.DOM_DAY_LABELS,
    groups: prices.VARIETY_GROUPS,
    varieties: prices.VARIETIES,
  },
  international: {
    iceAnnL: intl.ICE_ANN_L, iceAnnV: intl.ICE_ANN_V,
    iceML: intl.ICE_M_L, iceMV: intl.ICE_M_V,
    iceDL: intl.ICE_D_L, iceDV: intl.ICE_D_V,
    brAnnL: intl.BR_ANN_L, brAnnV: intl.BR_ANN_V,
    brMV: intl.BR_M_V,
  },
  currency: {
    monthsL: currency.USDINR_M_L,
    usdinrM: currency.USDINR_M_V,
    usdcnyM: currency.USDCNY_M_V,
    usdinr1yL: currency.USDINR_1Y_L, usdinr1yV: currency.USDINR_1Y_V,
    usdcny1yV: currency.USDCNY_1Y_V,
    usdinr5yL: currency.USDINR_5Y_L, usdinr5yV: currency.USDINR_5Y_V,
    usdcny5yV: currency.USDCNY_5Y_V,
  },
  arrivals: {
    weeks: arrivals.ARRIVAL_WEEKS,
    seasons: arrivals.ARRIVAL_SEASONS,
    values: arrivals.ARRIVALS,
  },
  sowing: {
    weeks: sowing.SOWING_WEEKS,
    series: sowing.SOWING_SERIES,
  },
  production: production.DP_DATA,
  balanceSheet: balanceSheet.SND,
  trade: trade.IE,
  cci: cci.CCI,
  rainfall: {
    rfh: rainfall.RF_RFH,
    composite: rainfall.RF_COMPOSITE,
    months: rainfall.RF_MONTHS_L,
    jjasIdx: rainfall.RF_JJAS,
    allYears: rainfall.RF_ALL_YEARS,
    yearPalette: rainfall.RF_YEAR_PALETTE,
    stateColors: rainfall.RF_STATE_COLORS,
    stateImd: rainfall.RF_STATE_IMD,
    weights: rainfall.RF_WEIGHTS,
  },
  cop: {
    data: cop.COP_DATA,
    emoji: cop.COP_EMOJI,
  },
  calendar: {
    months: calendar.CAL_MONTHS,
    phaseMeta: calendar.PHASE_META,
    states: calendar.CROP_STATES,
  },
  wasde: wasde.WD,
};

for (const [key, blob] of Object.entries(blobs)) {
  writeFileSync(resolve(OUT, `${key}.json`), JSON.stringify(blob, null, 2));
  console.log("wrote seed/" + key + ".json");
}
