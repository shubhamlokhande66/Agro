"use client";

/** Shared "last updated / by whom" metadata for every dataset, used by the
 *  admin rail and dashboard so they don't each re-fetch it separately. */

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type DatasetMetaRow = { key: string; updatedAt: number | null; updatedBy: string | null };

type Ctx = {
  meta: Record<string, DatasetMetaRow>;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AdminMetaContext = createContext<Ctx>({ meta: {}, loading: true, refresh: async () => {} });

export function AdminMetaProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = useState<Record<string, DatasetMetaRow>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/meta", { cache: "no-store" });
      if (!res.ok) return;
      const { rows } = (await res.json()) as { rows: DatasetMetaRow[] };
      const next: Record<string, DatasetMetaRow> = {};
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
    <AdminMetaContext.Provider value={{ meta, loading, refresh }}>
      {children}
    </AdminMetaContext.Provider>
  );
}

export function useAdminMeta() {
  return useContext(AdminMetaContext);
}
