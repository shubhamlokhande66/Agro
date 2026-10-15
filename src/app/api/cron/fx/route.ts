import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { syncRbiUsd } from "@/lib/server/rbiUsd";
import { syncUsdCny } from "@/lib/server/cnyUsd";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Syncs both currency pairs into the Currency dataset — USD/INR from RBI, then USD/CNY from the
 * ECB (Frankfurter) — one after the other, since both rewrite the same dataset. Used by the
 * admin editor's Sync button; the daily cron runs the two syncs as separate jobs.
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

  const errors: string[] = [];
  const inr = await syncRbiUsd({ by: "admin:fx" }).catch((e) => (errors.push(`USD/INR: ${e instanceof Error ? e.message : e}`), null));
  const cny = await syncUsdCny({ by: "admin:fx" }).catch((e) => (errors.push(`USD/CNY: ${e instanceof Error ? e.message : e}`), null));
  if (!inr && !cny) return NextResponse.json({ ok: false, error: errors.join("; ") }, { status: 500 });
  return NextResponse.json({
    ok: true,
    dates: [...(inr?.dates ?? []), ...(cny?.dates ?? [])],
    saved: !!(inr?.saved || cny?.saved),
    usdinr: inr?.latest ?? null,
    usdcny: cny?.latest ?? null,
    errors,
  });
}
