"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { AdminGate } from "@/components/monsoon/AdminGate";
import { WEATHER_DATASETS } from "@/lib/datasets/registry";
import { timeAgo } from "@/lib/format";

type MetaRow = { key: string; updatedAt: number | null; updatedBy: string | null };
type Activity = { datasetKey: string; action: string; by: string | null; at: number };

/** Weather admin dashboard — the weather datasets and weather accounts only */
export default function WeatherAdminPage() {
  const [meta, setMeta] = useState<Record<string, MetaRow>>({});
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    fetch("/api/admin/meta?app=weather")
      .then((r) => r.json())
      .then((d) => setMeta(Object.fromEntries((d.rows ?? []).map((r: MetaRow) => [r.key, r]))))
      .catch(() => {});
    fetch("/api/admin/activity?app=weather&limit=10")
      .then((r) => r.json())
      .then((d) => setActivity(d.rows ?? []))
      .catch(() => {});
  }, []);

  return (
    <AdminGate>
      <PageHeader title="Weather Admin" icon="⚙" sub="Edit the data behind the Weather dashboard and manage weather accounts." />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader title="Datasets" sub={`${WEATHER_DATASETS.length} weather datasets`} />
          <div className="space-y-2">
            {WEATHER_DATASETS.map((d) => {
              const m = meta[d.key];
              return (
                <Link
                  key={d.key}
                  href={`/monsoon/admin/${d.key}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/40 p-3 transition-colors hover:border-accent/60"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-ink">{d.label}</div>
                    <div className="truncate text-[11px] text-ink-faint">{d.description}</div>
                  </div>
                  <div className="shrink-0 text-right text-[10.5px] text-ink-faint">
                    {m?.updatedAt ? `updated ${timeAgo(m.updatedAt)}` : "not edited yet"}
                    {m?.updatedBy ? <div>by {m.updatedBy}</div> : null}
                  </div>
                </Link>
              );
            })}
            <Link
              href="/monsoon/admin/users"
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/40 p-3 transition-colors hover:border-accent/60"
            >
              <div>
                <div className="text-[13px] font-semibold text-ink">Weather Users</div>
                <div className="text-[11px] text-ink-faint">Approve weather sign-ups, device limits, sign devices out</div>
              </div>
              <span className="text-[11px] text-accent">Manage →</span>
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent activity" sub="Latest edits to weather data" />
          {activity.length === 0 ? (
            <p className="text-[12px] text-ink-faint">No edits yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="text-[12px] text-ink-soft">
                  <span className="font-semibold text-ink">{a.by ?? "someone"}</span> updated{" "}
                  <Link href={`/monsoon/admin/${a.datasetKey}`} className="font-medium text-accent hover:underline">
                    {WEATHER_DATASETS.find((d) => d.key === a.datasetKey)?.label ?? a.datasetKey}
                  </Link>
                  <div className="num text-[10.5px] text-ink-faint">{timeAgo(a.at)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AdminGate>
  );
}
