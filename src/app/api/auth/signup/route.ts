import { NextResponse } from "next/server";
import { createUser } from "@/lib/server/users";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
  }
  const result = await createUser(username, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
