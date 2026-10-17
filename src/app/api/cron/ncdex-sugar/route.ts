import { NextResponse } from "next/server";
import { readAdmin } from "@/lib/server/session";
import { syncNcdexSugar } from "@/lib/server/ncdexSugar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * NCDEX spot sugar (Kolhapur) and gur (Muzaffarnagar) into the sugar dashboard. Runs with the
 * 5 PM NCDEX job (see /api/cron/ncdex-spot) and from Sugar Admin's Sync button.
 *   ?days=N  look-back (default 7, max 31 — NCDEX keeps about a month)
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const bearerOk = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (!bearerOk && !(await readAdmin("sugar")) && !(await readAdmin("cotton"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get("days")) || 7, 1), 31);
  try {
    return NextResponse.json({ ok: true, ...(await syncNcdexSugar({ days })) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "NCDEX sync failed" }, { status: 502 });
  }
}
