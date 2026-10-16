import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { syncRbiUsd } from "@/lib/server/rbiUsd";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pulls the RBI USD/INR reference rate into the Currency dataset. Called every
 * weekday afternoon by Vercel Cron (see vercel.json), after RBI publishes at
 * ~1:30pm IST; an admin can also trigger it from the admin editor. Re-reads the
 * last ~400 days each run, so the 1-year daily series and monthly averages rebuild.
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
    const report = await syncRbiUsd();
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
