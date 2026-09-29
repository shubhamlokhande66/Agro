import { getCached, setCached } from "./cache";

/**
 * ENSO / IOD indices from NOAA (public text files, no key):
 *  - Niño 3.4 monthly anomaly history — CPC ERSSTv5 (1991–2020 base)
 *  - latest Niño 3.4 anomaly — CPC OISST monthly indices (updates sooner than ERSST)
 *  - IOD / Dipole Mode Index — PSL HadISST
 */

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";
export const ENSO_CACHE_KEY = "enso";

export type MonthValue = { year: number; month: number; value: number };
export type EnsoPayload = {
  nino: { monthly: MonthValue[]; latest: MonthValue | null; source: string };
  iod: { monthly: MonthValue[]; latest: MonthValue | null; source: string };
};

async function text(url: string) {
  const res = await fetch(url, { headers: { "user-agent": UA }, cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

/** "YR MON … NINO3.4 ANOM" tables — the Niño 3.4 anomaly is the last column */
function parseNinoTable(body: string): MonthValue[] {
  const out: MonthValue[] = [];
  for (const line of body.split("\n")) {
    const p = line.trim().split(/\s+/);
    if (p.length < 10 || !/^\d{4}$/.test(p[0])) continue;
    const value = parseFloat(p[p.length - 1]);
    const month = parseInt(p[1], 10);
    if (Number.isFinite(value) && Math.abs(value) < 20 && month >= 1 && month <= 12) {
      out.push({ year: parseInt(p[0], 10), month, value });
    }
  }
  return out;
}

/** PSL "year v1 … v12" rows; −9999 marks missing months */
function parseYearRows(body: string): MonthValue[] {
  const out: MonthValue[] = [];
  for (const line of body.split("\n")) {
    const p = line.trim().split(/\s+/);
    if (p.length !== 13 || !/^\d{4}$/.test(p[0])) continue;
    for (let m = 1; m <= 12; m++) {
      const v = parseFloat(p[m]);
      if (Number.isFinite(v) && Math.abs(v) < 90) out.push({ year: parseInt(p[0], 10), month: m, value: v });
    }
  }
  return out;
}

export async function fetchEnso(): Promise<EnsoPayload> {
  const [ersst, oisst, dmi] = await Promise.all([
    text("https://www.cpc.ncep.noaa.gov/data/indices/ersst5.nino.mth.91-20.ascii"),
    text("https://www.cpc.ncep.noaa.gov/data/indices/sstoi.indices").catch(() => ""),
    text("https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data"),
  ]);
  const ninoMonthly = parseNinoTable(ersst);
  const oi = parseNinoTable(oisst).at(-1) ?? null;
  const er = ninoMonthly.at(-1) ?? null;
  // prefer whichever is more recent (OISST usually leads ERSST by a month)
  const newer = (a: MonthValue | null, b: MonthValue | null) =>
    !a ? b : !b ? a : a.year * 12 + a.month >= b.year * 12 + b.month ? a : b;
  const latest = newer(oi, er);
  const iodMonthly = parseYearRows(dmi);
  if (!ninoMonthly.length || !iodMonthly.length) throw new Error("NOAA returned no ENSO/IOD data");
  return {
    nino: {
      monthly: ninoMonthly,
      latest,
      source: latest === oi ? "NOAA CPC OISST (Niño 3.4)" : "NOAA CPC ERSSTv5 (Niño 3.4)",
    },
    iod: { monthly: iodMonthly, latest: iodMonthly.at(-1) ?? null, source: "NOAA PSL HadISST DMI" },
  };
}

export async function refreshEnso() {
  const data = await fetchEnso();
  const l = data.nino.latest;
  await setCached(ENSO_CACHE_KEY, data, `${data.nino.source} · ${data.iod.source}`, l ? `${l.year}-${String(l.month).padStart(2, "0")}` : null);
  return { updated: true, nino: l, iod: data.iod.latest };
}

export const getEnso = () => getCached<EnsoPayload>(ENSO_CACHE_KEY);
