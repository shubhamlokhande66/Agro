import { NextResponse } from "next/server";
import { getAllDatasetMeta } from "@/lib/server/datasets";
import { parseApp, readAdmin } from "@/lib/server/session";
import { datasetApp } from "@/lib/datasets/registry";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // ?app=weather → the weather admin area's view (weather datasets only); default cotton
  const app = parseApp(new URL(req.url).searchParams.get("app"));
  if (!(await readAdmin(app))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const rows = (await getAllDatasetMeta()).filter((r) => datasetApp(r.key) === app);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 },
    );
  }
}
