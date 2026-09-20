import { NextResponse } from "next/server";
import { getAllDatasetMeta } from "@/lib/server/datasets";

/** Public "last updated" timestamps per dataset, for the report-date chip on live dashboard
 *  pages — unlike /api/admin/meta this is unauthenticated (no `updatedBy`), matching the
 *  already-public /api/datasets route's gating. */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getAllDatasetMeta();
    return NextResponse.json({
      rows: rows.map(({ key, updatedAt }) => ({ key, updatedAt })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 },
    );
  }
}
