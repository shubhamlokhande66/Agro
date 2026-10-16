import { getDb, COLLECTIONS } from "@/db";
import { hashPassword, verifyPassword } from "./passwords";
import { listDevices, type SessionDoc } from "./devices";

export type Role = "admin" | "client";
/** which dashboard an account signs in to — accounts are never shared between the two */
export type App = "cotton" | "weather";
export const APPS: App[] = ["cotton", "weather"];
export type UserStatus = "pending" | "approved" | "rejected";

export type UserDoc = {
  _id: string; // lowercased username — the unique key
  username: string; // display form, as typed at signup
  passwordHash: string;
  role: Role;
  status: UserStatus;
  /** the dashboard this account belongs to; missing on older accounts = cotton */
  app?: App;
  /** max concurrent devices allowed to be logged in at once; null = unlimited */
  deviceLimit: number | null;
  createdAt: number;
  approvedAt: number | null;
  approvedBy: string | null;
};

const key = (username: string) => username.trim().toLowerCase();

/** the dashboard an account belongs to (older accounts predate the weather dashboard = cotton) */
export const userApp = (u: Pick<UserDoc, "app">): App => u.app ?? "cotton";

export async function getUserByUsername(username: string): Promise<UserDoc | null> {
  const db = await getDb();
  return db.collection<UserDoc>(COLLECTIONS.users).findOne({ _id: key(username) });
}

export async function listUsers(): Promise<UserDoc[]> {
  const db = await getDb();
  return db
    .collection<UserDoc>(COLLECTIONS.users)
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray() as Promise<UserDoc[]>;
}

export type UserWithDevices = UserDoc & { devices: SessionDoc[] };

export async function listUsersWithDevices(): Promise<UserWithDevices[]> {
  const users = await listUsers();
  return Promise.all(
    users.map(async (u) => ({ ...u, devices: await listDevices(u._id) })),
  );
}

/** Self-service signup — always lands as a pending client account awaiting admin approval. */
export async function createUser(
  username: string,
  password: string,
  app: App = "cotton",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = username.trim();
  if (trimmed.length < 3) return { ok: false, error: "Username must be at least 3 characters" };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters" };

  const db = await getDb();
  const col = db.collection<UserDoc>(COLLECTIONS.users);
  const existing = await col.findOne({ _id: key(trimmed) });
  if (existing) return { ok: false, error: "That username is already taken" };

  const now = Math.floor(Date.now() / 1000);
  await col.insertOne({
    _id: key(trimmed),
    username: trimmed,
    passwordHash: hashPassword(password),
    role: "client",
    status: "pending",
    app,
    deviceLimit: null,
    createdAt: now,
    approvedAt: null,
    approvedBy: null,
  });
  return { ok: true };
}

export function checkPassword(user: UserDoc, password: string): boolean {
  return verifyPassword(password, user.passwordHash);
}

export async function setUserStatus(username: string, status: UserStatus, by: string) {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  await db.collection<UserDoc>(COLLECTIONS.users).updateOne(
    { _id: key(username) },
    { $set: { status, approvedAt: status === "approved" ? now : null, approvedBy: by } },
  );
}

export async function setUserRole(username: string, role: Role) {
  const db = await getDb();
  await db.collection<UserDoc>(COLLECTIONS.users).updateOne({ _id: key(username) }, { $set: { role } });
}

export async function setUserApp(username: string, app: App) {
  const db = await getDb();
  await db.collection<UserDoc>(COLLECTIONS.users).updateOne({ _id: key(username) }, { $set: { app } });
}

export async function setDeviceLimit(username: string, deviceLimit: number | null) {
  const db = await getDb();
  await db.collection<UserDoc>(COLLECTIONS.users).updateOne({ _id: key(username) }, { $set: { deviceLimit } });
}

/** Seeds a user directly as an already-approved account (used for migrating the old hardcoded accounts). */
export async function upsertApprovedUser(username: string, password: string, role: Role) {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  await db.collection<UserDoc>(COLLECTIONS.users).updateOne(
    { _id: key(username) },
    {
      $setOnInsert: {
        _id: key(username),
        username,
        passwordHash: hashPassword(password),
        role,
        status: "approved",
        deviceLimit: null,
        createdAt: now,
        approvedAt: now,
        approvedBy: "seed",
      },
    },
    { upsert: true },
  );
}
