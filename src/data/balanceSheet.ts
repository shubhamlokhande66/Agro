/** India cotton supply & demand balance sheet — loaded from the database. */

type MonthRow = {
  opening: number | null; crop: number | null; farmer_sell: number | null;
  cci_proc: number | null; cci_sell: number | null; stock_cci: number | null;
  imports: number | null; dom_cons: number | null; nonmill_cons: number | null;
  total_cons: number | null; exports: number | null; closing: number | null;
};
type AnnualRow = {
  opening_stocks: number; crop_size: number; farmer_selling: number; imports: number;
  total_supply: number; msp_procurement: number; msp_auctions: number; stocks_govt: number;
  domestic_cons: number; exports: number; total_demand: number; closing_stocks: number;
  sur_free_mkt: number; total_sur: number;
};
export type SndData = {
  monthly: Record<string, Record<string, MonthRow>>;
  seasons: string[];
  months_order: string[];
  annual: Record<string, AnnualRow>;
  annual_seasons: string[];
};

const EMPTY: SndData = {
  monthly: {}, seasons: [], months_order: [], annual: {}, annual_seasons: [],
};

export let SND: SndData = EMPTY;

export function __hydrateBalanceSheet(b: SndData) {
  SND = { ...EMPTY, ...b };
}
