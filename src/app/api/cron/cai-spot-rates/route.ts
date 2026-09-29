import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { recentTradingDates, syncCaiSpotRates, todayIST } from "@/lib/server/caiSpotRates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pulls CAI daily spot rates into the Domestic Prices dataset. Called every evening by
 * Vercel Cron (see vercel.json), which sends `Authorization: Bearer $CRON_SECRET`;
 * an admin session can also trigger it by hand. Looks back over the last week so a
 * missed run or a late CAI publication is picked up on the next one.
 *   ?days=N  look-back window (default 7, max 60)
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

  const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get("days")) || 7, 1), 60);
  try {
    const report = await syncCaiSpotRates(recentTradingDates(todayIST(), days));
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
