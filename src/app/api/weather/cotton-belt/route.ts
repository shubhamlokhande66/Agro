import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { getMapDates, getWeeklyBelt } from "@/lib/server/weeklyRain";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/weather/cotton-belt — this week's last-7-day rainfall and 7-day forecast per cotton state */
export async function GET() {
  if (!(await readSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snap = await getWeeklyBelt().catch(() => null);
  if (!snap) return NextResponse.json({ error: "Weather sources unavailable" }, { status: 502 });
  // when IMD last updated each map, so the card can skip maps IMD has stopped updating
  const mapDates = await getMapDates().catch(() => ({}));
  return NextResponse.json({ ...snap.data, fetchedAt: snap.fetchedAt, mapDates }, { headers: { "cache-control": "no-store" } });
}
