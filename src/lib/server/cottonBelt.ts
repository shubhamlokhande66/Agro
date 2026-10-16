/**
 * Rainfall over India's cotton belt, state by state:
 *  - last 7 days: NASA POWER daily precipitation (PRECTOTCORR, mm/day; public domain). POWER runs
 *    ~2–3 days behind, so "last 7 days" is the latest 7 days it has published.
 *  - next 7 days: MET Norway locationforecast (free, needs an identifying User-Agent).
 * Each state is the average of a few cotton districts' points.
 */

export const COTTON_POINTS: { state: string; places: { name: string; lat: number; lon: number }[] }[] = [
  { state: "Gujarat", places: [{ name: "Rajkot", lat: 22.3, lon: 70.8 }, { name: "Amreli", lat: 21.6, lon: 71.22 }, { name: "Surendranagar", lat: 22.73, lon: 71.64 }] },
  { state: "Maharashtra", places: [{ name: "Yavatmal", lat: 20.39, lon: 78.12 }, { name: "Akola", lat: 20.7, lon: 77.0 }, { name: "Jalna", lat: 19.84, lon: 75.88 }, { name: "Jalgaon", lat: 21.0, lon: 75.56 }] },
  { state: "Telangana", places: [{ name: "Adilabad", lat: 19.67, lon: 78.53 }, { name: "Warangal", lat: 17.97, lon: 79.59 }, { name: "Nalgonda", lat: 17.05, lon: 79.27 }] },
  { state: "Madhya Pradesh", places: [{ name: "Khargone", lat: 21.82, lon: 75.61 }, { name: "Dhar", lat: 22.6, lon: 75.3 }] },
  { state: "Karnataka", places: [{ name: "Raichur", lat: 16.2, lon: 77.36 }, { name: "Dharwad", lat: 15.46, lon: 75.01 }] },
  { state: "Andhra Pradesh", places: [{ name: "Guntur", lat: 16.31, lon: 80.44 }, { name: "Kurnool", lat: 15.83, lon: 78.04 }] },
  { state: "Rajasthan", places: [{ name: "Sri Ganganagar", lat: 29.91, lon: 73.88 }, { name: "Hanumangarh", lat: 29.58, lon: 74.33 }] },
  { state: "Haryana", places: [{ name: "Sirsa", lat: 29.53, lon: 75.03 }, { name: "Hisar", lat: 29.15, lon: 75.72 }] },
  { state: "Punjab", places: [{ name: "Bathinda", lat: 30.21, lon: 74.95 }, { name: "Mansa", lat: 29.98, lon: 75.39 }] },
];

export type BeltState = {
  state: string;
  places: string[];
  /** mm per day over pastDays / forecastDays (state average), null where no point had data */
  past: (number | null)[];
  next: (number | null)[];
  pastTotal: number | null;
  nextTotal: number | null;
};
export type CottonBelt = { fetchedAt: number; pastDays: string[]; forecastDays: string[]; states: BeltState[] };

const UA = "AgrolytixCottonDashboard/1.0 (research dashboard; contact via agrolytix)";
const ymd = (d: Date) => d.toISOString().slice(0, 10);
/** IST calendar date of a UTC instant */
const istDate = (ms: number) => ymd(new Date(ms + 5.5 * 3600000));

async function pastRain(lat: number, lon: number, start: string, end: string): Promise<Record<string, number>> {
  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR&community=AG` +
    `&latitude=${lat}&longitude=${lon}&start=${start.replace(/-/g, "")}&end=${end.replace(/-/g, "")}&format=JSON`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`NASA POWER ${res.status}`);
  const j = await res.json();
  const raw: Record<string, number> = j?.properties?.parameter?.PRECTOTCORR ?? {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v === "number" && v > -900) out[`${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`] = v;
  return out;
}

async function forecastRain(lat: number, lon: number): Promise<Record<string, number>> {
  const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`, {
    headers: { "user-agent": UA },
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`MET Norway ${res.status}`);
  const j = await res.json();
  const out: Record<string, number> = {};
  // hourly steps first, then 6-hourly — count each hour once
  let coveredUntil = 0;
  for (const t of j?.properties?.timeseries ?? []) {
    const at = Date.parse(t.time);
    if (at < coveredUntil) continue;
    const h1 = t.data?.next_1_hours?.details?.precipitation_amount;
    const h6 = t.data?.next_6_hours?.details?.precipitation_amount;
    const [mm, hours] = typeof h1 === "number" ? [h1, 1] : typeof h6 === "number" ? [h6, 6] : [null, 0];
    if (mm == null) continue;
    const d = istDate(at);
    out[d] = (out[d] ?? 0) + mm;
    coveredUntil = at + hours * 3600000;
  }
  return out;
}

const mean = (xs: (number | undefined)[]) => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const round1 = (v: number | null) => (v == null ? null : Math.round(v * 10) / 10);
const sum = (xs: (number | null)[]) => (xs.some((x) => x != null) ? round1(xs.reduce<number>((a, b) => a + (b ?? 0), 0)) : null);

export async function fetchCottonBelt(): Promise<CottonBelt> {
  const now = Date.now();
  const today = istDate(now);
  const day = (offset: number) => ymd(new Date(Date.parse(today) + offset * 86400000));
  const points = COTTON_POINTS.flatMap((s) => s.places.map((p) => ({ ...p, state: s.state })));

  const results = await Promise.all(
    points.map(async (p) => {
      const [past, next] = await Promise.all([
        pastRain(p.lat, p.lon, day(-12), day(0)).catch(() => ({}) as Record<string, number>),
        forecastRain(p.lat, p.lon).catch(() => ({}) as Record<string, number>),
      ]);
      return { ...p, past, next };
    }),
  );

  // the latest 7 days POWER has published for most points
  const published = Array.from({ length: 13 }, (_, i) => day(-12 + i)).filter(
    (d) => results.filter((r) => r.past[d] != null).length >= points.length / 2,
  );
  const pastDays = published.slice(-7);
  // tomorrow onwards: today is already partly gone
  const forecastDays = Array.from({ length: 7 }, (_, i) => day(i + 1));

  const states = COTTON_POINTS.map<BeltState>((s) => {
    const rs = results.filter((r) => r.state === s.state);
    const past = pastDays.map((d) => round1(mean(rs.map((r) => r.past[d]))));
    const next = forecastDays.map((d) => round1(mean(rs.map((r) => r.next[d]))));
    return { state: s.state, places: s.places.map((p) => p.name), past, next, pastTotal: sum(past), nextTotal: sum(next) };
  });
  return { fetchedAt: now, pastDays, forecastDays, states };
}
