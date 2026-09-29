import { getDataset, putDataset } from "@/lib/server/datasets";
import type { IntlBlob } from "@/data/international";

/**
 * Daily sync of ICE futures settlements into the `international` dataset:
 *  - ICE Cotton No. 2  -> iceDL / iceDV (¢/lb)
 *  - ICE Brent Crude   -> brDL / brDV   ($/bbl)
 * Daily labels are "dd/mm/yy". Each product follows its most-actively-traded
 * contract month, so the series rolls forward on its own as contracts expire.
 *
 * The monthly axis (iceML / iceMV / brMV) was entered by hand up to Mar 2026;
 * months from `monthlySyncFrom` onward are owned by this sync and recomputed
 * from the daily settlements (averages; the current month is month-to-date).
 */

const ICE = "https://www.ice.com/marketdata/api/productguide/charting";
const HEADERS = { "user-agent": "Mozilla/5.0", accept: "application/json" };
const INTL_KEY = "international";

export const ICE_PRODUCTS = {
  cotton: { name: "Cotton No. 2", productId: 588, hubId: 732, labels: "iceDL", values: "iceDV" },
  brent: { name: "Brent", productId: 254, hubId: 403, labels: "brDL", values: "brDV" },
} as const;
export type IceProduct = keyof typeof ICE_PRODUCTS;

type IceContract = { marketId: number; marketStrip: string; volume: number | null };

/** the contract month with the most volume today, e.g. { marketId: 7608871, marketStrip: "Dec26" } */
export async function activeContract(product: IceProduct): Promise<IceContract> {
  const { productId, hubId } = ICE_PRODUCTS[product];
  const res = await fetch(`${ICE}/contract-data?productId=${productId}&hubId=${hubId}`, {
    headers: HEADERS,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ICE ${product} contracts: HTTP ${res.status}`);
  const list = (await res.json()) as IceContract[];
  if (!list.length) throw new Error(`ICE returned no ${product} contracts`);
  return list.reduce((best, c) => ((c.volume ?? 0) > (best.volume ?? 0) ? c : best));
}

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

/** daily settlements for one contract, oldest first. span: 1 ≈ 3 months, 2 ≈ 1 year, 3 ≈ 2 years (the max) */
export async function fetchIceBars(marketId: number, span = 1): Promise<{ date: string; price: number }[]> {
  const res = await fetch(`${ICE}/data/historical?marketId=${marketId}&historicalSpan=${span}`, {
    headers: HEADERS,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ICE ${marketId}: HTTP ${res.status}`);
  const body = (await res.json()) as { bars?: [string, number][] };
  return (body.bars ?? [])
    .map(([s, price]) => {
      const [, mon, day, , year] = s.split(/\s+/); // "Mon Sep 28 00:00:00 2026"
      return { date: `${year}-${MONTHS[mon]}-${day.padStart(2, "0")}`, price };
    })
    .filter((b) => /^\d{4}-\d{2}-\d{2}$/.test(b.date) && Number.isFinite(b.price));
}

/** "2026-09-28" <-> "28/09/26" */
const toLabel = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`;
const fromLabel = (l: string) => {
  const [d, m, y] = l.split("/");
  return `20${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

export type IceSyncReport = {
  products: Record<string, { contract: string; fetched: number; changed: number }>;
  dates: { date: string; status: "added" | "up-to-date" }[];
  months: string[];
  saved: boolean;
};

/**
 * Merge each product's recent settlements into its daily series, then recompute the
 * sync-owned monthly averages.
 *  - default: add missing dates and correct changed ones within the fetched window
 *  - replace: throw away the stored daily series and use ICE's history only
 */
export async function syncIceFutures(
  {
    products = ["cotton", "brent"] as IceProduct[],
    span = 1,
    replace = false,
    monthlyFrom,
    by = "cron:ice",
  }: { products?: IceProduct[]; span?: number; replace?: boolean; monthlyFrom?: string; by?: string } = {},
): Promise<IceSyncReport> {
  const doc = await getDataset(INTL_KEY);
  if (!doc) throw new Error(`"${INTL_KEY}" dataset not found`);
  const blob = doc.data as IntlBlob & Record<string, unknown>;
  const before = JSON.stringify(blob);

  const report: IceSyncReport = { products: {}, dates: [], months: [], saved: false };
  const changedDates = new Set<string>();
  const daily: Partial<Record<IceProduct, Map<string, number>>> = {};

  for (const product of Object.keys(ICE_PRODUCTS) as IceProduct[]) {
    const { labels, values } = ICE_PRODUCTS[product];
    const series = new Map<string, number>();
    ((blob[labels] as string[] | undefined) ?? []).forEach((l, i) =>
      series.set(fromLabel(l), (blob[values] as number[])[i]),
    );
    daily[product] = series;
    if (!products.includes(product)) continue;

    const contract = await activeContract(product);
    const bars = await fetchIceBars(contract.marketId, span);
    if (replace) series.clear();
    let changed = 0;
    for (const b of bars) {
      if (series.get(b.date) !== b.price) {
        changed++;
        changedDates.add(b.date);
      }
      series.set(b.date, b.price);
    }
    const sorted = [...series].sort(([a], [b]) => a.localeCompare(b));
    blob[labels] = sorted.map(([d]) => toLabel(d));
    blob[values] = sorted.map(([, v]) => v);
    report.products[product] = { contract: contract.marketStrip, fetched: bars.length, changed };
  }
  report.dates = [...changedDates].sort().map((date) => ({ date, status: "added" as const }));

  // monthly averages for the months this sync owns (first run: the month after the last hand-entered one)
  const ml = blob.iceML ?? [];
  if (monthlyFrom) blob.monthlySyncFrom = monthlyFrom;
  if (!blob.monthlySyncFrom && ml.length) {
    const [y, m] = ml.at(-1)!.split("-").map(Number);
    blob.monthlySyncFrom = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  }
  const from = blob.monthlySyncFrom;
  if (from && daily.cotton?.size && daily.brent?.size) {
    const avgByMonth = (s: Map<string, number>) => {
      const acc = new Map<string, number[]>();
      for (const [d, v] of s) if (d.slice(0, 7) >= from) acc.set(d.slice(0, 7), [...(acc.get(d.slice(0, 7)) ?? []), v]);
      return new Map([...acc].map(([k, vs]) => [k, round2(vs.reduce((a, b) => a + b, 0) / vs.length)]));
    };
    const cot = avgByMonth(daily.cotton);
    const br = avgByMonth(daily.brent);
    const owned = [...cot.keys()].filter((k) => br.has(k)).sort();

    const keep = ml.map((l, i) => i).filter((i) => ml[i] < from);
    blob.iceML = [...keep.map((i) => ml[i]), ...owned];
    blob.iceMV = [...keep.map((i) => blob.iceMV[i]), ...owned.map((k) => cot.get(k)!)];
    blob.brMV = [...keep.map((i) => blob.brMV[i]), ...owned.map((k) => br.get(k)!)];
    report.months = owned;
  }

  if (JSON.stringify(blob) !== before) {
    const tag = Object.entries(report.products).map(([p, r]) => `${p}:${r.contract}`).join(",");
    await putDataset(INTL_KEY, blob, by, `ice-sync:${tag}`);
    report.saved = true;
  }
  return report;
}
