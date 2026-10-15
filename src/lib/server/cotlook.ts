import { getDataset, putDataset } from "@/lib/server/datasets";
import type { CotlookBlob } from "@/data/cotlook";

/**
 * Sync of the Cotlook A Index (US cents / lb) into the `cotlook` dataset:
 *  - daily: the value Cotlook shows publicly on its homepage index widget (one value per
 *    working day, ~13:30 GMT). Cotlook's own history is for subscribers only, so the daily
 *    series is built up one day at a time from when this sync started.
 *  - monthly: the World Bank Pink Sheet's "Cotton, A Index" ($/kg, monthly averages back to
 *    1960), converted to ¢/lb. The workbook URL changes monthly, so it's looked up on the
 *    Commodity Markets page each time.
 */

const COTLOOK_HOME = "https://www.cotlook.com/";
const WB_PAGE = "https://www.worldbank.org/en/research/commodity-markets";
const KEY = "cotlook";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const KG_PER_LB = 0.45359237;

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/** today's A Index from Cotlook's homepage widget: "Date of index value: 13:30 GMT 14th Oct, 2026 … A Index 91.25" */
export async function fetchCotlookDaily(): Promise<{ date: string; value: number }> {
  const res = await fetch(COTLOOK_HOME, { cache: "no-store", headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`Cotlook: HTTP ${res.status}`);
  const text = (await res.text()).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const d = text.match(/Date of index value:.*?(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3})[a-z]*,?\s+(\d{4})/);
  const v = text.match(/A Index\s+(\d{2,3}(?:\.\d+)?)/);
  const mm = d ? MONTHS[d[2].toLowerCase()] : undefined;
  if (!d || !mm || !v) throw new Error("Cotlook: A Index not found on the homepage");
  return { date: `${d[3]}-${mm}-${d[1].padStart(2, "0")}`, value: Number(v[1]) };
}

/** World Bank monthly "Cotton, A Index" ($/kg) as { month: "YYYY-MM", value: ¢/lb } */
export async function fetchWorldBankAIndex(): Promise<{ month: string; value: number }[]> {
  const page = await fetch(WB_PAGE, { cache: "no-store", headers: { "user-agent": UA } });
  if (!page.ok) throw new Error(`World Bank: HTTP ${page.status}`);
  const url = (await page.text()).match(/https?:\/\/[^"' ]*CMO-Historical-Data-Monthly[^"' ]*\.xlsx/)?.[0];
  if (!url) throw new Error("World Bank: monthly prices workbook link not found");
  const file = await fetch(url, { cache: "no-store", headers: { "user-agent": UA } });
  if (!file.ok) throw new Error(`World Bank workbook: HTTP ${file.status}`);

  const XLSX = await import("xlsx");
  const wb = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
  const ws = wb.Sheets["Monthly Prices"];
  if (!ws) throw new Error("World Bank workbook: 'Monthly Prices' sheet missing");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null });
  const hdr = rows.findIndex((r) => r?.some((c) => typeof c === "string" && /^cotton,\s*a index/i.test(c)));
  if (hdr < 0) throw new Error("World Bank workbook: 'Cotton, A Index' column missing");
  const col = rows[hdr].findIndex((c) => typeof c === "string" && /^cotton,\s*a index/i.test(c));

  const out: { month: string; value: number }[] = [];
  for (const r of rows.slice(hdr + 1)) {
    const m = String(r?.[0] ?? "").match(/^(\d{4})M(\d{2})$/);
    const usdKg = Number(r?.[col]);
    if (m && Number.isFinite(usdKg) && usdKg > 0) {
      out.push({ month: `${m[1]}-${m[2]}`, value: Math.round(usdKg * 100 * KG_PER_LB * 100) / 100 }); // $/kg → ¢/kg → ¢/lb
    }
  }
  if (!out.length) throw new Error("World Bank workbook: no A Index values");
  return out;
}

export type CotlookSyncReport = {
  dates: { date: string; status: "added" | "up-to-date" }[];
  months: number;
  latest: { date: string; value: number } | null;
  saved: boolean;
  errors: string[];
};

/** add today's Cotlook value (if new) and refresh the World Bank monthly history; either half can fail alone */
export async function syncCotlook({ by = "cron:cotlook" }: { by?: string } = {}): Promise<CotlookSyncReport> {
  const doc = await getDataset(KEY);
  const stored = (doc?.data ?? {}) as Partial<CotlookBlob>;
  const blob: CotlookBlob = { daily: stored.daily ?? [], monthly: stored.monthly ?? [] };
  const before = JSON.stringify(blob);
  const report: CotlookSyncReport = { dates: [], months: 0, latest: null, saved: false, errors: [] };

  try {
    const today = await fetchCotlookDaily();
    report.latest = today;
    const existing = blob.daily.find((p) => p.date === today.date);
    if (existing && existing.value === today.value) {
      report.dates.push({ date: today.date, status: "up-to-date" });
    } else {
      blob.daily = [...blob.daily.filter((p) => p.date !== today.date), today].sort((a, b) => a.date.localeCompare(b.date));
      report.dates.push({ date: today.date, status: "added" });
    }
  } catch (e) {
    report.errors.push(e instanceof Error ? e.message : "Cotlook daily failed");
  }

  try {
    const months = await fetchWorldBankAIndex();
    const byMonth = new Map(blob.monthly.map((m) => [m.month, m.value]));
    for (const m of months) byMonth.set(m.month, m.value);
    blob.monthly = [...byMonth].map(([month, value]) => ({ month, value })).sort((a, b) => a.month.localeCompare(b.month));
    report.months = months.length;
  } catch (e) {
    report.errors.push(e instanceof Error ? e.message : "World Bank monthly failed");
  }

  if (report.errors.length === 2) throw new Error(report.errors.join("; "));
  if (JSON.stringify(blob) !== before) {
    await putDataset(KEY, blob, by, "cotlook-sync");
    report.saved = true;
  }
  return report;
}
