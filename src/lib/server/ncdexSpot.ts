import { getDataset, putDataset } from "@/lib/server/datasets";
import { PRICES_STORE_KEY, type PricesBlob } from "@/data/prices";

/**
 * Daily sync of the NCDEX Akola cotton seed oilcake spot price (symbol COCUDAKL) into the
 * `prices` dataset, from https://www.ncdex.com/markets/spotprices. NCDEX polls Akola twice a
 * day — a morning price (~11:20 IST) and an evening price (~15:10 IST); we take the evening one.
 *  - coilc (Cotton Seed Oil Cake) = the evening price
 *  - cseed (Cotton Seed)          = the evening price + 12%
 *
 * The NCDEX site sits behind a browser check that a plain fetch can't pass, so this loads the
 * page in headless Chrome and makes the page's own data request from inside it.
 */

const PAGE = "https://www.ncdex.com/markets/spotprices";
const DATA = "https://www.ncdex.com/spotprices/get_data";
const SYMBOL = "COCUDAKL";
const SEED_MARKUP = 1.12;
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

/** evening Akola oilcake prices between two ISO dates, as { date, time, price }, oldest first */
export async function fetchAkolaOilcake(from: string, to: string): Promise<{ date: string; time: string; price: number }[]> {
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

    const body = {
      _token: token,
      symbol: SYMBOL,
      ftype: "1",
      df: toNcdexDate(from),
      dt: toNcdexDate(to),
      draw: "1",
      start: "0",
      length: "200",
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
      throw new Error(`NCDEX data request failed: ${json.slice(0, 120)}`);
    }

    // group the day's polls, then keep the evening one
    const byDate = new Map<string, { time: string; price: number }[]>();
    for (const r of rows) {
      if (r.center?.trim().toLowerCase() !== "akola") continue;
      const price = Number(String(r.spot_price).replace(/,/g, ""));
      if (!Number.isFinite(price) || price <= 0) continue;
      const date = fromNcdexDate(r.price_date);
      byDate.set(date, [...(byDate.get(date) ?? []), { time: r.price_time, price }]);
    }
    const out: { date: string; time: string; price: number }[] = [];
    for (const [date, polls] of byDate) {
      const last = polls.sort((a, b) => a.time.localeCompare(b.time)).at(-1)!;
      // only the morning poll is out so far — wait for the evening one (the next run's look-back gets it)
      if (polls.length < 2 && last.time < LONE_EVENING_FROM) continue;
      out.push({ date, ...last });
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  } finally {
    await browser.close();
  }
}

export type NcdexSyncReport = {
  dates: { date: string; oilcake: number; seed: number; status: "added" | "up-to-date" }[];
  saved: boolean;
};

const isoDaysBefore = (iso: string, days: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") - days * 86400000).toISOString().slice(0, 10);

/**
 * Fetch the last `days` days of evening Akola prices and add any missing dates to Cotton Seed
 * Oil Cake and Cotton Seed. Dates already stored are left alone unless `overwrite` is set, so
 * admin corrections survive re-runs; the look-back picks up a missed run.
 */
export async function syncNcdexSeedPrices(
  { days = 7, overwrite = false, by = "cron:ncdex" }: { days?: number; overwrite?: boolean; by?: string } = {},
): Promise<NcdexSyncReport> {
  const to = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10); // today in India
  const prices = await fetchAkolaOilcake(isoDaysBefore(to, days - 1), to);

  const doc = await getDataset(PRICES_STORE_KEY);
  if (!doc) throw new Error(`"${PRICES_STORE_KEY}" dataset not found`);
  const blob = doc.data as PricesBlob;
  const oilcake = blob.varieties.find((v) => v.key === "coilc");
  const seed = blob.varieties.find((v) => v.key === "cseed");
  if (!oilcake || !seed) throw new Error("coilc / cseed varieties not found in prices");

  const report: NcdexSyncReport = { dates: [], saved: false };
  for (const p of prices) {
    const values: [typeof oilcake, number][] = [
      [oilcake, Math.round(p.price)],
      [seed, Math.round(p.price * SEED_MARKUP)],
    ];
    let changed = false;
    for (const [v, price] of values) {
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
    report.dates.push({ date: p.date, oilcake: values[0][1], seed: values[1][1], status: changed ? "added" : "up-to-date" });
  }

  if (report.dates.some((d) => d.status === "added")) {
    await putDataset(PRICES_STORE_KEY, blob, by, "ncdex-akola-sync");
    report.saved = true;
  }
  return report;
}
