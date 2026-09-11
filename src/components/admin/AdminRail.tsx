"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { DATASETS } from "@/lib/datasets/registry";
import { useAdminMeta } from "@/lib/admin/context";
import { timeAgo } from "@/lib/format";

const STALE_DAYS = 30;
const FRESH_DAYS = 7;

function statusDot(updatedAt: number | null | undefined) {
  if (updatedAt == null) return "bg-ink-faint/40";
  const days = (Date.now() / 1000 - updatedAt) / 86400;
  if (days < FRESH_DAYS) return "bg-pos";
  if (days < STALE_DAYS) return "bg-warn";
  return "bg-neg";
}

export function AdminRail() {
  const pathname = usePathname();
  const { meta } = useAdminMeta();
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = query
      ? DATASETS.filter(
          (d) => d.label.toLowerCase().includes(query) || d.key.toLowerCase().includes(query),
        )
      : DATASETS;
    const byGroup = new Map<string, typeof DATASETS>();
    for (const d of filtered) {
      if (!byGroup.has(d.group)) byGroup.set(d.group, []);
      byGroup.get(d.group)!.push(d);
    }
    return Array.from(byGroup.entries());
  }, [q]);

  return (
    <div>
      <div className="p-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search datasets…"
          className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-[12px] outline-none focus:border-accent focus:bg-surface"
        />
      </div>

      <div className="space-y-3 px-2 pb-3">
        <Link
          href="/admin"
          className={clsx(
            "flex items-center gap-2 rounded-lg px-2.5 py-[7px] text-[12.5px] font-semibold transition-colors",
            pathname === "/admin"
              ? "bg-accent-soft text-ink"
              : "text-ink-soft hover:bg-surface-2 hover:text-ink",
          )}
        >
          <span className="grid h-5 w-5 place-items-center rounded-md bg-surface-2 text-[11px]">◎</span>
          Overview
        </Link>

        {groups.map(([group, items]) => (
          <div key={group}>
            <div className="mb-1 px-2.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink-faint/80">
              {group}
            </div>
            <div className="space-y-0.5">
              {items.map((d) => {
                const active = pathname === `/admin/${d.key}`;
                const m = meta[d.key];
                return (
                  <Link
                    key={d.key}
                    href={`/admin/${d.key}`}
                    className={clsx(
                      "group relative flex items-center gap-2 rounded-lg px-2.5 py-[7px] text-[12px] font-medium transition-colors",
                      active ? "bg-accent-soft text-ink" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    {active ? (
                      <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                    ) : null}
                    <span
                      title={m ? `updated ${timeAgo(m.updatedAt)}` : "no data yet"}
                      className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", statusDot(m?.updatedAt))}
                    />
                    <span className="min-w-0 flex-1 truncate">{d.label}</span>
                    <span className="num shrink-0 text-[9.5px] text-ink-faint">
                      {m ? timeAgo(m.updatedAt) : ""}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {groups.length === 0 ? (
          <p className="px-2.5 text-[11.5px] text-ink-faint">No datasets match “{q}”.</p>
        ) : null}
      </div>
    </div>
  );
}
