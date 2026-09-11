import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import {
  getUserByUsername,
  listUsers,
  setDeviceLimit,
  setUserRole,
  setUserStatus,
} from "@/lib/server/users";
import { revokeAllDevices, revokeDevice } from "@/lib/server/devices";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { username: string } },
) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await getUserByUsername(params.username);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  // don't let the only admin account lock itself out
  const wouldStripAdmin =
    (action === "setRole" && target.role === "admin" && body.role !== "admin") ||
    (action === "reject" && target.role === "admin");
  if (wouldStripAdmin) {
    const admins = (await listUsers()).filter((u) => u.role === "admin" && u.status === "approved");
    if (admins.length <= 1) {
      return NextResponse.json({ error: "Can't do that — this is the only admin account" }, { status: 400 });
    }
  }

  try {
    switch (action) {
      case "approve":
        await setUserStatus(target._id, "approved", session.username);
        break;
      case "reject":
        await setUserStatus(target._id, "rejected", session.username);
        await revokeAllDevices(target._id);
        break;
      case "resetToPending":
        await setUserStatus(target._id, "pending", session.username);
        break;
      case "setRole":
        if (body.role !== "admin" && body.role !== "client") {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }
        await setUserRole(target._id, body.role);
        break;
      case "setDeviceLimit": {
        const limit = body.deviceLimit;
        if (limit !== null && (typeof limit !== "number" || limit < 1)) {
          return NextResponse.json({ error: "Device limit must be a positive number or null" }, { status: 400 });
        }
        await setDeviceLimit(target._id, limit);
        break;
      }
      case "revokeDevice":
        if (typeof body.deviceId !== "string") {
          return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
        }
        await revokeDevice(target._id, body.deviceId);
        break;
      case "revokeAllDevices":
        await revokeAllDevices(target._id);
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }
}
