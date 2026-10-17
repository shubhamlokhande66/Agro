"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { hydrateSugar } from "@/data/sugar/sample";

type Ctx = { ready: boolean; version: number; reload: () => Promise<void> };
const SugarDataContext = createContext<Ctx>({ ready: false, version: 0, reload: async () => {} });

/** loads the sugar datasets into the sugar data module; pages re-render when `version` changes */
export function SugarDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);
  const reload = useCallback(async () => {
    try {
      const r = await fetch("/api/sugar/data", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        hydrateSugar(d.datasets ?? {}, d.updated ?? {}, d.crude);
      }
    } catch {
      // offline — keep what's loaded (the sample values at first)
    }
    setVersion((v) => v + 1);
    setReady(true);
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  return <SugarDataContext.Provider value={{ ready, version, reload }}>{children}</SugarDataContext.Provider>;
}

export const useSugarData = () => useContext(SugarDataContext);
