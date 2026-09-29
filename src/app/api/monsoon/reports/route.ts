import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { isStale } from "@/lib/server/monsoon/cache";
import { getReports, refreshReports } from "@/lib/server/monsoon/reports";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** latest IMD press releases (weather sign-in required); refreshed when 6 h old */
export async function GET() {
  if (!(await readSession("weather"))) return NextResponse.json({ error: "Sign in to the weather dashboard" }, { status: 401 });
  let doc = await getReports();
  if (isStale(doc, 6 * 60 * 60 * 1000)) {
    await refreshReports().catch(() => {});
    doc = (await getReports()) ?? doc;
  }
  if (!doc) return NextResponse.json({ error: "IMD press releases unavailable right now" }, { status: 502 });
  return NextResponse.json({ items: doc.data, source: doc.source, fetchedAt: doc.fetchedAt });
}
