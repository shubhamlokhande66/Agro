import { NextResponse } from "next/server";
import { refreshAccess } from "@/lib/server/refreshGate";
import { getDataset } from "@/lib/server/datasets";
import { syncExportSales } from "@/lib/server/exportSales";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Refreshes USDA weekly export sales for US upland cotton from the FAS Open Data API. Run by the
 * daily cron (FAS publishes on Thursdays);
 * signed-in users can refresh it from the page (non-admins at most every 10 minutes, see refreshGate).
 */
export async function GET(req: Request) {
  const access = await refreshAccess(req, "exportSales");
  if (!access.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!access.fetch) {
    // refreshed moments ago — hand back what's stored rather than calling the source again
    const doc = await getDataset("exportSales");
    const stored = (doc?.data ?? {}) as { weeks?: { date: string }[]; years?: { weeks: { week: string }[] }[] };
    const latestWeek = stored.weeks?.at(-1)?.date ?? stored.years?.[0]?.weeks.at(-1)?.week ?? null;
    return NextResponse.json({ ok: true, dates: [], saved: false, latestWeek, recent: true });
  }
  try {
    const report = await syncExportSales();
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
