import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { App, Role } from "./users";
import { sessionExists, touchSession } from "./devices";

/** one session cookie per dashboard, so a browser can be signed in to both independently */
const COOKIES: Record<App, string> = { cotton: "cda_session", weather: "wda_session" };
const secretStr =
  process.env.AUTH_SECRET ?? "dev-insecure-secret-change-in-production-please";
const secret = new TextEncoder().encode(secretStr);

export type Session = { username: string; role: Role; sessionId: string; deviceId: string; app: App };

export const parseApp = (v: unknown): App => (v === "weather" ? "weather" : "cotton");

export async function createSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  cookies().set(COOKIES[session.app], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Verifies the cookie's signature, that it belongs to `app`, AND that the session hasn't
 *  been revoked (admin removed the device, or it was signed out) — so a revoked device
 *  stops working on its very next request, not just at its next login. */
export async function readSession(app: App = "cotton"): Promise<Session | null> {
  const token = cookies().get(COOKIES[app])?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    // tokens issued before the weather dashboard existed carry no app — they're cotton
    if (parseApp(payload.app) !== app) return null;
    const sessionId = payload.sessionId as string;
    if (!sessionId || !(await sessionExists(sessionId))) return null;
    touchSession(sessionId).catch(() => {});
    return {
      username: payload.username as string,
      role: payload.role as Role,
      sessionId,
      deviceId: payload.deviceId as string,
      app,
    };
  } catch {
    return null;
  }
}

export function clearSession(app: App = "cotton") {
  cookies().delete(COOKIES[app]);
}

/** the admin session for one dashboard's admin area, or null */
export async function readAdmin(app: App = "cotton"): Promise<Session | null> {
  const s = await readSession(app);
  return s && s.role === "admin" ? s : null;
}

export async function requireAdmin(): Promise<Session> {
  const s = await readSession();
  if (!s || s.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
  return s;
}
