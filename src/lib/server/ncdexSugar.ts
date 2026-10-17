import { getDataset, putDataset } from "@/lib/server/datasets";
import { fetchNcdexEvening } from "@/lib/server/ncdexSpot";

/**
 * NCDEX spot prices for the sugar dashboard — Sugar S at Kolhapur (₹/quintal) and Gur at
 * Muzaffarnagar (as NCDEX quotes it) — from https://www.ncdex.com/markets/spotprices, evening
 * poll of each day (same reader as the cotton NCDEX sync). NCDEX keeps about a month; the daily
 * job's look-back adds each new day, so history builds up here.
 */
export const NCDEX_SUGAR = [
  { symbol: "SUGARS", center: "Kolhapur", key: "sugar_kolhapur" },
  { symbol: "GUR", center: "Muzaffar Nagar", key: "gur_muzaffarnagar" },
] as const;

type Row = { date: string; sugar_kolhapur?: number | null; gur_muzaffarnagar?: number | null };

const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const daysBefore = (iso: string, d: number) => new Date(Date.parse(iso + "T00:00:00Z") - d * 86400000).toISOString().slice(0, 10);

/** fetch the last `days` days and merge them into the sugarNcdex dataset (by date) */
export async function syncNcdexSugar({ days = 7 }: { days?: number } = {}) {
  const to = todayIST();
  const fetched = await fetchNcdexEvening(NCDEX_SUGAR.map(({ symbol, center }) => ({ symbol, center })), daysBefore(to, days - 1), to);
  const cur = (await getDataset("sugarNcdex"))?.data as { rows?: Row[]; _sample?: boolean } | undefined;
  const byDate = new Map((cur?.rows ?? []).map((r) => [r.date, { ...r }]));
  const touched = new Map<string, "added" | "updated" | "same">();
  for (const src of NCDEX_SUGAR) {
    for (const p of fetched[src.symbol] ?? []) {
      const row = byDate.get(p.date) ?? { date: p.date };
      const status = row[src.key] == null ? (byDate.has(p.date) ? "updated" : "added") : row[src.key] === p.price ? "same" : "updated";
      row[src.key] = p.price;
      byDate.set(p.date, row);
      const prev = touched.get(p.date);
      touched.set(p.date, prev === "added" || status === "added" ? "added" : prev === "updated" || status === "updated" ? "updated" : "same");
    }
  }
  const dates = [...touched].map(([date, status]) => ({ date, status })).sort((a, b) => b.date.localeCompare(a.date));
  const saved = dates.some((d) => d.status !== "same") || !!cur?._sample;
  if (saved) {
    const rows = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
    await putDataset("sugarNcdex", { source: "NCDEX spot · evening poll", rows }, "cron:ncdex", "sync");
  }
  return { saved, dates, reason: saved ? undefined : "already up to date" };
}
