import { NextResponse } from "next/server";
import { readSession, parseApp } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** GET /api/auth/me?app=weather — the signed-in session for one dashboard (cotton by default) */
export async function GET(req: Request) {
  const session = await readSession(parseApp(new URL(req.url).searchParams.get("app")));
  return NextResponse.json({ session });
}
