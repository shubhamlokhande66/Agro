import { NextResponse } from "next/server";
import { checkPassword, getUserByUsername } from "@/lib/server/users";
import { createSession } from "@/lib/server/session";
import { activeDeviceCount, createSessionRecord } from "@/lib/server/devices";

export async function POST(req: Request) {
  const { username, password, deviceId, deviceLabel } = await req.json().catch(() => ({}));
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }
  if (typeof deviceId !== "string" || !deviceId) {
    return NextResponse.json({ error: "Missing device id" }, { status: 400 });
  }

  const user = await getUserByUsername(username);
  if (!user || !checkPassword(user, password)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  if (user.status === "pending") {
    return NextResponse.json(
      { error: "Your account is waiting for admin approval. Try again once it's approved." },
      { status: 403 },
    );
  }
  if (user.status === "rejected") {
    return NextResponse.json(
      { error: "Your signup request was declined. Contact your admin." },
      { status: 403 },
    );
  }

  if (user.deviceLimit != null) {
    const otherActive = await activeDeviceCount(user._id, deviceId);
    if (otherActive >= user.deviceLimit) {
      return NextResponse.json(
        {
          error:
            user.deviceLimit === 1
              ? "This account is already signed in on another device. Ask your admin to sign that device out."
              : `This account has reached its device limit (${user.deviceLimit}). Ask your admin to free up a device.`,
        },
        { status: 409 },
      );
    }
  }

  const sessionId = await createSessionRecord({
    username: user._id,
    deviceId,
    deviceLabel: typeof deviceLabel === "string" && deviceLabel ? deviceLabel : "Unknown device",
  });
  await createSession({ username: user.username, role: user.role, sessionId, deviceId });
  return NextResponse.json({ username: user.username, role: user.role });
}
