import { getDataset, putDataset } from "@/lib/server/datasets";
import type { CurrencyBlob } from "@/data/currency";

/**
 * Daily sync of USD/CNY into the `currency` dataset, from the European Central Bank's daily
 * reference rates via the Frankfurter API (free, no key; one value per ECB working day, published
 * ~16:00 CET). Mirrors the RBI USD/INR sync (src/lib/server/rbiUsd.ts) but only touches the
 * USD/CNY side, which has its own label axes (cnyMonthsL / usdcny1yL / usdcny5yL):
 *  - usdcny1yL/V : daily rates, last ~1 year ("dd/mm/yy")
 *  - cnyMonthsL / usdcnyM : monthly averages — months fully inside the fetched range are
 *    replaced, the current month is month-to-date; older months are kept as stored
 *  - usdcny5yL/V : the last 60 months of the monthly series
 */

const API = "https://api.frankfurter.dev/v1";
const CURRENCY_KEY = "currency";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-09-28" -> "Sep-26" */
const monthLabel = (iso: string) => `${MONTHS[+iso.slice(5, 7) - 1]}-${iso.slice(2, 4)}`;
/** "Sep-26" -> "2026-09" for sorting */
const monthKey = (label: string) => `20${label.slice(4)}-${String(MONTHS.indexOf(label.slice(0, 3)) + 1).padStart(2, "0")}`;
/** "2026-09-28" -> "28/09/26" */
const dayLabel = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`;
const round = (n: number, dp: number) => Math.round(n * 10 ** dp) / 10 ** dp;
const isoDaysBefore = (iso: string, days: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") - days * 86400000).toISOString().slice(0, 10);

/** USD/CNY reference rates between two ISO dates, oldest first */
export async function fetchUsdCny(from: string, to: string): Promise<{ date: string; rate: number }[]> {
  const res = await fetch(`${API}/${from}..${to}?base=USD&symbols=CNY`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Frankfurter: HTTP ${res.status}`);
  const body = (await res.json()) as { rates?: Record<string, { CNY?: number }> };
  return Object.entries(body.rates ?? {})
    .map(([date, r]) => ({ date, rate: Number(r.CNY) }))
    .filter((r) => r.date >= from && Number.isFinite(r.rate) && r.rate > 0) // the API may include the working day before `from`
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type CnySyncReport = {
  latest: { date: string; rate: number } | null;
  dates: { date: string; status: "added" | "up-to-date" }[];
  months: string[];
  saved: boolean;
};

export async function syncUsdCny(
  { from, to, by = "cron:usdcny" }: { from?: string; to?: string; by?: string } = {},
): Promise<CnySyncReport> {
  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  to ??= today;
  from ??= isoDaysBefore(to, 400);

  const doc = await getDataset(CURRENCY_KEY);
  if (!doc) throw new Error(`"${CURRENCY_KEY}" dataset not found`);
  const blob = doc.data as CurrencyBlob;
  const before = JSON.stringify(blob);

  const rates = await fetchUsdCny(from, to);
  if (!rates.length) throw new Error(`No USD/CNY rates for ${from} – ${to}`);

  // daily, last ~1 year
  const oldDaily = new Map((blob.usdcny1yL ?? []).map((l, i) => [l, blob.usdcny1yV?.[i]]));
  const yearAgo = isoDaysBefore(rates.at(-1)!.date, 366);
  const daily = rates.filter((r) => r.date > yearAgo);
  const dates = daily.map((r) => ({
    date: r.date,
    status: oldDaily.get(dayLabel(r.date)) === round(r.rate, 4) ? ("up-to-date" as const) : ("added" as const),
  }));
  blob.usdcny1yL = daily.map((r) => dayLabel(r.date));
  blob.usdcny1yV = daily.map((r) => round(r.rate, 4));

  // monthly averages (months only partly inside the fetched range keep their stored average)
  const byMonth = new Map<string, number[]>();
  for (const r of rates) {
    if (r.date.slice(0, 7) + "-01" < from) continue;
    const l = monthLabel(r.date);
    byMonth.set(l, [...(byMonth.get(l) ?? []), r.rate]);
  }
  const monthly = new Map((blob.cnyMonthsL ?? blob.monthsL ?? []).map((l, i) => [l, blob.usdcnyM?.[i]]));
  for (const [l, vals] of byMonth) monthly.set(l, round(vals.reduce((a, b) => a + b, 0) / vals.length, 4));
  const months = [...monthly]
    .filter(([, v]) => typeof v === "number")
    .sort(([a], [b]) => monthKey(a).localeCompare(monthKey(b)));
  blob.cnyMonthsL = months.map(([l]) => l);
  blob.usdcnyM = months.map(([, v]) => v as number);

  // 5-year view: the last 60 months
  blob.usdcny5yL = blob.cnyMonthsL.slice(-60);
  blob.usdcny5yV = blob.usdcnyM.slice(-60);

  const report: CnySyncReport = { latest: rates.at(-1)!, dates, months: [...byMonth.keys()], saved: false };
  if (JSON.stringify(blob) !== before) {
    await putDataset(CURRENCY_KEY, blob, by, "usdcny-sync");
    report.saved = true;
  }
  return report;
}
