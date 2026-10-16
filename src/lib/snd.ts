import { SND } from "@/data/balanceSheet";

/** India cotton SND arithmetic over the monthly balance sheet — shared by the Balance Sheet page
 *  and the Overview report so both always agree. Lakh bales; cotton year Oct–Sep. */

export type SndYearType = "india" | "global";
export type SndRow = Record<string, number | null | undefined>;

export const SND_MONTHS_INDIA = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
export const SND_MONTHS_GLOBAL = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
/** in a Jul–Jun year these months belong to the previous Oct–Sep season */
const PREV_SEASON_MONTHS = ["Jul", "Aug", "Sep"];

/** "2025/26" -> "2024/25" */
export const prevSeasonOf = (s: string) => {
  const y = parseInt(s, 10);
  return `${y - 1}/${String(y).slice(2)}`;
};

const monthRow = (season: string, m: string, yt: SndYearType): SndRow => {
  const s = yt === "global" && PREV_SEASON_MONTHS.includes(m) ? prevSeasonOf(season) : season;
  return ((SND.monthly?.[s] ?? {}) as Record<string, SndRow>)[m] ?? {};
};

/** SND over a run of months — Oct→Sep gives the full season */
export function sndPeriod(season: string, months: string[], yt: SndYearType = "india"): SndRow {
  const rows = months.map((m) => monthRow(season, m, yt));
  const sum = (k: string) => rows.reduce((a, r) => a + (r[k] ?? 0), 0);
  const first = rows[0] ?? {};
  const last = rows.at(-1) ?? {};
  // crop is entered once, in October
  const oct = rows[months.indexOf("Oct")] ?? {};
  const opening = first.opening ?? null;
  const farmerSelling = sum("farmer_sell");
  const imports = sum("imports");
  const domCons = sum("total_cons");
  const exports = sum("exports");
  const closing = last.closing ?? null;
  const govt = last.stock_cci ?? null;
  const totalDemand = domCons + exports;
  return {
    opening_stocks: opening,
    crop_size: oct.crop ?? null,
    farmer_selling: farmerSelling,
    imports,
    // supply that has actually reached the market in the period
    total_supply: (opening ?? 0) + farmerSelling + imports,
    msp_procurement: sum("cci_proc"),
    msp_auctions: sum("cci_sell"),
    stocks_govt: govt,
    domestic_cons: domCons,
    exports,
    total_demand: totalDemand,
    closing_stocks: closing,
    sur_free_mkt: closing != null && totalDemand ? (closing - (govt ?? 0)) / totalDemand : null,
    total_sur: closing != null && totalDemand ? closing / totalDemand : null,
  };
}

/** full-year SND: the stored Oct–Sep annual figures, or computed from months for Jul–Jun */
export const sndAnnual = (season: string, yt: SndYearType = "india"): SndRow =>
  yt === "india" ? ((SND.annual?.[season] ?? {}) as unknown as SndRow) : sndPeriod(season, SND_MONTHS_GLOBAL, yt);

/** Oct → `month`, inclusive */
export const sndMonthsTo = (month: string) => SND_MONTHS_INDIA.slice(0, SND_MONTHS_INDIA.indexOf(month) + 1);

/** the current month of the cotton year (Oct–Sep) */
export const currentSndMonth = () => SND_MONTHS_INDIA.find((m) => m === new Date().toLocaleString("en-US", { month: "short" })) ?? "Sep";
