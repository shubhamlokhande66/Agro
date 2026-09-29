import { NextResponse } from "next/server";
import { readSession, clearSession, parseApp } from "@/lib/server/session";
import { revokeSession } from "@/lib/server/devices";

/** POST /api/auth/logout?app=weather — signs out of one dashboard (cotton by default) */
export async function POST(req: Request) {
  const app = parseApp(new URL(req.url).searchParams.get("app"));
  const session = await readSession(app);
  if (session) await revokeSession(session.sessionId).catch(() => {});
  clearSession(app);
  return NextResponse.json({ ok: true });
}
