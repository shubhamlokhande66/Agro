import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { syncExportSales } from "@/lib/server/exportSales";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Refreshes USDA weekly export sales for US upland cotton from the FAS Open Data API. Run by the
 * daily cron (FAS publishes on Thursdays); an admin can also trigger it from the admin editor.
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
    const report = await syncExportSales();
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
