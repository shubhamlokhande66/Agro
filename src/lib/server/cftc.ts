import { getDataset, putDataset } from "@/lib/server/datasets";
import type { CotBlob, CotWeek } from "@/data/cftc";

/**
 * Weekly sync of the CFTC Commitments of Traders report for ICE Cotton No. 2 futures (contract
 * market code 033661) into the `cftc` dataset, from the CFTC's public reporting API (Socrata,
 * no key needed) — the Disaggregated, futures-only report. Positions are as of Tuesday and are
 * published on Friday at 3:30 pm ET. Number of contracts (1 contract = 50,000 lb).
 */

const API = "https://publicreporting.cftc.gov/resource/72hh-3qpy.json";
const CODE = "033661";
const WEEKS_KEPT = 260; // ~5 years

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export async function fetchCot(limit: number): Promise<CotWeek[]> {
  const url = `${API}?cftc_contract_market_code=${CODE}&$order=report_date_as_yyyy_mm_dd%20DESC&$limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`CFTC API: HTTP ${res.status}`);
  const rows = (await res.json()) as Record<string, string>[];
  return rows
    .map((r) => ({
      date: String(r.report_date_as_yyyy_mm_dd).slice(0, 10),
      oi: n(r.open_interest_all),
      oiChg: n(r.change_in_open_interest_all),
      pmLong: n(r.prod_merc_positions_long),
      pmShort: n(r.prod_merc_positions_short),
      pmLongChg: n(r.change_in_prod_merc_long),
      pmShortChg: n(r.change_in_prod_merc_short),
      swLong: n(r.swap_positions_long_all),
      swShort: n(r.swap__positions_short_all),
      swSpread: n(r.swap__positions_spread_all),
      swLongChg: n(r.change_in_swap_long_all),
      swShortChg: n(r.change_in_swap_short_all),
      mmLong: n(r.m_money_positions_long_all),
      mmShort: n(r.m_money_positions_short_all),
      mmSpread: n(r.m_money_positions_spread),
      mmLongChg: n(r.change_in_m_money_long_all),
      mmShortChg: n(r.change_in_m_money_short_all),
      mmTradersLong: n(r.traders_m_money_long_all),
      mmTradersShort: n(r.traders_m_money_short_all),
      orLong: n(r.other_rept_positions_long),
      orShort: n(r.other_rept_positions_short),
      orSpread: n(r.other_rept_positions_spread),
      orLongChg: n(r.change_in_other_rept_long),
      orShortChg: n(r.change_in_other_rept_short),
      nrLong: n(r.nonrept_positions_long_all),
      nrShort: n(r.nonrept_positions_short_all),
      nrLongChg: n(r.change_in_nonrept_long_all),
      nrShortChg: n(r.change_in_nonrept_short_all),
    }))
    .filter((w) => /^\d{4}-\d{2}-\d{2}$/.test(w.date))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type CotSyncReport = { dates: { date: string; status: "added" | "up-to-date" }[]; saved: boolean; latestWeek: string | null };

/** add new weeks (and refresh the last few, which the CFTC occasionally revises); fills 5 years the first time */
export async function syncCftc({ by = "cron:cftc" }: { by?: string } = {}): Promise<CotSyncReport> {
  const doc = await getDataset("cftc");
  const stored = (doc?.data ?? {}) as Partial<CotBlob>;
  const before = JSON.stringify(stored);
  const byDate = new Map((stored.weeks ?? []).map((w) => [w.date, w]));
  const fresh = await fetchCot(byDate.size ? 8 : WEEKS_KEPT);
  if (!fresh.length) throw new Error("CFTC API returned no cotton rows");

  const report: CotSyncReport = { dates: [], saved: false, latestWeek: null };
  for (const w of fresh) {
    if (!byDate.has(w.date)) report.dates.push({ date: w.date, status: "added" });
    byDate.set(w.date, w);
  }
  const weeks = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-WEEKS_KEPT);
  const blob: CotBlob = { market: "Cotton No. 2 — ICE Futures U.S.", report: "Disaggregated, futures only", weeks };
  report.latestWeek = weeks.at(-1)?.date ?? null;
  if (JSON.stringify(blob) !== before) {
    await putDataset("cftc", blob, by, "cftc-cot-sync");
    report.saved = true;
  }
  return report;
}
