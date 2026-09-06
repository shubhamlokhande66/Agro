"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/auth";
import { DATASETS } from "@/lib/datasets/registry";

type Row = { key: string; updatedAt: number; updatedBy: string | null };

export default function AdminPage() {
  const { ready, isAdmin } = useAuth();
  const router = useRouter();
  const [meta, setMeta] = useState<Record<string, Row>>({});

  useEffect(() => {
    if (ready && !isAdmin) router.replace("/");
  }, [ready, isAdmin, router]);

  useEffect(() => {
    Promise.all(
      DATASETS.map((d) =>
        fetch(`/api/datasets/${d.key}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((row) =>
            row ? { key: d.key, updatedAt: row.updatedAt, updatedBy: row.updatedBy } : null,
          )
          .catch(() => null),
      ),
    ).then((rows) => {
      const m: Record<string, Row> = {};
      rows.forEach((r) => r && (m[r.key] = r));
      setMeta(m);
    });
  }, []);

  if (!ready || !isAdmin) return null;

  const groups = Array.from(new Set(DATASETS.map((d) => d.group)));

  return (
    <div>
      <PageHeader
        title="Admin · Datasets"
        icon="⚙"
        sub="Every dashboard dataset lives in the database. Edit here — changes go live for everyone immediately."
      />

      {groups.map((g) => (
        <div key={g}>
          <div className="mb-2 mt-6 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            {g}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DATASETS.filter((d) => d.group === g).map((d) => {
              const m = meta[d.key];
              return (
                <Link
                  key={d.key}
                  href={`/admin/${d.key}`}
                  className="panel panel-hover block p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-semibold text-ink">{d.label}</div>
                    <span className="num rounded-md bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-ink-faint">
                      {d.kind}
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
                    {d.description}
                  </p>
                  {m ? (
                    <p className="num mt-2 text-[10px] text-ink-faint">
                      updated {new Date(m.updatedAt * 1000).toLocaleDateString("en-IN")} ·{" "}
                      {m.updatedBy ?? "—"}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
