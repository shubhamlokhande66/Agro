import { getDataset, putDataset } from "@/lib/server/datasets";
import { PRICES_STORE_KEY, type PricesBlob } from "@/data/prices";

/**
 * Daily sync of Cotton Association of India (CAI) upcountry spot rates into the
 * `prices` dataset. CAI publishes one table per trading day (no Sundays), usually
 * around 18:30–19:00 IST, at https://www.caionline.in/details/cai/spot-rates.
 */

const CAI_ENDPOINT = "https://www.caionline.in/details/cai/spot-rates/by/date";

/** one row of the CAI table (only the fields we use) */
type CaiRow = {
  growth: string;
  grade_standard: string;
  staple: string;
  per_candy: string; // current season, ₹ / candy (356 kg); "0" = not quoted
};

type CaiResponse = {
  master: { published_date: string } | [];
  list?: CaiRow[];
};

/** our variety key -> the CAI row it tracks (matched on growth + grade standard + staple) */
export const CAI_VARIETY_MAP: Record<string, { growth: string; grade_standard: string; staple: string }> = {
  guj28: { growth: "GUJ", grade_standard: "ICS-105", staple: "28 mm" },
  guj29: { growth: "GUJ", grade_standard: "ICS-105", staple: "29 mm" },
  mma28: { growth: "M/M(P)", grade_standard: "ICS-105", staple: "28 mm" },
  mmak29: { growth: "M/M(P)", grade_standard: "ICS-105", staple: "29 mm" },
  cs30: { growth: "M/M(P)", grade_standard: "ICS-105", staple: "30 mm" },
  cs31: { growth: "M/M(P)", grade_standard: "ICS-105", staple: "31 mm" },
  phr28: { growth: "P/H/R(U)", grade_standard: "ICS-105", staple: "28 mm" },
};

/** labels drift over the years ("28mm" before 2023-ish, "28 mm" now) — compare without whitespace */
const norm = (s: string) => s.replace(/\s+/g, "").toUpperCase();

/** "2026-09-28" -> "28-09-2026" (the format CAI's endpoint expects) */
const toCaiDate = (iso: string) => iso.split("-").reverse().join("-");

/** CAI rates for one ISO date as { varietyKey: price }, or null if nothing was published that day */
export async function fetchCaiSpotRates(date: string): Promise<Record<string, number> | null> {
  const form = new FormData();
  form.append("date", toCaiDate(date));
  const res = await fetch(CAI_ENDPOINT, { method: "POST", body: form, cache: "no-store" });
  if (!res.ok) throw new Error(`CAI ${date}: HTTP ${res.status}`);
  const body = (await res.json()) as CaiResponse | [];

  if (Array.isArray(body) || Array.isArray(body.master) || !body.list?.length) return null;
  if (body.master.published_date !== date) return null;

  const out: Record<string, number> = {};
  for (const [key, want] of Object.entries(CAI_VARIETY_MAP)) {
    const row = body.list.find(
      (r) =>
        norm(r.growth) === norm(want.growth) &&
        norm(r.grade_standard) === norm(want.grade_standard) &&
        norm(r.staple) === norm(want.staple),
    );
    const price = row ? Number(row.per_candy) : NaN;
    if (Number.isFinite(price) && price > 0) out[key] = price;
  }
  return out;
}

/** today's date in India as "YYYY-MM-DD" */
export function todayIST(): string {
  return new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
}

/** the last `days` calendar dates up to and including `end`, oldest first, Sundays dropped */
export function recentTradingDates(end: string, days: number): string[] {
  const out: string[] = [];
  const t = new Date(end + "T00:00:00Z").getTime();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(t - i * 86400000);
    if (d.getUTCDay() !== 0) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export type CaiSyncReport = {
  dates: { date: string; status: "added" | "no-data" | "up-to-date"; added: string[] }[];
  saved: boolean;
};

/**
 * Fetch CAI rates for each date and add them to the `prices` dataset's daily quotes.
 * Dates a variety already has are left alone unless `overwrite` is set, so admin
 * corrections survive re-runs.
 */
export async function syncCaiSpotRates(
  dates: string[],
  { overwrite = false, by = "cron:cai" }: { overwrite?: boolean; by?: string } = {},
): Promise<CaiSyncReport> {
  const doc = await getDataset(PRICES_STORE_KEY);
  if (!doc) throw new Error(`"${PRICES_STORE_KEY}" dataset not found`);
  const blob = doc.data as PricesBlob;

  // fetch a few dates at a time (a multi-year backfill is ~300 requests per year)
  const fetched: (Record<string, number> | null)[] = new Array(dates.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < dates.length) {
        const i = next++;
        fetched[i] = await fetchCaiSpotRates(dates[i]);
      }
    }),
  );

  const report: CaiSyncReport = { dates: [], saved: false };
  for (const [i, date] of dates.entries()) {
    const rates = fetched[i];
    if (!rates || Object.keys(rates).length === 0) {
      report.dates.push({ date, status: "no-data", added: [] });
      continue;
    }
    const added: string[] = [];
    for (const v of blob.varieties) {
      const price = rates[v.key];
      if (price == null) continue;
      v.daily = Array.isArray(v.daily) ? v.daily : [];
      const existing = v.daily.find((p) => p.date === date);
      if (existing) {
        if (!overwrite || existing.price === price) continue;
        existing.price = price;
      } else {
        v.daily.push({ date, price });
        v.daily.sort((a, b) => a.date.localeCompare(b.date));
      }
      added.push(v.key);
    }
    report.dates.push({ date, status: added.length ? "added" : "up-to-date", added });
  }

  if (report.dates.some((d) => d.status === "added")) {
    await putDataset(PRICES_STORE_KEY, blob, by, "cai-spot-sync");
    report.saved = true;
  }
  return report;
}
