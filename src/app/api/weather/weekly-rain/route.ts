import { NextResponse } from "next/server";
import { refreshAccess } from "@/lib/server/refreshGate";
import { refreshWeeklyRain } from "@/lib/server/weeklyRain";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/weather/weekly-rain — the Overview's Refresh button: fetch the IMD maps and cotton-state rain now */
export async function POST(req: Request) {
  const access = await refreshAccess(req, "weeklyRain");
  if (!access.allowed) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!access.fetch) return NextResponse.json({ saved: false, reason: "Refreshed a few minutes ago — showing the latest" });
  try {
    return NextResponse.json(await refreshWeeklyRain());
  } catch (err) {
    return NextResponse.json({ saved: false, reason: err instanceof Error ? err.message : "failed" }, { status: 502 });
  }
}
