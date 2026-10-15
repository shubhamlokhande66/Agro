import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { syncCottonTrade } from "@/lib/server/tradestat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pulls newly published monthly raw-cotton imports and exports (HS 5201) from the Commerce
 * Ministry's TradeStat into the Import & Export dataset. Run by the daily cron; an admin can also
 * trigger it from the admin editor. Only months after the last actual month are written.
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
  try {
    const report = await syncCottonTrade();
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
