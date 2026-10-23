import { Binary } from "mongodb";
import { getDb, COLLECTIONS } from "@/db";
import { fetchCottonBelt, type CottonBelt } from "@/lib/server/cottonBelt";

/**
 * The Overview's weekly rain snapshot — IMD's weekly rainfall maps and the cotton-state rain
 * table — stored once a week so everyone sees the same Friday picture. Renewed every Friday
 * (the daily job, and the first visit after Friday 10:00 IST as a fallback) or on demand with
 * the cards' Refresh button.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** the IMD weekly rainfall maps the Overview shows — a fixed list, never an arbitrary path */
export const IMD_MAPS: Record<string, string> = {
  states: "Rainfall/STATE_RAINFALL_MAP_COUNTRY_INDIA_w.JPG",
  india: "Rainfall/DISTRICT_RAINFALL_MAP_COUNTRY_INDIA_w.JPG",
  central: "Rainfall/DISTRICT_RAINFALL_MAP_REGION_CODE_CENTRAL_INDIA_w.jpg",
  northwest: "Rainfall/DISTRICT_RAINFALL_MAP_REGION_CODE_NORTH_WEST_INDIA_w.jpg",
  south: "Rainfall/DISTRICT_RAINFALL_MAP_REGION_CODE_SOUTH_PENINSULA_w.jpg",
};

type BeltDoc = { _id: "belt"; fetchedAt: number; data: CottonBelt };
/** imdModified: when IMD last changed the map file (its Last-Modified header) — IMD stops
 *  updating some maps out of season (the state-wise weekly map stopped on 23 Sep 2026) */
type MapDoc = { _id: string; fetchedAt: number; type: string; data: Binary; imdModified?: number | null };

const coll = async <T extends { _id: string }>() => (await getDb()).collection<T>(COLLECTIONS.weeklyRain);

/** the latest Friday 10:00 IST at or before `now` — the weekly snapshot should be newer than this */
export function lastFridayCutoff(now = Date.now()): number {
  const IST = 5.5 * 3600000;
  const ist = new Date(now + IST);
  const daysBack = (ist.getUTCDay() - 5 + 7) % 7;
  let cutoff = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - daysBack, 10) - IST;
  if (cutoff > now) cutoff -= 7 * 86400000;
  return cutoff;
}

export const isFridayIST = (now = Date.now()) => new Date(now + 5.5 * 3600000).getUTCDay() === 5;

async function fetchMap(path: string): Promise<{ type: string; bytes: Buffer; modified: number | null } | null> {
  try {
    const res = await fetch(`https://mausam.imd.gov.in/${path}`, {
      headers: { "user-agent": UA, accept: "image/*", referer: "https://mausam.imd.gov.in/" },
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return null;
    const lm = Date.parse(res.headers.get("last-modified") ?? "");
    return { type, bytes: Buffer.from(await res.arrayBuffer()), modified: Number.isFinite(lm) ? lm : null };
  } catch {
    return null;
  }
}

/** fetches everything fresh and stores whatever came back (a source that fails keeps last week's) */
export async function refreshWeeklyRain(): Promise<{ saved: boolean; reason?: string }> {
  const now = Date.now();
  const [belt, maps] = await Promise.all([
    fetchCottonBelt().catch(() => null),
    Promise.all(Object.entries(IMD_MAPS).map(async ([key, path]) => [key, await fetchMap(path)] as const)),
  ]);
  const c = await coll<BeltDoc | MapDoc>();
  let n = 0;
  if (belt && belt.states.some((s) => s.pastTotal != null || s.nextTotal != null)) {
    await c.replaceOne({ _id: "belt" }, { _id: "belt", fetchedAt: now, data: belt } as BeltDoc, { upsert: true });
    n++;
  }
  for (const [key, m] of maps) {
    if (!m) continue;
    await c.replaceOne({ _id: `map:${key}` }, { _id: `map:${key}`, fetchedAt: now, type: m.type, data: new Binary(m.bytes), imdModified: m.modified } as MapDoc, { upsert: true });
    n++;
  }
  const total = 1 + Object.keys(IMD_MAPS).length;
  return n ? { saved: true, reason: n < total ? `${total - n} of ${total} sources unavailable — kept last week's` : undefined } : { saved: false, reason: "all sources unavailable" };
}

let pending: Promise<unknown> | null = null;
/** renew the snapshot when it predates this week's Friday cutoff (one renewal at a time per instance) */
async function ensureFresh(fetchedAt: number | undefined) {
  if (fetchedAt != null && fetchedAt >= lastFridayCutoff()) return;
  pending ??= refreshWeeklyRain().finally(() => (pending = null));
  await pending.catch(() => {});
}

export async function getWeeklyBelt(): Promise<{ fetchedAt: number; data: CottonBelt } | null> {
  const c = await coll<BeltDoc>();
  let doc = await c.findOne({ _id: "belt" });
  if (!doc || doc.fetchedAt < lastFridayCutoff()) {
    await ensureFresh(doc?.fetchedAt);
    doc = await c.findOne({ _id: "belt" });
  }
  return doc ? { fetchedAt: doc.fetchedAt, data: doc.data } : null;
}

/** when IMD last updated each stored map (null where unknown) */
export async function getMapDates(): Promise<Record<string, number | null>> {
  const docs = await (await coll<MapDoc>()).find({ _id: { $regex: /^map:/ } } as never, { projection: { data: 0 } }).toArray();
  return Object.fromEntries(docs.map((d) => [d._id.slice(4), d.imdModified ?? null]));
}

export async function getWeeklyMap(key: string): Promise<{ fetchedAt: number; type: string; bytes: Uint8Array } | null> {
  if (!IMD_MAPS[key]) return null;
  const c = await coll<MapDoc>();
  let doc = await c.findOne({ _id: `map:${key}` });
  if (!doc || doc.fetchedAt < lastFridayCutoff()) {
    await ensureFresh(doc?.fetchedAt);
    doc = await c.findOne({ _id: `map:${key}` });
  }
  return doc ? { fetchedAt: doc.fetchedAt, type: doc.type, bytes: doc.data.buffer } : null;
}
