import { readSession } from "@/lib/server/session";

/** last time each source was fetched on this server instance (non-admin refreshes are spaced out) */
const lastRun = new Map<string, number>();
const COOLDOWN_MS = 10 * 60000;

/**
 * Who may trigger a data refresh, and whether it should hit the outside source:
 *  - the daily cron (Bearer CRON_SECRET) and admins: always fetch
 *  - any other signed-in user: fetch at most once per 10 minutes per source, so a busy page can't
 *    exhaust the source's rate limits; in between they just get the stored data back
 *  - nobody else
 */
export async function refreshAccess(req: Request, source: string): Promise<{ allowed: false } | { allowed: true; fetch: boolean }> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`) return { allowed: true, fetch: true };
  const session = await readSession();
  if (!session) return { allowed: false };
  const now = Date.now();
  if (session.role !== "admin" && now - (lastRun.get(source) ?? 0) < COOLDOWN_MS) return { allowed: true, fetch: false };
  lastRun.set(source, now);
  return { allowed: true, fetch: true };
}
