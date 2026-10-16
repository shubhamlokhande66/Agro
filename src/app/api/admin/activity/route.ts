import { NextResponse } from "next/server";
import { getRecentActivity } from "@/lib/server/audit";
import { parseApp, readAdmin } from "@/lib/server/session";
import { datasetApp } from "@/lib/datasets/registry";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // ?app=weather → the weather admin area's view (weather datasets only); default cotton
  const app = parseApp(new URL(req.url).searchParams.get("app"));
  if (!(await readAdmin(app))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "20");
  try {
    const want = Number.isFinite(limit) ? limit : 20;
    const rows = (await getRecentActivity(want * 4)).filter((r) => datasetApp(r.datasetKey) === app).slice(0, want);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 },
    );
  }
}
