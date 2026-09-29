"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Subdivision } from "@/lib/monsoon/constants";
import type { AlertsBlob, HistoryBlob, WeightsBlob } from "@/lib/monsoon/config";

export type MonthValue = { year: number; month: number; value: number };
export type PlantingRow = {
  crop: string;
  category: string;
  normal: number;
  thisYear: number;
  lastYear: number;
  difference: number;
  pctChange: number;
};

export type MonsoonData = {
  imd: { subdivisions: Subdivision[]; source: string; asOfDate: string | null } | null;
  enso: {
    nino: { monthly: MonthValue[]; latest: MonthValue | null; source: string };
    iod: { monthly: MonthValue[]; latest: MonthValue | null; source: string };
    asOfDate: string | null;
    fetchedAt: number;
  } | null;
  planting: { asOnDate: string; source: string; rows: PlantingRow[] };
  weights: WeightsBlob;
  history: HistoryBlob;
  alerts: AlertsBlob;
  isAdmin: boolean;
};

type Ctx = { data: MonsoonData | null; loading: boolean; error: string | null; reload: () => void };
const MonsoonContext = createContext<Ctx | null>(null);

/** loads everything the Weather dashboard shows once, shared by all its pages */
export function MonsoonDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MonsoonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/monsoon/data", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
        setData(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load monsoon data"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);
  return <MonsoonContext.Provider value={{ data, loading, error, reload }}>{children}</MonsoonContext.Provider>;
}

export function useMonsoon() {
  const ctx = useContext(MonsoonContext);
  if (!ctx) throw new Error("useMonsoon must be used inside <MonsoonDataProvider>");
  return ctx;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthLabel = (m: MonthValue | null) => (m ? `${MONTHS[m.month - 1]} ${m.year}` : "—");
export const isoDate = (s: string | null) =>
  s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : s ?? "—";
