import { getDb } from "@/db";

/**
 * Last-known-good store for the Weather dashboard's outside data (IMD, NOAA, …) — the
 * MongoDB equivalent of the original app's `CachedData` table. Each key holds the latest
 * payload a live fetch produced; pages read from here so a failed fetch never blanks them.
 */

const COLLECTION = "monsoon_cache";

export type CacheDoc<T> = {
  _id: string;
  data: T;
  source: string;
  /** the date the data describes (e.g. the IMD bulletin period end), when known */
  asOfDate: string | null;
  fetchedAt: number; // epoch ms
};

export async function getCached<T>(key: string): Promise<CacheDoc<T> | null> {
  const db = await getDb();
  return db.collection<CacheDoc<T>>(COLLECTION).findOne({ _id: key });
}

export async function setCached<T>(key: string, data: T, source: string, asOfDate: string | null = null) {
  const db = await getDb();
  await db
    .collection<CacheDoc<T>>(COLLECTION)
    .updateOne({ _id: key }, { $set: { data, source, asOfDate, fetchedAt: Date.now() } }, { upsert: true });
}

/** older than `maxAgeMs`? (missing counts as stale) */
export const isStale = (doc: { fetchedAt: number } | null, maxAgeMs: number) =>
  !doc || Date.now() - doc.fetchedAt > maxAgeMs;
