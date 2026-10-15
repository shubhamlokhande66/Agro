import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { syncCftc } from "@/lib/server/cftc";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Refreshes the CFTC Commitments of Traders for ICE Cotton No. 2 from the CFTC API. Run by the
 * daily cron (the CFTC publishes on Fridays); admins can also trigger it from the page or admin.
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
    const report = await syncCftc();
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
