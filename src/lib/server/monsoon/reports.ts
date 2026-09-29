import { getCached, setCached } from "./cache";

/**
 * IMD press releases (warnings, monsoon updates) from IMD's official press-release list.
 * The original app had an LLM paraphrase IMD's site — and invent "general" alerts when it
 * couldn't reach it. This lists IMD's own releases verbatim, each linking to its PDF.
 */

const LIST_URL = "https://internal.imd.gov.in/pages/press_release_mausam.php";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
export const REPORTS_CACHE_KEY = "imd_press_releases";

export type PressRelease = { no: string; date: string; title: string; url: string; severity: "Alert" | "Warning" | "Watch" | "Normal" };

const clean = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/** severity from IMD's own wording */
function severityOf(title: string): PressRelease["severity"] {
  const t = title.toUpperCase();
  if (/EXTREMELY HEAVY|CYCLONIC STORM|SEVERE CYCLONE|RED ALERT/.test(t)) return "Alert";
  if (/VERY HEAVY|HEAVY RAIN|HEAVY TO|THUNDERSTORM|HEAT ?WAVE|COLD WAVE|FLOOD/.test(t)) return "Warning";
  if (/DEPRESSION|LOW PRESSURE|CYCLONE|MONSOON/.test(t)) return "Watch";
  return "Normal";
}

export async function fetchPressReleases(limit = 30): Promise<PressRelease[]> {
  const res = await fetch(LIST_URL, { headers: { "user-agent": UA }, cache: "no-store", signal: AbortSignal.timeout(45000) });
  if (!res.ok) throw new Error(`IMD press releases: HTTP ${res.status}`);
  const html = await res.text();
  const out: PressRelease[] = [];
  for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const href = row.match(/href=["']([^"']+\.pdf)["']/i)?.[1];
    if (!href) continue;
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => clean(c[1]));
    const [, no, date, title] = cells;
    // IMD publishes each release twice — keep the English one
    if (!title || /[^\x00-\x7F‘-”–—]/.test(title)) continue;
    out.push({ no, date, title, url: new URL(href, LIST_URL).toString(), severity: severityOf(title) });
    if (out.length >= limit) break;
  }
  if (!out.length) throw new Error("IMD press release list had no entries");
  return out;
}

export async function refreshReports() {
  const items = await fetchPressReleases();
  await setCached(REPORTS_CACHE_KEY, items, "IMD press releases — internal.imd.gov.in", items[0]?.date ?? null);
  return { updated: true, count: items.length, latest: items[0]?.date };
}

export const getReports = () => getCached<PressRelease[]>(REPORTS_CACHE_KEY);
