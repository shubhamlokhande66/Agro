import { getDataset, putDataset } from "@/lib/server/datasets";
import type { IeData } from "@/data/trade";

/**
 * Monthly sync of India's raw-cotton trade (HS 5201, "cotton, not carded or combed") from the
 * Commerce Ministry's TradeStat Export-Import Data Bank (tradestat.commerce.gov.in, monthly
 * "commodity-wise" reports, quantity). The ministry reports kilograms; the dashboard keeps
 * lakh bales of 170 kg, by cotton season (Oct–Sep).
 *
 * Only months after the dataset's `actual_cutoff` are written — everything up to the last actual
 * month is kept exactly as stored. Each newly published month replaces the estimate held for it,
 * the season totals are re-added, and `actual_cutoff` moves to the latest month written.
 * The ministry publishes a month's figures about 6–8 weeks after it ends.
 */

const BASE = "https://tradestat.commerce.gov.in/meidb";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const HS = "5201";
const BALE_KG = 170;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type Flow = "import" | "export";

/** kg → lakh bales of 170 kg, 4 decimals (as the stored data) */
export const kgToLakhBales = (kg: number) => Math.round((kg / BALE_KG / 100000) * 10000) / 10000;

/** cotton season ("2025-26") and month name ("Feb") for a calendar month */
export function seasonOf(year: number, month: number): { season: string; mon: string } {
  const start = month >= 10 ? year : year - 1;
  return { season: `${start}-${String((start + 1) % 100).padStart(2, "0")}`, mon: MON[month - 1] };
}

const cookieJar = (res: Response, jar: Map<string, string>) => {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [kv] = c.split(";");
    const i = kv.indexOf("=");
    jar.set(kv.slice(0, i), kv.slice(i + 1));
  }
};
const cookieHeader = (jar: Map<string, string>) => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");

/**
 * HS 5201 quantity (kg) for one calendar month, or null if it isn't published yet (the report
 * shows 0 for months still to come). Uses the same form a visitor fills in on the site.
 */
export async function fetchCottonTrade(flow: Flow, year: number, month: number): Promise<number | null> {
  const url = `${BASE}/commoditywise_${flow}`;
  const jar = new Map<string, string>();
  const page = await fetch(url, { cache: "no-store", headers: { "user-agent": UA } });
  if (!page.ok) throw new Error(`TradeStat ${flow}: HTTP ${page.status}`);
  cookieJar(page, jar);
  const token = (await page.text()).match(/name="_token" value="([^"]+)"/)?.[1];
  if (!token) throw new Error(`TradeStat ${flow}: form token not found`);

  const p = flow === "import" ? "im" : ""; // the import form's fields are prefixed "im"
  const body = new URLSearchParams({
    _token: token,
    [`${p}ddMonth`]: String(month),
    [`${p}ddYear`]: String(year),
    [`${p}ddCommodityLevel`]: "4",
    comlev: "specific",
    comval: HS,
    [`${p}ddReportVal`]: "2", // quantity
    [`${p}ddReportYear`]: "2", // calendar year
  });
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: { "user-agent": UA, "content-type": "application/x-www-form-urlencoded", cookie: cookieHeader(jar), referer: url },
    body,
  });
  if (!res.ok) throw new Error(`TradeStat ${flow} ${MON[month - 1]}-${year}: HTTP ${res.status}`);
  const html = await res.text();

  // the result table: S. | HS Code | Commodity | Unit | <Mon-prev year> | <Mon-year> | …
  for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
    if (cells[1] !== HS) continue;
    const qty = Number((cells[5] ?? "").replace(/,/g, ""));
    if (!Number.isFinite(qty)) throw new Error(`TradeStat ${flow}: unreadable quantity "${cells[5]}"`);
    return qty > 0 ? qty : null;
  }
  return null; // HS 5201 not listed for the month
}

export type TradeSyncReport = {
  dates: { date: string; status: "added" | "up-to-date"; import: number | null; export: number | null }[];
  cutoff: { season: string; month: string };
  saved: boolean;
};

/** calendar (year, month) of a season + month name */
function calendarOf(season: string, mon: string): { year: number; month: number } {
  const month = MON.indexOf(mon) + 1;
  const start = Number(season.slice(0, 4));
  return { year: month >= 10 ? start : start + 1, month };
}

/**
 * Fill in actual monthly imports and exports published since `actual_cutoff`, up to last month.
 * Stops at the first month the ministry hasn't published (both flows empty).
 */
export async function syncCottonTrade({ by = "cron:tradestat", maxMonths = 14 }: { by?: string; maxMonths?: number } = {}): Promise<TradeSyncReport> {
  const doc = await getDataset("trade");
  if (!doc) throw new Error(`"trade" dataset not found`);
  const blob = doc.data as IeData;
  const before = JSON.stringify(blob);

  const cut = blob.actual_cutoff?.season && blob.actual_cutoff?.month ? calendarOf(blob.actual_cutoff.season, blob.actual_cutoff.month) : null;
  if (!cut) throw new Error("trade: actual_cutoff is not set — set the last actual month in admin first");

  const now = new Date(Date.now() + 330 * 60000);
  const lastY = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const lastM = now.getUTCMonth() === 0 ? 12 : now.getUTCMonth(); // the month just ended

  const report: TradeSyncReport = { dates: [], cutoff: blob.actual_cutoff, saved: false };
  let y = cut.year;
  let m = cut.month;
  for (let i = 0; i < maxMonths; i++) {
    m += 1;
    if (m > 12) (m = 1), (y += 1);
    if (y > lastY || (y === lastY && m > lastM)) break;

    const [impKg, expKg] = await Promise.all([fetchCottonTrade("import", y, m), fetchCottonTrade("export", y, m)]);
    if (impKg == null && expKg == null) break; // not published yet

    const { season, mon } = seasonOf(y, m);
    const imp = impKg == null ? 0 : kgToLakhBales(impKg);
    const exp = expKg == null ? 0 : kgToLakhBales(expKg);
    if (!blob.seasons.includes(season)) blob.seasons = [...blob.seasons, season].sort();
    blob.import[season] = { ...(blob.import[season] ?? {}), [mon]: imp };
    blob.export[season] = { ...(blob.export[season] ?? {}), [mon]: exp };
    const sum = (r: Record<string, number> | undefined) =>
      Math.round(Object.values(r ?? {}).reduce((a, v) => a + (typeof v === "number" ? v : 0), 0) * 10000) / 10000;
    blob.import_totals[season] = sum(blob.import[season]);
    blob.export_totals[season] = sum(blob.export[season]);
    blob.actual_cutoff = { season, month: mon };
    report.dates.push({ date: `${MON[m - 1]}-${y}`, status: "added", import: imp, export: exp });
  }

  report.cutoff = blob.actual_cutoff;
  if (JSON.stringify(blob) !== before) {
    await putDataset("trade", blob, by, "tradestat-sync");
    report.saved = true;
  }
  return report;
}
