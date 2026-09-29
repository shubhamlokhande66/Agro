import { NextResponse } from "next/server";
import { getDataset, putDataset } from "@/lib/server/datasets";
import { readAdmin } from "@/lib/server/session";
import { datasetApp, datasetMeta } from "@/lib/datasets/registry";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { key: string } },
) {
  const row = await getDataset(params.key);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(
  req: Request,
  { params }: { params: { key: string } },
) {
  if (!datasetMeta(params.key)) {
    return NextResponse.json({ error: "Unknown dataset" }, { status: 400 });
  }
  // each dashboard's data is edited from its own admin area, with that dashboard's admin sign-in
  const session = await readAdmin(datasetApp(params.key));
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (body == null || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  try {
    await putDataset(params.key, body, session.username);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Write failed" },
      { status: 500 },
    );
  }
}
