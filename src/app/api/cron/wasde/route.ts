import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { syncWasde } from "@/lib/server/wasde";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Adds any new USDA WASDE reports (world cotton supply & use) to the WASDE dataset. Run by the
 * daily cron, so a report released on the ~9th–12th is in by the next run; an admin can also
 * trigger it from the admin editor.
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
    const report = await syncWasde();
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
