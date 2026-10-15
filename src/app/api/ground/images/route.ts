import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Binary } from "mongodb";
import { getDb, COLLECTIONS } from "@/db";
import { readAdmin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
/** the editor shrinks photos to ~1600px JPEG before upload (~200–400 KB); this is a hard cap */
const MAX_BYTES = 3 * 1024 * 1024;

/**
 * Upload one Field Pulse photo (cotton admin only). The body is the raw image bytes with
 * its Content-Type; returns { id } for the report to reference (served by ./[id]).
 */
export async function POST(req: Request) {
  const session = await readAdmin("cotton");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentType = (req.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Upload a JPEG, PNG or WebP image" }, { status: 400 });
  }
  const bytes = Buffer.from(await req.arrayBuffer());
  if (bytes.length === 0) return NextResponse.json({ error: "Empty upload" }, { status: 400 });
  if (bytes.length > MAX_BYTES) return NextResponse.json({ error: "Image is larger than 3 MB" }, { status: 413 });

  const id = randomBytes(12).toString("hex");
  const db = await getDb();
  await db.collection(COLLECTIONS.groundImages).insertOne({
    _id: id as any,
    contentType,
    data: new Binary(bytes),
    size: bytes.length,
    uploadedBy: session.username,
    uploadedAt: Math.floor(Date.now() / 1000),
  });
  return NextResponse.json({ id });
}
