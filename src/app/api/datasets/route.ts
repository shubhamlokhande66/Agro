import { NextResponse } from "next/server";
import { getAllDatasets } from "@/lib/server/datasets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getAllDatasets();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 },
    );
  }
}
