import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./users";
import { sessionExists, touchSession } from "./devices";

const COOKIE = "cda_session";
const secretStr =
  process.env.AUTH_SECRET ?? "dev-insecure-secret-change-in-production-please";
const secret = new TextEncoder().encode(secretStr);

export type Session = { username: string; role: Role; sessionId: string; deviceId: string };

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

/** Verifies the cookie's signature AND that the session hasn't been revoked
 *  (admin removed the device, or it was signed out) — so a revoked device
 *  stops working on its very next request, not just at its next login. */
export async function readSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const sessionId = payload.sessionId as string;
    if (!sessionId || !(await sessionExists(sessionId))) return null;
    touchSession(sessionId).catch(() => {});
    return {
      username: payload.username as string,
      role: payload.role as Role,
      sessionId,
      deviceId: payload.deviceId as string,
    };
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
