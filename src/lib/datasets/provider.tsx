"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { hydrateAll } from "./hydrate";
import { useDataState } from "./store";
import { DATASET_KEYS } from "./registry";

type Ctx = { refresh: () => Promise<void> };
const DataContext = createContext<Ctx>({ refresh: async () => {} });

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const setReady = useDataState((s) => s.setReady);
  const setError = useDataState((s) => s.setError);
  const bump = useDataState((s) => s.bump);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/datasets", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to load data (${res.status})`);
      }
      const blobs = (await res.json()) as Record<string, unknown>;
      const present = Object.keys(blobs).filter((k) => blobs[k] != null);

      if (present.length === 0) {
        throw new Error(
          "The database has no datasets yet. Run `npm run db:seed` to load them.",
        );
      }
      const missing = DATASET_KEYS.filter((k) => blobs[k] == null);
      if (missing.length) {
        console.warn(`[data] missing datasets: ${missing.join(", ")}`);
      }

      hydrateAll(blobs);
      bump();
      setReady();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    }
  }, [bump, setReady, setError]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DataContext.Provider value={{ refresh: load }}>{children}</DataContext.Provider>
  );
}

export function useDatasets() {
  return useContext(DataContext);
}

/** subscribe a component to data (re)hydration */
export function useDataVersion() {
  return useDataState((s) => s.version);
}
