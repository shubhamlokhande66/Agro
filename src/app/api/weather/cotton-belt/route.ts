import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { fetchCottonBelt, type CottonBelt } from "@/lib/server/cottonBelt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** kept per server instance — the sources update a few times a day at most */
let cache: { at: number; data: CottonBelt } | null = null;
let pending: Promise<CottonBelt> | null = null;
const TTL_MS = 3 * 3600000;

/** GET /api/weather/cotton-belt — last-7-day rainfall and 7-day forecast per cotton state */
export async function GET() {
  if (!(await readSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!cache || Date.now() - cache.at > TTL_MS) {
    pending ??= fetchCottonBelt().finally(() => (pending = null));
    try {
      const data = await pending;
      if (data.states.some((s) => s.pastTotal != null || s.nextTotal != null)) cache = { at: Date.now(), data };
      else if (!cache) return NextResponse.json({ error: "Weather sources unavailable" }, { status: 502 });
    } catch {
      if (!cache) return NextResponse.json({ error: "Weather sources unavailable" }, { status: 502 });
    }
  }
  return NextResponse.json(cache!.data, { headers: { "cache-control": "private, max-age=1800" } });
}
