import { NextResponse } from "next/server";
import { parseApp, readAdmin } from "@/lib/server/session";
import { listUsersWithDevices, userApp } from "@/lib/server/users";

export const dynamic = "force-dynamic";

/** GET /api/admin/users?app=weather — each admin area lists only its own dashboard's accounts */
export async function GET(req: Request) {
  const app = parseApp(new URL(req.url).searchParams.get("app"));
  if (!(await readAdmin(app))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const users = (await listUsersWithDevices()).filter((u) => userApp(u) === app);
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 },
    );
  }
}
