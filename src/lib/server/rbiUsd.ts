import { getDataset, putDataset } from "@/lib/server/datasets";
import type { CurrencyBlob } from "@/data/currency";

/**
 * Daily sync of the RBI / FBIL USD-INR reference rate into the `currency` dataset.
 * RBI publishes one rate per working day at ~1:30pm IST. The Home.aspx page-method
 * API is firewalled against non-browser callers, so this reads the public
 * Reference Rate Archive form instead (one POST returns any date range).
 *
 * Only the USD/INR side is derived from RBI — USD/CNY keeps its own labels
 * (cnyMonthsL / usdcny1yL / usdcny5yL) and is edited by hand in admin.
 */

const ARCHIVE = "https://www.rbi.org.in/Scripts/ReferenceRateArchive.aspx";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const CURRENCY_KEY = "currency";

/** "2026-09-28" -> "28/09/2026" (the archive form's format) */
const toRbiDate = (iso: string) => iso.split("-").reverse().join("/");

/** USD/INR reference rates between two ISO dates, oldest first */
export async function fetchRbiUsd(from: string, to: string): Promise<{ date: string; rate: number }[]> {
  // the form needs the ASP.NET viewstate + session cookie from a fresh GET
  const page = await fetch(ARCHIVE, { headers: { "user-agent": UA }, cache: "no-store" });
  if (!page.ok) throw new Error(`RBI archive: HTTP ${page.status}`);
  const cookie = (page.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const html = await page.text();
  const hidden = (id: string) => html.match(new RegExp(`id="${id}"[^>]*value="([^"]*)"`))?.[1] ?? "";

  const res = await fetch(ARCHIVE, {
    method: "POST",
    cache: "no-store",
    headers: {
      "user-agent": UA,
      cookie,
      "content-type": "application/x-www-form-urlencoded",
      referer: ARCHIVE,
      origin: "https://www.rbi.org.in",
    },
    body: new URLSearchParams({
      __EVENTTARGET: "",
      __EVENTARGUMENT: "",
      __VIEWSTATE: hidden("__VIEWSTATE"),
      __VIEWSTATEGENERATOR: hidden("__VIEWSTATEGENERATOR"),
      __EVENTVALIDATION: hidden("__EVENTVALIDATION"),
      txtFromDate: toRbiDate(from),
      txtToDate: toRbiDate(to),
      chkUSD: "on",
      btnSubmit: "Submit",
    }),
  });
  const out = await res.text();
  if (!res.ok || /Unauthori[sz]ed Access/i.test(out)) throw new Error(`RBI archive blocked the request (HTTP ${res.status})`);

  const rates: { date: string; rate: number }[] = [];
  for (const [, row] of out.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]+>/g, "").trim());
    const m = cells[0]?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const rate = Number(cells[1]);
    if (m && Number.isFinite(rate) && rate > 0) rates.push({ date: `${m[3]}-${m[2]}-${m[1]}`, rate });
  }
  return rates.sort((a, b) => a.date.localeCompare(b.date));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-09-28" -> "Sep-26" (the currency monthly label format) */
const monthLabel = (iso: string) => `${MONTHS[+iso.slice(5, 7) - 1]}-${iso.slice(2, 4)}`;
/** "Sep-26" -> "2026-09" for sorting */
const monthKey = (label: string) => `20${label.slice(4)}-${String(MONTHS.indexOf(label.slice(0, 3)) + 1).padStart(2, "0")}`;
/** "2026-09-28" -> "28/09/26" (daily label format, same as the ICE series) */
const dayLabel = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`;

const round = (n: number, dp: number) => Math.round(n * 10 ** dp) / 10 ** dp;
const isoDaysBefore = (iso: string, days: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") - days * 86400000).toISOString().slice(0, 10);

export type RbiSyncReport = {
  latest: { date: string; rate: number } | null;
  dates: { date: string; status: "added" | "up-to-date" }[];
  months: string[];
  saved: boolean;
};

/**
 * Rebuild the USD/INR series from RBI rates for [from, to]:
 *  - usdinr1yL/V : daily rates, last ~1 year ("dd/mm/yy")
 *  - monthsL/usdinrM : monthly averages — months fully inside the fetched range are
 *    replaced, the current month is month-to-date; older months are kept as stored
 *  - usdinr5yL/V : the last 60 months of the monthly series
 */
export async function syncRbiUsd(
  { from, to, by = "cron:rbi" }: { from?: string; to?: string; by?: string } = {},
): Promise<RbiSyncReport> {
  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  to ??= today;
  from ??= isoDaysBefore(to, 400);

  const doc = await getDataset(CURRENCY_KEY);
  if (!doc) throw new Error(`"${CURRENCY_KEY}" dataset not found`);
  const blob = doc.data as CurrencyBlob;
  const before = JSON.stringify(blob);

  // USD/CNY gets its own label axes (once) so the INR side can be rebuilt freely
  blob.cnyMonthsL ??= [...(blob.monthsL ?? [])];
  blob.usdcny1yL ??= [...(blob.usdinr1yL ?? [])];
  blob.usdcny5yL ??= [...(blob.usdinr5yL ?? [])];

  const rates = await fetchRbiUsd(from, to);
  if (!rates.length) throw new Error(`RBI returned no USD rates for ${from} – ${to}`);

  // daily, last ~1 year
  const oldDaily = new Map((blob.usdinr1yL ?? []).map((l, i) => [l, blob.usdinr1yV?.[i]]));
  const yearAgo = isoDaysBefore(rates.at(-1)!.date, 366);
  const daily = rates.filter((r) => r.date > yearAgo);
  const dates = daily.map((r) => ({
    date: r.date,
    status: oldDaily.get(dayLabel(r.date)) === r.rate ? ("up-to-date" as const) : ("added" as const),
  }));
  blob.usdinr1yL = daily.map((r) => dayLabel(r.date));
  blob.usdinr1yV = daily.map((r) => r.rate);

  // monthly averages
  const byMonth = new Map<string, number[]>();
  for (const r of rates) {
    if (r.date.slice(0, 7) + "-01" < from) continue; // month only partly fetched — keep the stored average
    const l = monthLabel(r.date);
    byMonth.set(l, [...(byMonth.get(l) ?? []), r.rate]);
  }
  const monthly = new Map((blob.monthsL ?? []).map((l, i) => [l, blob.usdinrM?.[i]]));
  for (const [l, vals] of byMonth) monthly.set(l, round(vals.reduce((a, b) => a + b, 0) / vals.length, 2));
  const months = [...monthly].filter(([, v]) => typeof v === "number").sort(([a], [b]) => monthKey(a).localeCompare(monthKey(b)));
  blob.monthsL = months.map(([l]) => l);
  blob.usdinrM = months.map(([, v]) => v as number);

  // 5-year view: the last 60 months
  blob.usdinr5yL = blob.monthsL.slice(-60);
  blob.usdinr5yV = blob.usdinrM.slice(-60);

  const report: RbiSyncReport = { latest: rates.at(-1)!, dates, months: [...byMonth.keys()], saved: false };
  if (JSON.stringify(blob) !== before) {
    await putDataset(CURRENCY_KEY, blob, by, "rbi-usd-sync");
    report.saved = true;
  }
  return report;
}
