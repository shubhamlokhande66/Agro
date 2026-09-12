import { randomUUID } from "node:crypto";
import { getDb, COLLECTIONS } from "@/db";

export type SessionDoc = {
  _id: string; // session id, stored in the signed cookie
  username: string; // lowercased key, matches UserDoc._id
  deviceId: string; // random id the browser persists in localStorage
  deviceLabel: string; // best-effort "Chrome on Windows" style label
  createdAt: number;
  lastSeenAt: number;
};

const key = (username: string) => username.trim().toLowerCase();

/** distinct devices currently holding a session for this user (optionally ignoring one device) */
export async function activeDeviceCount(username: string, excludeDeviceId?: string): Promise<number> {
  const db = await getDb();
  const rows = await db
    .collection<SessionDoc>(COLLECTIONS.sessions)
    .find({ username: key(username) }, { projection: { deviceId: 1 } })
    .toArray();
  const ids = new Set(rows.map((r) => r.deviceId).filter((id) => id !== excludeDeviceId));
  return ids.size;
}

export async function createSessionRecord(params: {
  username: string;
  deviceId: string;
  deviceLabel: string;
}): Promise<string> {
  const db = await getDb();
  const sessionId = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  // logging in again from the same device replaces its previous session rather than stacking rows
  await db
    .collection<SessionDoc>(COLLECTIONS.sessions)
    .deleteMany({ username: key(params.username), deviceId: params.deviceId });
  await db.collection<SessionDoc>(COLLECTIONS.sessions).insertOne({
    _id: sessionId,
    username: key(params.username),
    deviceId: params.deviceId,
    deviceLabel: params.deviceLabel,
    createdAt: now,
    lastSeenAt: now,
  });
  return sessionId;
}

export async function sessionExists(sessionId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.collection<SessionDoc>(COLLECTIONS.sessions).findOne({ _id: sessionId }, { projection: { _id: 1 } });
  return !!row;
}

export async function touchSession(sessionId: string) {
  const db = await getDb();
  await db
    .collection<SessionDoc>(COLLECTIONS.sessions)
    .updateOne({ _id: sessionId }, { $set: { lastSeenAt: Math.floor(Date.now() / 1000) } });
}

export async function revokeSession(sessionId: string) {
  const db = await getDb();
  await db.collection<SessionDoc>(COLLECTIONS.sessions).deleteOne({ _id: sessionId });
}

/** one row per active device (collapsing that device's multiple session rows into its most recent one) */
export async function listDevices(username: string): Promise<SessionDoc[]> {
  const db = await getDb();
  const rows = await db
    .collection<SessionDoc>(COLLECTIONS.sessions)
    .find({ username: key(username) })
    .sort({ lastSeenAt: -1 })
    .toArray();
  const byDevice = new Map<string, SessionDoc>();
  for (const r of rows) if (!byDevice.has(r.deviceId)) byDevice.set(r.deviceId, r);
  return Array.from(byDevice.values());
}

/** signs every session out of one device — that device's saved login stops working immediately */
export async function revokeDevice(username: string, deviceId: string) {
  const db = await getDb();
  await db.collection<SessionDoc>(COLLECTIONS.sessions).deleteMany({ username: key(username), deviceId });
}

export async function revokeAllDevices(username: string) {
  const db = await getDb();
  await db.collection<SessionDoc>(COLLECTIONS.sessions).deleteMany({ username: key(username) });
}
