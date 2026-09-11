import { NextResponse } from "next/server";
import { getRecentActivity } from "@/lib/server/audit";
import { readSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "20");
  try {
    const rows = await getRecentActivity(Number.isFinite(limit) ? limit : 20);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 },
    );
  }
}
