import { NextResponse } from "next/server";
import { readSession, clearSession } from "@/lib/server/session";
import { revokeSession } from "@/lib/server/devices";

export async function POST() {
  const session = await readSession();
  if (session) await revokeSession(session.sessionId).catch(() => {});
  clearSession();
  return NextResponse.json({ ok: true });
}
