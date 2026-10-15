import { getDataset, putDataset } from "@/lib/server/datasets";
import type { WasdeBlob, WasdeReport, WasdeRow, WasdeYear } from "@/data/wasde";

/**
 * Monthly sync of USDA's WASDE "World Cotton Supply and Use" tables into the `wasdeReports`
 * dataset — one snapshot per report, so revisions between reports can be shown. Reports come from
 * USDA's ESMIS archive (esmis.nal.usda.gov, the National Agricultural Library), which lists every
 * release with its Excel file. WASDE is released around the 9th–12th of each month at noon ET.
 *
 * Each report covers three marketing years (Aug–Jul): the previous year, the current estimate
 * ("Est.") and the projection ("Proj."); for the projection the table prints last month's and this
 * month's figures, both kept. Values are million 480-lb bales, as published.
 */

const ESMIS = "https://esmis.nal.usda.gov";
const LISTING = `${ESMIS}/publication/world-agricultural-supply-and-demand-estimates`;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const KEEP = 36; // reports kept (3 years)

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const COLS = ["beginningStocks", "production", "imports", "domesticUse", "exports", "loss", "endingStocks"] as const;

/** releases on one page of the archive listing, newest first: { released: "2026-10-09", xls: url } */
export async function listWasdeReleases(page = 0): Promise<{ released: string; xls: string }[]> {
  const res = await fetch(`${LISTING}?page=${page}`, { cache: "no-store", headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`ESMIS listing: HTTP ${res.status}`);
  const html = await res.text();
  const out: { released: string; xls: string }[] = [];
  for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const date = row.match(/<time datetime="(\d{4}-\d{2}-\d{2})/)?.[1];
    // corrected re-issues are named e.g. "wasde0626v2.xls"
    const xls = row.match(/href="([^"]+\/wasde\d{4}(?:v\d+)?\.xls)"/)?.[1];
    if (date && xls) out.push({ released: date, xls: xls.startsWith("http") ? xls : ESMIS + xls });
  }
  return out;
}

const num = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  const s = String(v ?? "").trim();
  if (!s || /^filler$/i.test(s)) return null;
  if (/^\d+\/$/.test(s)) return 0; // footnote "3/": negligible (under 5,000 bales)
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};
/** "Central Asia  5/" → "Central Asia" */
const cleanName = (s: unknown) => String(s ?? "").replace(/\s+\d+\/\s*$/, "").replace(/\s+/g, " ").trim();
const toRow = (cells: unknown[]): WasdeRow | null => {
  const vals = cells.map(num);
  if (vals.length < 7 || vals.some((v) => v == null)) return null;
  return Object.fromEntries(COLS.map((c, i) => [c, vals[i] as number])) as WasdeRow;
};

/** the World Cotton Supply and Use tables of one WASDE Excel file */
export async function parseWasdeCotton(buf: ArrayBuffer): Promise<{ title: string; years: WasdeYear[] }> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(Buffer.from(buf), { type: "buffer" });
  const years: WasdeYear[] = [];
  let title = "";

  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: null, raw: true });
    if (!rows.some((r) => r?.some((c) => typeof c === "string" && /World Cotton Supply and Use/i.test(c)))) continue;
    title ||= String(rows[0]?.find((c) => typeof c === "string" && /\d{4}/.test(c)) ?? "").trim();

    let year: WasdeYear | null = null;
    let country = "";
    for (const r of rows) {
      if (!r) continue;
      const first = String(r[0] ?? "").trim();
      const head = first.match(/^(\d{4}\/\d{2})\s*(Est\.|Proj\.)?$/);
      if (head && r.some((c) => typeof c === "string" && /Stocks/i.test(c))) {
        year = { year: head[1], status: head[2] === "Proj." ? "proj" : head[2] === "Est." ? "est" : "final", countries: {} };
        years.push(year);
        country = "";
        continue;
      }
      if (!year) continue;
      if (first) country = cleanName(first);
      if (!country) continue;
      // projection rows carry the month ("Sep" / "Oct") in the second column; other years don't
      const mon = String(r[1] ?? "").trim();
      if (/^[A-Z][a-z]{2}$/.test(mon)) {
        const row = toRow(r.slice(2, 9));
        if (!row) continue;
        // first month row is last month's projection ("Sep"), the next is this month's ("Oct")
        const e = year.countries[country];
        if (!e) year.countries[country] = { current: row, label: mon };
        else Object.assign(e, { prevMonth: e.current, prevLabel: e.label, current: row, label: mon });
      } else if (first) {
        const row = toRow(r.slice(1, 8));
        if (row) year.countries[country] = { current: row };
      }
    }
  }
  if (!years.length) throw new Error("World Cotton Supply and Use table not found");
  return { title, years };
}

/** "October 2026" → "2026-10" */
const monthKey = (title: string) => {
  const m = title.match(/([A-Za-z]+)\s+(\d{4})/);
  const i = m ? MONTHS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase()) : -1;
  return m && i >= 0 ? `${m[2]}-${String(i + 1).padStart(2, "0")}` : null;
};

export type WasdeSyncReport = { dates: { date: string; status: "added" | "up-to-date" }[]; saved: boolean; latest: string | null };

/**
 * Add any WASDE reports not stored yet. Reads the archive listing (newest first) until it reaches
 * a report it already has, or `minReports` are covered for a first fill.
 */
export async function syncWasde({ by = "cron:wasde", minReports = 15 }: { by?: string; minReports?: number } = {}): Promise<WasdeSyncReport> {
  const doc = await getDataset("wasdeReports");
  const blob: WasdeBlob = { reports: ((doc?.data as WasdeBlob | undefined)?.reports ?? []).slice() };
  const have = new Set(blob.reports.map((r) => r.month));
  const report: WasdeSyncReport = { dates: [], saved: false, latest: null };

  const wanted: { released: string; xls: string; month: string }[] = [];
  const queued = new Set<string>();
  for (let page = 0; page < 4 && wanted.length < minReports; page++) {
    const list = await listWasdeReleases(page);
    if (!list.length) break;
    let reachedStored = false;
    for (const r of list) {
      const key = r.xls.match(/wasde(\d{2})(\d{2})(?:v\d+)?\.xls$/);
      const month = key ? `20${key[2]}-${key[1]}` : null;
      if (!month || queued.has(month)) continue; // the newest release also shows on every listing page
      if (have.has(month)) {
        reachedStored = true;
        continue;
      }
      queued.add(month);
      wanted.push({ ...r, month });
    }
    if (reachedStored && have.size >= minReports) break;
  }

  for (const r of wanted.slice(0, Math.max(minReports, 3))) {
    const file = await fetch(r.xls, { cache: "no-store", headers: { "user-agent": UA } });
    if (!file.ok) throw new Error(`WASDE file ${r.xls}: HTTP ${file.status}`);
    const parsed = await parseWasdeCotton(await file.arrayBuffer());
    const month = monthKey(parsed.title) ?? r.released.slice(0, 7);
    if (have.has(month)) continue;
    blob.reports.push({ month, title: parsed.title || month, released: r.released, years: parsed.years } satisfies WasdeReport);
    have.add(month);
    report.dates.push({ date: month, status: "added" });
  }

  blob.reports.sort((a, b) => b.month.localeCompare(a.month));
  blob.reports = blob.reports.slice(0, KEEP);
  report.latest = blob.reports[0]?.month ?? null;
  if (report.dates.length) {
    await putDataset("wasdeReports", blob, by, "wasde-sync");
    report.saved = true;
  }
  return report;
}
