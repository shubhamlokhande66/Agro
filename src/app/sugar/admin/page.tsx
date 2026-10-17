"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { SugarAdminGate } from "@/components/sugar/SugarAdminGate";
import { SUGAR_DATASETS } from "@/lib/datasets/registry";
import { SUGAR_SAMPLE } from "@/data/sugar/sample";
import { timeAgo } from "@/lib/format";

type MetaRow = { key: string; updatedAt: number | null; updatedBy: string | null };
type Activity = { datasetKey: string; action: string; by: string | null; at: number };

/** Sugar admin dashboard — edit every number behind the sugar dashboard, manage sugar accounts */
export default function SugarAdminPage() {
  const [meta, setMeta] = useState<Record<string, MetaRow>>({});
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    fetch("/api/admin/meta?app=sugar")
      .then((r) => r.json())
      .then((d) => setMeta(Object.fromEntries((d.rows ?? []).map((r: MetaRow) => [r.key, r]))))
      .catch(() => {});
    fetch("/api/admin/activity?app=sugar&limit=12")
      .then((r) => r.json())
      .then((d) => setActivity(d.rows ?? []))
      .catch(() => {});
  }, []);

  const sample = SUGAR_DATASETS.filter((d) => SUGAR_SAMPLE[d.key]).length;
  const label = (key: string) => SUGAR_DATASETS.find((d) => d.key === key)?.label ?? key;

  return (
    <SugarAdminGate>
      <PageHeader title="Sugar Admin" icon="⚙" sub="Edit the data behind every sugar page, and manage sugar dashboard accounts." />

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="panel p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">Datasets</div>
          <div className="num mt-1.5 text-2xl font-semibold text-ink">{SUGAR_DATASETS.length}</div>
        </div>
        <div className="panel p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">Still sample values</div>
          <div className={"num mt-1.5 text-2xl font-semibold " + (sample ? "text-warn" : "text-pos")}>{sample}</div>
        </div>
        <div className="panel p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">Real data</div>
          <div className="num mt-1.5 text-2xl font-semibold text-ink">{SUGAR_DATASETS.length - sample}</div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader title="Datasets" sub="Click one to add or change its numbers — the sugar pages update as soon as you save" />
          <div className="space-y-2">
            {SUGAR_DATASETS.map((d) => {
              const m = meta[d.key];
              return (
                <Link
                  key={d.key}
                  href={`/sugar/admin/${d.key}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/40 p-3 transition-colors hover:border-accent/60"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                      {d.label}
                      {SUGAR_SAMPLE[d.key] ? (
                        <span className="rounded bg-amber-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-amber-800">sample</span>
                      ) : null}
                    </div>
                    <div className="truncate text-[11px] text-ink-faint">{d.description}</div>
                  </div>
                  <div className="shrink-0 text-right text-[10.5px] text-ink-faint">
                    {m?.updatedAt && m.updatedBy ? `updated ${timeAgo(m.updatedAt)}` : "not edited yet"}
                    {m?.updatedBy ? <div>by {m.updatedBy}</div> : null}
                  </div>
                </Link>
              );
            })}
            <Link
              href="/sugar/admin/users"
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/40 p-3 transition-colors hover:border-accent/60"
            >
              <div>
                <div className="text-[13px] font-semibold text-ink">Sugar users</div>
                <div className="text-[11px] text-ink-faint">Approve sign-up requests, device limits, switch accounts off</div>
              </div>
              <span className="text-[11px] text-ink-faint">→</span>
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent changes" />
          {activity.length ? (
            <ul className="space-y-2 text-[12px]">
              {activity.map((a, i) => (
                <li key={i} className="border-b border-line pb-2 last:border-0">
                  <div className="font-medium text-ink">{label(a.datasetKey)}</div>
                  <div className="text-ink-faint">
                    {a.action} · {a.by ?? "system"} · {timeAgo(a.at)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-ink-faint">No changes yet.</p>
          )}
        </Card>
      </div>
    </SugarAdminGate>
  );
}
