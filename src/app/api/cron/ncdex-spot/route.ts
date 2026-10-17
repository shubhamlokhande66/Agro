import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { syncNcdexSpotPrices } from "@/lib/server/ncdexSpot";
import { syncNcdexSugar } from "@/lib/server/ncdexSugar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pulls NCDEX evening spot prices into the Domestic Prices dataset: Akola oilcake into Cotton
 * Seed Oil Cake and Cotton Seed (+12%), Rajkot kapas into Kapas (× 5, man → quintal). Called
 * every day at 5 PM IST by Vercel Cron (see vercel.json), which sends `Authorization: Bearer $CRON_SECRET`;
 * an admin session can also trigger it by hand.
 *   ?days=N  look-back window (default 7, max 31 — NCDEX keeps about a month)
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

  const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get("days")) || 7, 1), 31);
  try {
    const report = await syncNcdexSpotPrices({ days });
    // the sugar dashboard's NCDEX spot prices ride on the same evening run
    const sugar = await syncNcdexSugar({ days }).catch((e) => ({ error: e instanceof Error ? e.message : "failed" }));
    return NextResponse.json({ ok: true, ...report, sugar });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
