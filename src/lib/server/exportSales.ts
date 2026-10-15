import { getDataset, putDataset } from "@/lib/server/datasets";
import type { EsBlob, EsDest, EsWeek, EsYear } from "@/data/exportSales";

/**
 * Weekly sync of USDA FAS Export Sales Reporting (ESR) for US upland cotton (commodity 1404, all
 * staple lengths) into the `exportSales` dataset, from the FAS Open Data API (api.fas.usda.gov).
 * FAS publishes each Thursday at 8:30 ET for the week ending the previous Thursday; figures are
 * running bales. The API needs an api.data.gov key — set FAS_API_KEY; without it the shared,
 * heavily rate-limited DEMO_KEY is used.
 *
 * Kept per marketing year (Aug–Jul; FAS "marketYear 2027" = 2026/27): weekly totals across all
 * destinations, and per-country totals for the latest week (current year) and the same week a
 * year earlier, for the top-destinations comparison.
 */

const API = "https://api.fas.usda.gov/api/esr";
const COMMODITY = 1404; // All Upland Cotton
const YEARS_KEPT = 5;

type ApiRow = {
  countryCode: number;
  weeklyExports: number;
  accumulatedExports: number;
  outstandingSales: number;
  grossNewSales: number;
  currentMYNetSales: number;
  currentMYTotalCommitment: number;
  nextMYOutstandingSales: number;
  nextMYNetSales: number;
  weekEndingDate: string;
};

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    headers: { "X-Api-Key": process.env.FAS_API_KEY || "DEMO_KEY" },
  });
  if (res.status === 429) throw new Error("FAS API rate limit reached — set FAS_API_KEY (free from api.data.gov)");
  if (!res.ok) throw new Error(`FAS API ${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** "2027" (FAS market year) → "2026/27" */
const myLabel = (fasYear: number) => `${fasYear - 1}/${String(fasYear % 100).padStart(2, "0")}`;

/** the FAS market year in progress: Aug 2026 → Jul 2027 is 2027 */
export function currentFasYear(now = new Date()): number {
  return now.getUTCMonth() >= 7 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
}

function summarise(rows: ApiRow[], names: Map<number, string>, fasYear: number): { year: EsYear; byWeek: Map<string, Map<string, number>> } {
  const weeks = new Map<string, EsWeek>();
  const byWeek = new Map<string, Map<string, number>>(); // week → country → total commitment
  for (const r of rows) {
    const week = r.weekEndingDate.slice(0, 10);
    const w = weeks.get(week) ?? {
      week, netSales: 0, exports: 0, accExports: 0, outstanding: 0, commitment: 0, nextNetSales: 0, nextOutstanding: 0,
    };
    w.netSales += r.currentMYNetSales ?? 0;
    w.exports += r.weeklyExports ?? 0;
    w.accExports += r.accumulatedExports ?? 0;
    w.outstanding += r.outstandingSales ?? 0;
    w.commitment += r.currentMYTotalCommitment ?? (r.accumulatedExports ?? 0) + (r.outstandingSales ?? 0);
    w.nextNetSales += r.nextMYNetSales ?? 0;
    w.nextOutstanding += r.nextMYOutstandingSales ?? 0;
    weeks.set(week, w);
    const name = names.get(r.countryCode) ?? `#${r.countryCode}`;
    const m = byWeek.get(week) ?? new Map<string, number>();
    m.set(name, (m.get(name) ?? 0) + (r.currentMYTotalCommitment ?? (r.accumulatedExports ?? 0) + (r.outstandingSales ?? 0)));
    byWeek.set(week, m);
  }
  return {
    year: { year: myLabel(fasYear), weeks: [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week)) },
    byWeek,
  };
}

export type EsSyncReport = { dates: { date: string; status: "added" | "up-to-date" }[]; saved: boolean; latestWeek: string | null };

/**
 * Refresh the current and previous marketing years (FAS revises recent weeks) and fill in older
 * years the first time. Re-reads whole years each run — two API calls on a normal day.
 */
export async function syncExportSales({ by = "cron:exportsales" }: { by?: string } = {}): Promise<EsSyncReport> {
  const doc = await getDataset("exportSales");
  const stored = (doc?.data ?? {}) as Partial<EsBlob>;
  const before = JSON.stringify(stored);
  const years = new Map((stored.years ?? []).map((y) => [y.year, y]));

  const countries = await api<{ countryCode: number; countryName: string }[]>("/countries");
  const names = new Map(countries.map((c) => [c.countryCode, c.countryName.trim().replace(/\s+/g, " ")]));

  const cur = currentFasYear();
  const fetchYears = [cur, cur - 1, ...[2, 3, 4].map((i) => cur - i).filter((y) => !years.has(myLabel(y)))].slice(0, YEARS_KEPT);
  const perWeek = new Map<number, Map<string, Map<string, number>>>();
  for (const y of fetchYears) {
    const rows = await api<ApiRow[]>(`/exports/commodityCode/${COMMODITY}/allCountries/marketYear/${y}`);
    if (!rows.length) continue;
    const { year, byWeek } = summarise(rows, names, y);
    years.set(year.year, year);
    perWeek.set(y, byWeek);
  }

  // top destinations: latest week of the current year vs the same week number a year earlier
  let destinations: EsDest[] = stored.destinations ?? [];
  let destWeek = stored.destWeek ?? null;
  const curWeeks = perWeek.get(cur) ?? perWeek.get(cur - 1);
  const curYear = years.get(myLabel(perWeek.has(cur) ? cur : cur - 1));
  if (curWeeks && curYear?.weeks.length) {
    const lastWeek = curYear.weeks.at(-1)!.week;
    const idx = curYear.weeks.length - 1;
    const prevLabel = myLabel((perWeek.has(cur) ? cur : cur - 1) - 1);
    const prevWeekDate = years.get(prevLabel)?.weeks[idx]?.week;
    const prevByWeek = perWeek.get((perWeek.has(cur) ? cur : cur - 1) - 1);
    const now = curWeeks.get(lastWeek) ?? new Map();
    const then = (prevWeekDate && prevByWeek?.get(prevWeekDate)) || new Map<string, number>();
    destinations = [...now]
      .map(([country, commitment]) => ({ country, commitment, lastYear: then.get(country) ?? 0 }))
      .sort((a, b) => b.commitment - a.commitment);
    destWeek = lastWeek;
  }

  const blob: EsBlob = {
    commodity: "US upland cotton (all staple lengths)",
    unit: "running bales",
    years: [...years.values()].sort((a, b) => b.year.localeCompare(a.year)).slice(0, YEARS_KEPT),
    destinations,
    destWeek,
  };

  const report: EsSyncReport = { dates: [], saved: false, latestWeek: blob.years[0]?.weeks.at(-1)?.week ?? null };
  const oldWeeks = new Set((stored.years ?? []).flatMap((y) => y.weeks.map((w) => `${y.year}|${w.week}`)));
  for (const y of blob.years) for (const w of y.weeks) if (!oldWeeks.has(`${y.year}|${w.week}`)) report.dates.push({ date: w.week, status: "added" });
  if (JSON.stringify(blob) !== before) {
    await putDataset("exportSales", blob, by, "fas-esr-sync");
    report.saved = true;
  }
  return report;
}
