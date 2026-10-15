import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { syncNcdexSeedPrices } from "@/lib/server/ncdexSpot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pulls the NCDEX Akola evening oilcake price into Cotton Seed Oil Cake and Cotton Seed
 * (+12%). Called every day at 5 PM IST by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer $CRON_SECRET`; an admin session can also trigger it by hand.
 *   ?days=N  look-back window (default 7, max 30)
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

  const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get("days")) || 7, 1), 30);
  try {
    const report = await syncNcdexSeedPrices({ days });
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
