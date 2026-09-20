import { NextResponse } from "next/server";
import { getComment, putComment } from "@/lib/server/comments";
import { readSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Every section a CommentsPanel currently renders on — keeps the collection from
 *  accepting arbitrary keys from a crafted request. */
const SECTIONS = ["overview", "sowing", "production", "weather", "balanceSheet", "cci"];

export async function GET(_req: Request, { params }: { params: { section: string } }) {
  if (!SECTIONS.includes(params.section)) {
    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  }
  const row = await getComment(params.section);
  return NextResponse.json({ text: row?.text ?? "", updatedAt: row?.updatedAt ?? null, updatedBy: row?.updatedBy ?? null });
}

export async function PUT(req: Request, { params }: { params: { section: string } }) {
  // any signed-in user may leave notes here — this is client-usable commentary, not
  // admin content editing, so it's a lighter gate than the dataset-write endpoints.
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!SECTIONS.includes(params.section)) {
    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (body == null || typeof body.text !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const updatedAt = await putComment(params.section, body.text, session.username);
  return NextResponse.json({ ok: true, updatedAt });
}
