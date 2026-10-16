import { readSession } from "@/lib/server/session";
import { getWeeklyMap } from "@/lib/server/weeklyRain";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/weather/imd-map?map=states — this week's stored IMD weekly rainfall map (IMD blocks hot-linking) */
export async function GET(req: Request) {
  if (!(await readSession())) return new Response("Unauthorized", { status: 401 });
  const key = new URL(req.url).searchParams.get("map") ?? "";
  const snap = await getWeeklyMap(key).catch(() => null);
  if (!snap) return new Response("IMD map unavailable", { status: 502 });
  return new Response(snap.bytes, {
    // the page asks with ?v=<snapshot time>, so a cached copy is never stale
    headers: { "content-type": snap.type, "cache-control": "private, max-age=86400" },
  });
}
