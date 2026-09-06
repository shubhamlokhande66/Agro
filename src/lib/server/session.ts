import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./users";

const COOKIE = "cda_session";
const secretStr =
  process.env.AUTH_SECRET ?? "dev-insecure-secret-change-in-production-please";
const secret = new TextEncoder().encode(secretStr);

export type Session = { username: string; role: Role };

export async function createSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function readSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { username: payload.username as string, role: payload.role as Role };
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(COOKIE);
}

export async function requireAdmin(): Promise<Session> {
  const s = await readSession();
  if (!s || s.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
  return s;
}
