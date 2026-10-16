import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { getWeeklyBelt } from "@/lib/server/weeklyRain";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/weather/cotton-belt — this week's last-7-day rainfall and 7-day forecast per cotton state */
export async function GET() {
  if (!(await readSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snap = await getWeeklyBelt().catch(() => null);
  if (!snap) return NextResponse.json({ error: "Weather sources unavailable" }, { status: 502 });
  return NextResponse.json({ ...snap.data, fetchedAt: snap.fetchedAt }, { headers: { "cache-control": "no-store" } });
}
