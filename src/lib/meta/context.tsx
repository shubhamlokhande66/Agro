"use client";

/** Public "last updated" metadata for every dataset, for the report-date chip shown on
 *  every dashboard page. A slim, non-admin sibling of `src/lib/admin/context.tsx`'s
 *  `AdminMetaProvider` — that one hits an admin-only endpoint, which would silently leave a
 *  normal signed-in ("client" role) user's `meta` empty since it swallows the 403. */

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type MetaRow = { key: string; updatedAt: number | null };

type Ctx = {
  meta: Record<string, MetaRow>;
  loading: boolean;
  refresh: () => Promise<void>;
};

const DatasetMetaContext = createContext<Ctx>({ meta: {}, loading: true, refresh: async () => {} });

export function DatasetMetaProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = useState<Record<string, MetaRow>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/meta", { cache: "no-store" });
      if (!res.ok) return;
      const { rows } = (await res.json()) as { rows: MetaRow[] };
      const next: Record<string, MetaRow> = {};
      for (const r of rows) next[r.key] = r;
      setMeta(next);
    } catch {
      /* leave stale meta in place */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <DatasetMetaContext.Provider value={{ meta, loading, refresh }}>
      {children}
    </DatasetMetaContext.Provider>
  );
}

export function useDatasetMeta() {
  return useContext(DatasetMetaContext);
}
