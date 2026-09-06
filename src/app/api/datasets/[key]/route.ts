import { NextResponse } from "next/server";
import { getDataset, putDataset } from "@/lib/server/datasets";
import { readSession } from "@/lib/server/session";
import { datasetMeta } from "@/lib/datasets/registry";

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
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!datasetMeta(params.key)) {
    return NextResponse.json({ error: "Unknown dataset" }, { status: 400 });
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
