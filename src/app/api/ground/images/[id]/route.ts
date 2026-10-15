import { NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/db";
import { readAdmin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

type ImageDoc = { _id: string; contentType: string; data: { buffer: Uint8Array } };

const validId = (id: string) => /^[a-f0-9]{24}$/.test(id);

/** a Ground Report photo; ids are random and never reused, so it can be cached for good */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!validId(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = await getDb();
  const doc = await db.collection<ImageDoc>(COLLECTIONS.groundImages).findOne({ _id: params.id });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(Buffer.from(doc.data.buffer), {
    headers: {
      "content-type": doc.contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

/** remove a photo (cotton admin only) — called when a photo is taken out of a report */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await readAdmin("cotton");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!validId(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = await getDb();
  await db.collection<ImageDoc>(COLLECTIONS.groundImages).deleteOne({ _id: params.id });
  return NextResponse.json({ ok: true });
}
