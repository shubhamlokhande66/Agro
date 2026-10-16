import { readSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** the IMD weekly rainfall maps the Overview shows — a fixed list, never an arbitrary path */
const MAPS: Record<string, string> = {
  states: "Rainfall/STATE_RAINFALL_MAP_COUNTRY_INDIA_w.JPG",
  india: "Rainfall/DISTRICT_RAINFALL_MAP_COUNTRY_INDIA_w.JPG",
  central: "Rainfall/DISTRICT_RAINFALL_MAP_REGION_CODE_CENTRAL_INDIA_w.jpg",
  northwest: "Rainfall/DISTRICT_RAINFALL_MAP_REGION_CODE_NORTH_WEST_INDIA_w.jpg",
  south: "Rainfall/DISTRICT_RAINFALL_MAP_REGION_CODE_SOUTH_PENINSULA_w.jpg",
};

/** GET /api/weather/imd-map?map=india — relays an IMD weekly district rainfall map (IMD blocks hot-linking) */
export async function GET(req: Request) {
  if (!(await readSession())) return new Response("Unauthorized", { status: 401 });
  const path = MAPS[new URL(req.url).searchParams.get("map") ?? ""];
  if (!path) return new Response("Unknown map", { status: 400 });
  try {
    const res = await fetch(`https://mausam.imd.gov.in/${path}`, {
      headers: { "user-agent": UA, accept: "image/*", referer: "https://mausam.imd.gov.in/" },
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return new Response(`IMD returned ${res.status}`, { status: 502 });
    return new Response(await res.arrayBuffer(), {
      headers: { "content-type": type, "cache-control": "private, max-age=3600" },
    });
  } catch {
    return new Response("IMD map unavailable", { status: 502 });
  }
}
