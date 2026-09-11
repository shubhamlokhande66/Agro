import { NextResponse } from "next/server";
import { getAllDatasetMeta } from "@/lib/server/datasets";
import { readSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const rows = await getAllDatasetMeta();
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 },
    );
  }
}
