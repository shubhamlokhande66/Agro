import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { getDataset } from "@/lib/server/datasets";
import { isStale } from "@/lib/server/monsoon/cache";
import { getEnso, refreshEnso } from "@/lib/server/monsoon/enso";
import { PLANTING_SNAPSHOT } from "@/lib/server/monsoon/planting";
import {
  DEFAULT_HISTORY,
  DEFAULT_WEIGHTS,
  MONSOON_KEYS,
  toSubdivisions,
  type AlertsBlob,
  type HistoryBlob,
  type ImdBlob,
  type WeightsBlob,
} from "@/lib/monsoon/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;

/**
 * Everything the Weather dashboard shows, in one call (weather sign-in required): the
 * admin-editable datasets (IMD rainfall, weights, planting, history, alerts — defaults until
 * an admin saves them) plus ENSO/IOD from NOAA (refreshed here when a day old).
 */
export async function GET() {
  const session = await readSession("weather");
  if (!session) return NextResponse.json({ error: "Sign in to the weather dashboard" }, { status: 401 });

  let enso = await getEnso();
  if (isStale(enso, DAY)) {
    await refreshEnso().catch(() => {});
    enso = (await getEnso()) ?? enso;
  }
  const [imd, weights, planting, history, alerts] = await Promise.all(
    Object.values(MONSOON_KEYS).map((k) => getDataset(k).then((d) => d?.data ?? null)),
  );
  const imdBlob = imd as ImdBlob | null;

  return NextResponse.json({
    imd: imdBlob
      ? { subdivisions: toSubdivisions(imdBlob), source: imdBlob.source, asOfDate: imdBlob.asOfDate }
      : null,
    enso: enso ? { ...enso.data, asOfDate: enso.asOfDate, fetchedAt: enso.fetchedAt } : null,
    weights: (weights as WeightsBlob | null) ?? DEFAULT_WEIGHTS,
    planting: (planting as typeof PLANTING_SNAPSHOT | null) ?? PLANTING_SNAPSHOT,
    history: (history as HistoryBlob | null) ?? DEFAULT_HISTORY,
    alerts: (alerts as AlertsBlob | null) ?? { items: [] },
    isAdmin: session.role === "admin",
  });
}
