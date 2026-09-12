"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { AddButton, IconButton, Labeled, Modal, NumInput, SelectInput } from "@/components/admin/kit";
import { timeAgo } from "@/lib/format";

type Device = { _id: string; deviceId: string; deviceLabel: string; createdAt: number; lastSeenAt: number };
type UserRow = {
  _id: string;
  username: string;
  role: "admin" | "client";
  status: "pending" | "approved" | "rejected";
  deviceLimit: number | null;
  createdAt: number;
  approvedAt: number | null;
  approvedBy: string | null;
  devices: Device[];
};

const STATUS_STYLE: Record<UserRow["status"], string> = {
  pending: "bg-warn-soft text-warn",
  approved: "bg-pos-soft text-pos",
  rejected: "bg-neg-soft text-neg",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [modalUser, setModalUser] = useState<UserRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setError("Failed to load users"));

  useEffect(() => {
    load();
  }, []);

  async function act(username: string, action: string, payload: Record<string, unknown> = {}) {
    setBusy(username);
    setError(null);
    const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(d.error ?? "That didn't work");
      return false;
    }
    await load();
    return true;
  }

  if (users == null) return <div className="text-sm text-ink-faint">Loading…</div>;

  const pending = users.filter((u) => u.status === "pending");
  const others = users.filter((u) => u.status !== "pending");

  return (
    <div>
      <PageHeader title="Users" icon="◈" sub="Approve signup requests, set roles, and control how many devices each account can be signed in on." />

      {error ? (
        <div className="mb-4 rounded-xl bg-neg-soft px-3.5 py-2 text-[12px] font-medium text-neg ring-1 ring-neg/20">
          {error}
        </div>
      ) : null}

      <Card className="mb-4">
        <CardHeader title="Pending requests" sub={`${pending.length} waiting for approval`} />
        {pending.length === 0 ? (
          <p className="text-[12px] text-ink-faint">No pending requests.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((u) => (
              <div
                key={u._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/40 p-3"
              >
                <div>
                  <div className="text-[12.5px] font-semibold text-ink">{u.username}</div>
                  <div className="num text-[10.5px] text-ink-faint">requested {timeAgo(u.createdAt)}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy === u._id}
                    onClick={() => act(u._id, "approve")}
                    className="rounded-lg bg-accent px-3 py-1.5 text-[11.5px] font-semibold text-accent-contrast hover:bg-accent-strong disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy === u._id}
                    onClick={() => act(u._id, "reject")}
                    className="rounded-lg bg-neg-soft px-3 py-1.5 text-[11.5px] font-semibold text-neg hover:opacity-80 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="All users" sub={`${others.length} account${others.length === 1 ? "" : "s"}`} />
        {others.length === 0 ? (
          <p className="text-[12px] text-ink-faint">No approved or rejected users yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-surface-2 text-[10px] uppercase tracking-wide text-ink-faint">
                  <th className="border-b border-line px-2.5 py-2 text-left font-semibold">Username</th>
                  <th className="border-b border-line px-2.5 py-2 text-left font-semibold">Role</th>
                  <th className="border-b border-line px-2.5 py-2 text-left font-semibold">Status</th>
                  <th className="border-b border-line px-2.5 py-2 text-left font-semibold">Device limit</th>
                  <th className="border-b border-line px-2.5 py-2 text-left font-semibold">Devices</th>
                  <th className="border-b border-line px-2.5 py-2" />
                </tr>
              </thead>
              <tbody>
                {others.map((u) => (
                  <tr key={u._id} className="cursor-pointer hover:bg-surface-2/50" onClick={() => setModalUser(u)}>
                    <td className="border-b border-line/60 px-2.5 py-2 font-medium text-ink">{u.username}</td>
                    <td className="border-b border-line/60 px-2.5 py-2 text-ink-soft">{u.role}</td>
                    <td className="border-b border-line/60 px-2.5 py-2">
                      <span className={"rounded-md px-2 py-0.5 text-[10.5px] font-semibold " + STATUS_STYLE[u.status]}>
                        {u.status}
                      </span>
                    </td>
                    <td className="num border-b border-line/60 px-2.5 py-2 text-ink-soft">
                      {u.deviceLimit ?? "Unlimited"}
                    </td>
                    <td className="num border-b border-line/60 px-2.5 py-2 text-ink-soft">{u.devices.length}</td>
                    <td className="border-b border-line/60 px-2.5 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <span
                        onClick={() => setModalUser(u)}
                        className="cursor-pointer rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:bg-accent hover:text-accent-contrast"
                      >
                        Manage →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalUser ? (
        <UserModal
          user={modalUser}
          busy={busy === modalUser._id}
          onClose={() => setModalUser(null)}
          act={act}
        />
      ) : null}
    </div>
  );
}

function UserModal({
  user,
  busy,
  onClose,
  act,
}: {
  user: UserRow;
  busy: boolean;
  onClose: () => void;
  act: (username: string, action: string, payload?: Record<string, unknown>) => Promise<boolean>;
}) {
  const [role, setRole] = useState(user.role);
  const [deviceLimit, setDeviceLimit] = useState<number | null>(user.deviceLimit);

  const dirty = role !== user.role || deviceLimit !== user.deviceLimit;

  async function save() {
    if (role !== user.role) await act(user._id, "setRole", { role });
    if (deviceLimit !== user.deviceLimit) await act(user._id, "setDeviceLimit", { deviceLimit });
    onClose();
  }

  return (
    <Modal
      title={`Manage ${user.username}`}
      onClose={onClose}
      onSubmit={dirty ? save : undefined}
      submitLabel="Save"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Labeled label="Role">
          <SelectInput value={role} options={["client", "admin"]} onChange={(v) => setRole(v as "admin" | "client")} />
        </Labeled>
        <Labeled label="Device limit (empty = unlimited)">
          <NumInput value={deviceLimit} align="left" onChange={setDeviceLimit} />
        </Labeled>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <span className={"rounded-md px-2 py-0.5 text-[10.5px] font-semibold " + STATUS_STYLE[user.status]}>
          {user.status}
        </span>
        {user.status === "approved" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => act(user._id, "reject")}
            className="rounded-lg bg-neg-soft px-3 py-1.5 text-[11.5px] font-semibold text-neg hover:opacity-80 disabled:opacity-50"
          >
            Revoke access
          </button>
        ) : null}
        {user.status === "rejected" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => act(user._id, "approve")}
            className="rounded-lg bg-accent px-3 py-1.5 text-[11.5px] font-semibold text-accent-contrast hover:bg-accent-strong disabled:opacity-50"
          >
            Re-approve
          </button>
        ) : null}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
            Signed-in devices
          </span>
          {user.devices.length > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => act(user._id, "revokeAllDevices")}
              className="text-[11px] font-semibold text-neg hover:underline disabled:opacity-50"
            >
              Sign out all devices
            </button>
          ) : null}
        </div>
        {user.devices.length === 0 ? (
          <p className="text-[11.5px] text-ink-faint">Not signed in anywhere right now.</p>
        ) : (
          <div className="space-y-1.5">
            {user.devices.map((dev) => (
              <div
                key={dev.deviceId}
                className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-2/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-ink">{dev.deviceLabel}</div>
                  <div className="num text-[10px] text-ink-faint">last active {timeAgo(dev.lastSeenAt)}</div>
                </div>
                <IconButton
                  title="Sign this device out"
                  danger
                  onClick={() => act(user._id, "revokeDevice", { deviceId: dev.deviceId })}
                >
                  ✕
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
