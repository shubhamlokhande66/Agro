import { inflateSync } from "node:zlib";
import { IMD_SUBDIVISIONS, LPA_NORMALS, SUBDIVISION_ZONES, type Subdivision } from "@/lib/monsoon/constants";
import { getDataset, putDataset } from "@/lib/server/datasets";
import { MONSOON_KEYS, type ImdBlob } from "@/lib/monsoon/config";

/**
 * IMD subdivision rainfall departures — from the official Hydromet cumulative bulletin
 * (the same PDF the original app used). The original sent the PDF to an LLM; this reads the
 * PDF's own text layer instead (IMD generates it with jsPDF, so every cell is positioned
 * text): no API key, deterministic, and it refuses to update unless ≥30 subdivisions parse.
 */

export const IMD_PDF_URL =
  "https://mausam.imd.gov.in/Rainfall/SUBDIVISION_RAINFALL_DEPARTURECUMULATIVE_COUNTRY_INDIA_c.pdf";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
export const IMD_SOURCE = "IMD Hydromet Division — mausam.imd.gov.in (Subdivision Cumulative Departures bulletin)";

/* ── name matching: PDF labels → canonical subdivision names ── */

/** compare names ignoring case, spacing, punctuation and "&"/"AND" (PDF cells wrap mid-word) */
const squash = (s: string) => s.toUpperCase().replace(/\bAND\b/g, "").replace(/[^A-Z0-9]/g, "");

const ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries({
    ODISHA: "Orissa",
    "SAURASHTRA AND KUTCH": "Saurashtra-Kutch",
    NMMT: "Nagaland-Manipur-Mizoram-Tripura",
    "NAGALAND MANIPUR MIZORAM TRIPURA": "Nagaland-Manipur-Mizoram-Tripura",
    "SHWB & SIKKIM": "Sub-Himalayan West Bengal & Sikkim",
    "SUB HIMALAYAN WEST BENGAL & SIKKIM": "Sub-Himalayan West Bengal & Sikkim",
    "DELHI AND HARYANA AND CHANDIGARH": "Haryana-Chandigarh-Delhi",
    "HARYANA CHANDIGARH & DELHI": "Haryana-Chandigarh-Delhi",
    "HARYANA DELHI & CHANDIGARH": "Haryana-Chandigarh-Delhi",
    "JAMMU & KASHMIR AND LADAKH": "Jammu & Kashmir",
    "KERALA & MAHE": "Kerala",
    "NORTHERN INTERIOR KARNATAKA": "North Interior Karnataka",
    "SOUTHERN INTERIOR KARNATAKA": "South Interior Karnataka",
    "TAMILNADU & PUDUCHERRY & KARAIKAL": "Tamil Nadu & Pondicherry",
    "TAMIL NADU & PUDUCHERRY & KARAIKAL": "Tamil Nadu & Pondicherry",
    "TAMIL NADU": "Tamil Nadu & Pondicherry",
    "COASTAL ANDHRA PRADESH & YANAM": "Coastal Andhra Pradesh",
    "ANDAMAN AND NICOBAR ISLANDS": "Andaman & Nicobar Islands",
  }).map(([k, v]) => [squash(k), v]),
);

export function canonicalName(pdfName: string): string | null {
  const k = squash(pdfName);
  if (!k) return null;
  if (ALIASES[k]) return ALIASES[k];
  return IMD_SUBDIVISIONS.find((c) => squash(c) === k) ?? null;
}

/* ── minimal PDF text-layer reader (jsPDF output: BT … x y Td (text) Tj … ET) ── */

type TextItem = { x: number; y: number; text: string };

const unescapePdf = (s: string) =>
  s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, c: string) =>
    /^[0-7]+$/.test(c) ? String.fromCharCode(parseInt(c, 8)) : ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" } as Record<string, string>)[c] ?? c,
  );

function contentStreams(buf: Buffer): string[] {
  const s = buf.toString("latin1");
  const out: string[] = [];
  const re = /<<((?:[^<>]|<<[^<>]*>>)*)>>\s*stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const start = m.index + m[0].length;
    const end = s.indexOf("endstream", start);
    if (end < 0) break;
    const dict = m[1];
    if (/\/Subtype\s*\/Image|\/FontFile/.test(dict)) continue;
    const raw = buf.subarray(start, end);
    if (/FlateDecode/.test(dict)) {
      try {
        out.push(inflateSync(raw).toString("latin1"));
      } catch {
        /* not a content stream we can read */
      }
    } else out.push(raw.toString("latin1"));
  }
  return out;
}

export function pdfTextItems(buf: Buffer): TextItem[] {
  const items: TextItem[] = [];
  const op = /(-?[\d.]+)\s+(-?[\d.]+)\s+Td|(?:-?[\d.]+\s+){4}(-?[\d.]+)\s+(-?[\d.]+)\s+Tm|\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
  for (const stream of contentStreams(buf)) {
    let x = 0;
    let y = 0;
    let m: RegExpExecArray | null;
    while ((m = op.exec(stream))) {
      if (m[1] != null) {
        x = parseFloat(m[1]);
        y = parseFloat(m[2]);
      } else if (m[3] != null) {
        x = parseFloat(m[3]);
        y = parseFloat(m[4]);
      } else {
        const text = unescapePdf(m[5]).trim();
        if (text) items.push({ x, y, text });
      }
    }
  }
  return items;
}

/** rebuild {name, latest cumulative departure} rows from the bulletin's text layer */
export function parseImdBulletin(buf: Buffer): { rows: Subdivision[]; asOfDate: string | null } {
  const items = pdfTextItems(buf);

  const period = items.map((i) => i.text.match(/To\s+(\d{2})-(\d{2})-(\d{4})/)).find(Boolean);
  const asOfDate = period ? `${period[3]}-${period[2]}-${period[1]}` : null;

  // header: the weekly date columns ("03-06-202" + wrapped "6"), and the "Subdivisio(n)" column
  const dateCols = items.filter((i) => /^\d{2}-\d{2}-\d{3,4}$/.test(i.text));
  const nameHead = items.find((i) => /^subdivisio/i.test(i.text));
  if (!dateCols.length || !nameHead) return { rows: [], asOfDate };
  const headerY = Math.min(...dateCols.map((i) => i.y));
  const lastX = Math.max(...dateCols.map((i) => i.x));
  const firstX = Math.min(...dateCols.map((i) => i.x));
  const colW = dateCols.length > 1 ? (lastX - firstX) / (new Set(dateCols.map((i) => Math.round(i.x))).size - 1) : 40;

  const body = items.filter((i) => i.y < headerY - 6);
  // the latest cumulative value of each row sits in the rightmost date column
  const values = body
    .filter((i) => Math.abs(i.x - lastX) < colW * 0.6 && /^-?\d+(\.\d+)?%?$/.test(i.text))
    .map((i) => ({ y: i.y, dep: parseFloat(i.text) }));
  const nameParts = body.filter((i) => i.x >= nameHead.x - 8 && i.x < firstX - 4 && /[A-Za-z]/.test(i.text));

  // a wrapped name's lines sit around its row's value line — attach each to the nearest value
  const byRow = new Map<number, TextItem[]>();
  for (const part of nameParts) {
    let best = -1;
    let bestD = Infinity;
    values.forEach((v, i) => {
      const d = Math.abs(v.y - part.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0 && bestD < 16) byRow.set(best, [...(byRow.get(best) ?? []), part]);
  }

  const rows: Subdivision[] = [];
  const seen = new Set<string>();
  values.forEach((v, i) => {
    const label = (byRow.get(i) ?? []).sort((a, b) => b.y - a.y).map((p) => p.text).join(" ");
    const name = canonicalName(label);
    if (!name || seen.has(name) || !Number.isFinite(v.dep)) return;
    seen.add(name);
    const normal = LPA_NORMALS[name] ?? 800;
    rows.push({
      name,
      zone: SUBDIVISION_ZONES[name] ?? "Unknown",
      normalRainfall: normal,
      actualRainfall: Math.round(normal * (1 + v.dep / 100)),
      departure: Math.round(v.dep),
    });
  });
  return { rows, asOfDate };
}

export type ImdRefresh = { updated: boolean; rows: number; asOfDate: string | null; reason?: string };

/** fetch + parse the live bulletin into the admin-editable `monsoonImd` dataset — only when it
 *  is complete enough to trust and not older than what is stored */
export async function refreshImd(): Promise<ImdRefresh> {
  const res = await fetch(IMD_PDF_URL, {
    headers: { "user-agent": UA, accept: "application/pdf,*/*" },
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) return { updated: false, rows: 0, asOfDate: null, reason: `HTTP ${res.status}` };
  const { rows, asOfDate } = parseImdBulletin(Buffer.from(await res.arrayBuffer()));
  if (rows.length < 30) {
    return { updated: false, rows: rows.length, asOfDate, reason: "bulletin has no complete subdivision table — kept last good data" };
  }
  const prev = (await getDataset(MONSOON_KEYS.imd))?.data as ImdBlob | undefined;
  if (prev?.asOfDate && asOfDate && asOfDate <= prev.asOfDate) {
    return { updated: false, rows: rows.length, asOfDate, reason: "no newer bulletin than the stored data" };
  }
  const blob: ImdBlob = {
    asOfDate,
    source: IMD_SOURCE,
    subdivisions: rows.map(({ name, zone, normalRainfall, departure }) => ({ name, zone, normalRainfall, departure })),
  };
  await putDataset(MONSOON_KEYS.imd, blob, "cron:imd", "imd-bulletin");
  return { updated: true, rows: rows.length, asOfDate };
}
