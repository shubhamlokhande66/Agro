import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { getEnso, refreshEnso } from "@/lib/server/monsoon/enso";
import { getCached, isStale } from "@/lib/server/monsoon/cache";
import { IMD_CACHE_KEY, type ImdPayload } from "@/lib/server/monsoon/imd";
import { PLANTING_SNAPSHOT } from "@/lib/server/monsoon/planting";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;

/**
 * Everything the Weather dashboard shows, in one call (weather sign-in required):
 * IMD subdivision departures (last good bulletin), ENSO/IOD (refreshed here when a day
 * old, otherwise by the daily cron) and the Kharif planting snapshot.
 */
export async function GET() {
  const session = await readSession("weather");
  if (!session) return NextResponse.json({ error: "Sign in to the weather dashboard" }, { status: 401 });

  let enso = await getEnso();
  if (isStale(enso, DAY)) {
    await refreshEnso().catch(() => {});
    enso = (await getEnso()) ?? enso;
  }
  const imd = await getCached<ImdPayload>(IMD_CACHE_KEY);

  return NextResponse.json({
    imd: imd
      ? { subdivisions: imd.data.subdivisions, source: imd.source, asOfDate: imd.asOfDate, fetchedAt: imd.fetchedAt }
      : null,
    enso: enso ? { ...enso.data, asOfDate: enso.asOfDate, fetchedAt: enso.fetchedAt } : null,
    planting: PLANTING_SNAPSHOT,
  });
}
