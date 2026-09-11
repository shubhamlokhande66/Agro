"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { DATASETS } from "@/lib/datasets/registry";
import { useAdminMeta } from "@/lib/admin/context";
import { timeAgo } from "@/lib/format";

type ActivityRow = { datasetKey: string; action: string; by: string | null; at: number };

const STALE_DAYS = 30;
const FRESH_DAYS = 7;

function Kpi({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "warn" | "pos" }) {
  return (
    <div className="panel p-4">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div
        className={
          "num mt-1.5 text-2xl font-semibold " +
          (tone === "warn" ? "text-warn" : tone === "pos" ? "text-pos" : "text-ink")
        }
      >
        {value}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { meta, loading } = useAdminMeta();
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/admin/activity?limit=12")
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => setActivity(d.rows ?? []))
      .catch(() => setActivity([]));
  }, []);

  const now = Date.now() / 1000;
  const rows = Object.values(meta);
  const freshCount = rows.filter((r) => r.updatedAt != null && (now - r.updatedAt) / 86400 < FRESH_DAYS).length;
  const staleCount = DATASETS.length - rows.filter((r) => r.updatedAt != null && (now - r.updatedAt) / 86400 < STALE_DAYS).length;
  const lastEdit = rows.filter((r) => r.updatedAt != null).sort((a, b) => (b.updatedAt! - a.updatedAt!))[0];

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return query
      ? DATASETS.filter((d) => d.label.toLowerCase().includes(query) || d.group.toLowerCase().includes(query))
      : DATASETS;
  }, [q]);

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        icon="⚙"
        sub="Every dataset that powers the terminal lives here. Pick one from the left, or from the table below, to view and edit its entries."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total datasets" value={DATASETS.length} />
        <Kpi label="Updated this week" value={loading ? "…" : freshCount} tone="pos" />
        <Kpi label="Needs attention" value={loading ? "…" : staleCount} tone={staleCount > 0 ? "warn" : undefined} />
        <Kpi
          label="Last edit"
          value={lastEdit ? timeAgo(lastEdit.updatedAt) : loading ? "…" : "—"}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Dataset directory"
              sub={`${filtered.length} of ${DATASETS.length} datasets`}
              right={
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className="w-40 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] outline-none focus:border-accent focus:bg-surface sm:w-52"
                />
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wide text-ink-faint">
                    <th className="border-b border-line px-2.5 py-2 font-semibold">Dataset</th>
                    <th className="border-b border-line px-2.5 py-2 font-semibold">Group</th>
                    <th className="border-b border-line px-2.5 py-2 font-semibold">Kind</th>
                    <th className="border-b border-line px-2.5 py-2 font-semibold">Updated</th>
                    <th className="border-b border-line px-2.5 py-2 font-semibold">By</th>
                    <th className="border-b border-line px-2.5 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => {
                    const m = meta[d.key];
                    const days = m?.updatedAt != null ? (now - m.updatedAt) / 86400 : null;
                    const stale = days == null || days >= STALE_DAYS;
                    return (
                      <tr key={d.key} className="hover:bg-surface-2/50">
                        <td className="border-b border-line/70 px-2.5 py-2 font-medium text-ink">{d.label}</td>
                        <td className="border-b border-line/70 px-2.5 py-2 text-ink-faint">{d.group}</td>
                        <td className="border-b border-line/70 px-2.5 py-2">
                          <span className="num rounded-md bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-ink-faint">
                            {d.kind}
                          </span>
                        </td>
                        <td className="border-b border-line/70 px-2.5 py-2">
                          <span
                            className={
                              "inline-flex items-center gap-1.5 " + (stale ? "text-warn" : "text-ink-soft")
                            }
                          >
                            <span className={"h-1.5 w-1.5 rounded-full " + (stale ? "bg-warn" : "bg-pos")} />
                            {loading ? "…" : timeAgo(m?.updatedAt)}
                          </span>
                        </td>
                        <td className="border-b border-line/70 px-2.5 py-2 text-ink-faint">
                          {m?.updatedBy ?? "—"}
                        </td>
                        <td className="border-b border-line/70 px-2.5 py-2 text-right">
                          <Link
                            href={`/admin/${d.key}`}
                            className="rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:bg-accent hover:text-accent-contrast"
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="Recent activity" sub="Latest edits across every dataset" />
          {activity.length === 0 ? (
            <p className="text-[12px] text-ink-faint">No edits yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a, i) => {
                const label = DATASETS.find((d) => d.key === a.datasetKey)?.label ?? a.datasetKey;
                return (
                  <li key={i} className="flex gap-2.5 text-[12px]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <div className="min-w-0">
                      <p className="text-ink-soft">
                        <span className="font-semibold text-ink">{a.by ?? "someone"}</span> edited{" "}
                        <Link href={`/admin/${a.datasetKey}`} className="font-medium text-accent hover:underline">
                          {label}
                        </Link>
                      </p>
                      <p className="num text-[10.5px] text-ink-faint">{timeAgo(a.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
