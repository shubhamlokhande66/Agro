import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { syncCotlook } from "@/lib/server/cotlook";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pulls the Cotlook A Index: today's value from Cotlook and the monthly history from the
 * World Bank. Run by the daily cron (src/app/api/cron/daily); an admin session can also trigger
 * it by hand (the admin "Sync" button).
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
    const report = await syncCotlook();
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
