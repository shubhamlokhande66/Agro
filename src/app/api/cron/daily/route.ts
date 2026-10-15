import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { recentTradingDates, syncCaiSpotRates, todayIST } from "@/lib/server/caiSpotRates";
import { syncIceFutures } from "@/lib/server/iceFutures";
import { syncRbiUsd } from "@/lib/server/rbiUsd";
import { syncCotlook } from "@/lib/server/cotlook";
import { syncUsdCny } from "@/lib/server/cnyUsd";
import { syncWasde } from "@/lib/server/wasde";
import { syncExportSales } from "@/lib/server/exportSales";
import { refreshImd } from "@/lib/server/monsoon/imd";
import { refreshEnso } from "@/lib/server/monsoon/enso";
import { refreshReports } from "@/lib/server/monsoon/reports";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The one daily job (Vercel Cron, 7:00 PM IST — see vercel.json): runs every outside-data
 * sync in turn — cotton dashboard: CAI domestic spot rates, ICE cotton + Brent futures,
 * RBI USD/INR, ECB USD/CNY, Cotlook A Index, USDA WASDE, USDA export sales; weather dashboard: IMD subdivision rainfall, NOAA ENSO/IOD, IMD press releases. Each
 * sync looks back several days, so anything published after a run is picked up by the next.
 * One failing source doesn't stop the others; the response reports each separately.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const bearerOk = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (!bearerOk) {
    const session = await readSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const jobs: Record<string, () => Promise<{ saved?: boolean; updated?: boolean; reason?: string }>> = {
    cai: () => syncCaiSpotRates(recentTradingDates(todayIST(), 7)),
    ice: () => syncIceFutures(),
    rbi: () => syncRbiUsd(),
    cny: () => syncUsdCny(),
    cotlook: () => syncCotlook(),
    wasde: () => syncWasde(),
    exportSales: () => syncExportSales(),
    imd: () => refreshImd(),
    enso: () => refreshEnso(),
    imdPress: () => refreshReports(),
  };
  const results: Record<string, { ok: boolean; saved?: boolean; note?: string; error?: string }> = {};
  for (const [name, run] of Object.entries(jobs)) {
    try {
      const r = await run();
      results[name] = { ok: true, saved: r.saved ?? r.updated, ...(r.reason ? { note: r.reason } : {}) };
    } catch (err) {
      results[name] = { ok: false, error: err instanceof Error ? err.message : "failed" };
    }
  }

  const ok = Object.values(results).every((r) => r.ok);
  return NextResponse.json({ ok, results }, { status: ok ? 200 : 500 });
}
