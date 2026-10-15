import { getDataset, putDataset } from "@/lib/server/datasets";
import { PRICES_STORE_KEY, type PricesBlob } from "@/data/prices";

/**
 * Daily sync of NCDEX spot prices into the `prices` dataset, from
 * https://www.ncdex.com/markets/spotprices. NCDEX polls each centre twice a day — a morning and
 * an evening price — and we take the evening one. Poll times drift (Akola oilcake Oct 2026:
 * ~11:20 / ~15:10, Sep 2026: ~13:25 / ~16:45; Rajkot kapas: ~13:15 / ~16:30), so the evening price
 * is the later of the day's two polls, and a day with only one poll counts only if it is late enough.
 * NCDEX keeps about a month of history per symbol.
 *
 * The NCDEX site sits behind a browser check that a plain fetch can't pass, so this loads the
 * page in headless Chrome and makes the page's own data request from inside it.
 */

/** NCDEX symbol -> the dashboard varieties it feeds, each as evening price × factor (rounded) */
export const NCDEX_SOURCES: { symbol: string; center: string; targets: { key: string; factor: number }[] }[] = [
  // Cotton Seed Oilcake, Akola (₹/quintal): oil cake as quoted, cotton seed 12% above it
  { symbol: "COCUDAKL", center: "Akola", targets: [{ key: "coilc", factor: 1 }, { key: "cseed", factor: 1.12 }] },
  // Kapas, Rajkot — quoted per man (20 kg); × 5 for ₹/quintal
  { symbol: "KAPAS", center: "Rajkot", targets: [{ key: "kapas", factor: 5 }] },
];

const PAGE = "https://www.ncdex.com/markets/spotprices";
const DATA = "https://www.ncdex.com/spotprices/get_data";
/** a lone poll at or after this time is taken as the evening one */
const LONE_EVENING_FROM = "15:00:00";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-14" -> "14-Oct-2026" (the format NCDEX's endpoint expects) */
const toNcdexDate = (iso: string) => `${iso.slice(8, 10)}-${MONTHS[+iso.slice(5, 7) - 1]}-${iso.slice(0, 4)}`;
/** "14-Oct-2026" -> "2026-10-14" */
const fromNcdexDate = (s: string) => {
  const [d, m, y] = s.split("-");
  return `${y}-${String(MONTHS.indexOf(m) + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
};

type NcdexRow = { center: string; price_date: string; price_time: string; spot_price: string };
export type EveningPrice = { date: string; time: string; price: number };

async function launchBrowser() {
  const puppeteer = (await import("puppeteer-core")).default;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
  }
  // local runs (npm run sync:ncdex): the installed Chrome
  return puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
}

/** keep the evening poll of each day, oldest first */
function eveningPrices(rows: NcdexRow[], center: string): EveningPrice[] {
  const byDate = new Map<string, { time: string; price: number }[]>();
  for (const r of rows) {
    if (r.center?.trim().toLowerCase() !== center.toLowerCase()) continue;
    const price = Number(String(r.spot_price).replace(/,/g, ""));
    if (!Number.isFinite(price) || price <= 0) continue;
    const date = fromNcdexDate(r.price_date);
    byDate.set(date, [...(byDate.get(date) ?? []), { time: r.price_time, price }]);
  }
  const out: EveningPrice[] = [];
  for (const [date, polls] of byDate) {
    const last = polls.sort((a, b) => a.time.localeCompare(b.time)).at(-1)!;
    // only the morning poll is out so far — wait for the evening one (the next run's look-back gets it)
    if (polls.length < 2 && last.time < LONE_EVENING_FROM) continue;
    out.push({ date, ...last });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** evening prices between two ISO dates for each NCDEX symbol, as { symbol: [{ date, time, price }] } */
export async function fetchNcdexEvening(
  symbols: { symbol: string; center: string }[],
  from: string,
  to: string,
): Promise<Record<string, EveningPrice[]>> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(PAGE, { waitUntil: "domcontentloaded", timeout: 30000 });

    // the browser check reloads the page once it passes; the real page carries a form token
    let token: string | null = null;
    for (let i = 0; i < 40 && !token; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        token = await page.evaluate(() => document.documentElement.innerHTML.match(/d\._token = "([^"]+)"/)?.[1] ?? null);
      } catch {
        // the page navigated mid-check — try again
      }
    }
    if (!token) throw new Error("NCDEX page did not load (browser check not passed)");

    const out: Record<string, EveningPrice[]> = {};
    for (const { symbol, center } of symbols) {
      const body = {
        _token: token,
        symbol,
        ftype: "1",
        df: toNcdexDate(from),
        dt: toNcdexDate(to),
        draw: "1",
        start: "0",
        length: "500",
        "order[0][column]": "2",
        "order[0][dir]": "asc",
      };
      const json = await page.evaluate(
        async (url, form) => {
          const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "x-requested-with": "XMLHttpRequest" },
            body: new URLSearchParams(form),
          });
          return res.ok ? res.text() : `HTTP ${res.status}`;
        },
        DATA,
        body,
      );
      let rows: NcdexRow[];
      try {
        rows = (JSON.parse(json) as { data: NcdexRow[] }).data ?? [];
      } catch {
        throw new Error(`NCDEX ${symbol} data request failed: ${json.slice(0, 120)}`);
      }
      out[symbol] = eveningPrices(rows, center);
    }
    return out;
  } finally {
    await browser.close();
  }
}

export type NcdexSyncReport = {
  dates: { date: string; symbol: string; prices: Record<string, number>; status: "added" | "up-to-date" }[];
  saved: boolean;
};

const isoDaysBefore = (iso: string, days: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") - days * 86400000).toISOString().slice(0, 10);

/**
 * Fetch the last `days` days of evening prices for every NCDEX source and add any missing dates
 * to the varieties they feed. Dates already stored are left alone unless `overwrite` is set, so
 * admin corrections survive re-runs; the look-back picks up a missed run.
 */
export async function syncNcdexSpotPrices(
  {
    days = 7,
    overwrite = false,
    symbols,
    by = "cron:ncdex",
  }: { days?: number; overwrite?: boolean; symbols?: string[]; by?: string } = {},
): Promise<NcdexSyncReport> {
  const sources = NCDEX_SOURCES.filter((s) => !symbols || symbols.includes(s.symbol));
  const to = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10); // today in India
  const fetched = await fetchNcdexEvening(sources, isoDaysBefore(to, days - 1), to);

  const doc = await getDataset(PRICES_STORE_KEY);
  if (!doc) throw new Error(`"${PRICES_STORE_KEY}" dataset not found`);
  const blob = doc.data as PricesBlob;

  const report: NcdexSyncReport = { dates: [], saved: false };
  for (const src of sources) {
    for (const p of fetched[src.symbol] ?? []) {
      const prices: Record<string, number> = {};
      let changed = false;
      for (const { key, factor } of src.targets) {
        const v = blob.varieties.find((x) => x.key === key);
        if (!v) throw new Error(`"${key}" variety not found in prices`);
        const price = Math.round(p.price * factor);
        prices[key] = price;
        v.daily = Array.isArray(v.daily) ? v.daily : [];
        const existing = v.daily.find((d) => d.date === p.date);
        if (existing) {
          if (!overwrite || existing.price === price) continue;
          existing.price = price;
        } else {
          v.daily.push({ date: p.date, price });
          v.daily.sort((a, b) => a.date.localeCompare(b.date));
        }
        changed = true;
      }
      report.dates.push({ date: p.date, symbol: src.symbol, prices, status: changed ? "added" : "up-to-date" });
    }
  }

  if (report.dates.some((d) => d.status === "added")) {
    await putDataset(PRICES_STORE_KEY, blob, by, "ncdex-spot-sync");
    report.saved = true;
  }
  return report;
}
