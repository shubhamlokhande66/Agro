"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { hydrateAll } from "./hydrate";
import { useDataState } from "./store";

type Ctx = { refresh: () => Promise<void> };
const DataContext = createContext<Ctx>({ refresh: async () => {} });

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const setReady = useDataState((s) => s.setReady);
  const setError = useDataState((s) => s.setError);
  const bump = useDataState((s) => s.bump);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/datasets", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load data (${res.status})`);
      const blobs = (await res.json()) as Record<string, unknown>;
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
