import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { syncIceFutures } from "@/lib/server/iceFutures";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pulls ICE Cotton No. 2 and ICE Brent daily settlements (most-active contracts)
 * into the International Prices dataset. Called each morning IST by Vercel Cron
 * (see vercel.json) after the previous session settles; an admin can also trigger
 * it from the admin editor. Re-reads ~3 months each run, so missed days catch up.
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
    const report = await syncIceFutures();
    const contract = Object.entries(report.products).map(([p, r]) => `${p} ${r.contract}`).join(", ");
    return NextResponse.json({ ok: true, contract, ...report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
