import { getDataset, putDataset } from "@/lib/server/datasets";

/**
 * Chinimandi wholesale sugar prices (M-30 incl. GST, ₹/quintal; Hyderabad is S-30) for nine
 * cities — https://www.chinimandi.com/wholesale-sugar-prices/.
 * Only the page Chinimandi shows publicly is read (the latest ~30 trading days); older pages
 * are restricted on their site ("contact us for additional data"), so history builds up from
 * the daily sync, and older figures can be typed in by hand in Sugar Admin.
 */

export const WHOLESALE_CITIES = [
  { key: "delhi", label: "Delhi" },
  { key: "kanpur", label: "Kanpur" },
  { key: "raipur", label: "Raipur" },
  { key: "mumbai", label: "Mumbai" },
  { key: "ranchi", label: "Ranchi" },
  { key: "kolkata", label: "Kolkata" },
  { key: "guwahati", label: "Guwahati" },
  { key: "hyderabad", label: "Hyderabad (S-30)" },
  { key: "chennai", label: "Chennai" },
] as const;

const PAGE = "https://www.chinimandi.com/wholesale-sugar-prices/";
const AJAX = "https://www.chinimandi.com/wp-admin/admin-ajax.php";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const TABLE_ID = "6";
/** the first page, as the website itself loads it */
const PAGE_ROWS = 30;

type Row = { date: string } & Partial<Record<(typeof WHOLESALE_CITIES)[number]["key"], number | null>>;

const strip = (s: string) =>
  s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();

/** "16/10/2026" → "2026-10-16" */
const isoDate = (s: string) => {
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
};

export async function fetchChinimandiWholesale(): Promise<{ rows: Row[]; columns: string[] }> {
  const page = await fetch(PAGE, { headers: { "user-agent": UA }, cache: "no-store", signal: AbortSignal.timeout(30000) });
  if (!page.ok) throw new Error(`Chinimandi page returned ${page.status}`);
  const html = await page.text();
  const nonce = html.match(/DTGS_NONCE_FRONTEND\s*=\s*"([a-z0-9]+)"/i)?.[1];
  if (!nonce) throw new Error("Chinimandi page layout changed (no table token)");
  const head = html.match(/<table id="supsystic-table-6"[\s\S]*?<\/thead>/i)?.[0] ?? "";
  const columns = [...head.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => strip(m[1]));

  const body = new URLSearchParams({
    action: "supsystic-tables",
    "route[action]": "getPageRows",
    "route[module]": "tables",
    "route[nonce]": nonce,
    id: TABLE_ID,
    header: "1",
    footer: "0",
    searchValue: "",
    draw: "1",
    start: "0",
    length: String(PAGE_ROWS),
  });
  const res = await fetch(AJAX, {
    method: "POST",
    headers: { "user-agent": UA, referer: PAGE, "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "x-requested-with": "XMLHttpRequest" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Chinimandi data returned ${res.status}`);
  const json = (await res.json()) as { rows?: string };
  // map the site's column order onto our city keys (by name, so a reordered table still reads right)
  const keyOf = (label: string) => WHOLESALE_CITIES.find((c) => label.toLowerCase().startsWith(c.label.split(" ")[0].toLowerCase()))?.key;
  const colKeys = (columns.length ? columns : ["Date", ...WHOLESALE_CITIES.map((c) => c.label)]).map((c, i) => (i === 0 ? "date" : keyOf(c)));

  const rows: Row[] = [];
  for (const tr of (json.rows ?? "").match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cells = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => strip(m[1]));
    const date = isoDate(cells[0] ?? "");
    if (!date) continue;
    const row: Row = { date };
    cells.slice(1).forEach((v, i) => {
      const k = colKeys[i + 1];
      const n = Number(v.replace(/,/g, ""));
      if (k) (row as Record<string, unknown>)[k] = v !== "" && Number.isFinite(n) && n > 0 ? n : null;
    });
    rows.push(row);
  }
  if (!rows.length) throw new Error("No rows in Chinimandi's table");
  return { rows, columns };
}

/** fetch the public page and merge it into the sugarWholesale dataset (by date; hand-entered rows kept) */
export async function syncChinimandiWholesale(): Promise<{ saved: boolean; dates: { date: string; status: "added" | "updated" | "same" }[]; reason?: string }> {
  const { rows } = await fetchChinimandiWholesale();
  const cur = (await getDataset("sugarWholesale"))?.data as { rows?: Row[]; _sample?: boolean } | undefined;
  const byDate = new Map((cur?.rows ?? []).map((r) => [r.date, r]));
  const dates: { date: string; status: "added" | "updated" | "same" }[] = [];
  for (const r of rows) {
    const old = byDate.get(r.date);
    const status = !old ? "added" : JSON.stringify({ ...old, ...r }) === JSON.stringify(old) ? "same" : "updated";
    dates.push({ date: r.date, status });
    byDate.set(r.date, { ...old, ...r });
  }
  const changed = dates.some((d) => d.status !== "same") || !!cur?._sample;
  if (changed) {
    const merged = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
    await putDataset("sugarWholesale", { source: "Chinimandi · wholesale M-30 incl. GST, ₹/quintal (Hyderabad S-30)", rows: merged }, "chinimandi-sync", "sync");
  }
  return { saved: changed, dates, reason: changed ? undefined : "already up to date" };
}
