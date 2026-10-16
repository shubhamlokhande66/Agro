import { readSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * GET /api/monsoon/image?path=Rainfall/DISTRICT_RAINFALL_MAP_COUNTRY_INDIA_w.JPG
 * Relays IMD map / satellite images (IMD blocks hot-linking). Only paths under
 * mausam.imd.gov.in's Rainfall/ and Satellite/ folders are allowed — never an arbitrary URL.
 */
export async function GET(req: Request) {
  if (!(await readSession("weather"))) return new Response("Unauthorized", { status: 401 });

  const path = new URL(req.url).searchParams.get("path") ?? "";
  if (!/^(Rainfall|Satellite)\/[A-Za-z0-9_.-]+\.(jpe?g|png|gif)$/i.test(path)) {
    return new Response("Bad image path", { status: 400 });
  }
  try {
    const res = await fetch(`https://mausam.imd.gov.in/${path}`, {
      headers: { "user-agent": UA, accept: "image/*", referer: "https://mausam.imd.gov.in/" },
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return new Response(`IMD returned ${res.status}`, { status: 502 });
    return new Response(await res.arrayBuffer(), {
      headers: { "content-type": type, "cache-control": "private, max-age=1800" },
    });
  } catch {
    return new Response("IMD image unavailable", { status: 502 });
  }
}
