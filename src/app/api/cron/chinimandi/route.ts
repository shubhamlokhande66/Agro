import { NextResponse } from "next/server";
import { readAdmin } from "@/lib/server/session";
import { syncChinimandiWholesale } from "@/lib/server/chinimandi";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pulls Chinimandi's wholesale sugar prices (the latest days shown on their page) into the sugar
 * dashboard. Run by the daily job (Bearer CRON_SECRET) or from Sugar Admin's Sync button.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const bearerOk = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (!bearerOk && !(await readAdmin("sugar")) && !(await readAdmin("cotton"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await syncChinimandiWholesale()) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Chinimandi sync failed" }, { status: 502 });
  }
}
