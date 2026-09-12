import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { listUsersWithDevices } from "@/lib/server/users";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const users = await listUsersWithDevices();
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 },
    );
  }
}
