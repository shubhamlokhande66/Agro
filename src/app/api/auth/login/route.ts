import { NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/server/users";
import { createSession } from "@/lib/server/session";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }
  const user = verifyCredentials(username, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  await createSession({ username: user.username, role: user.role });
  return NextResponse.json({ username: user.username, role: user.role });
}
