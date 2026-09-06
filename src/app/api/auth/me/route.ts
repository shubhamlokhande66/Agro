import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";

export async function GET() {
  const session = await readSession();
  return NextResponse.json({ session });
}
