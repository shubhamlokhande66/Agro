"use client";

import { useCallback, useEffect, useState } from "react";
import { PageTitle, PANEL } from "@/components/monsoon/ui";
import { useMonsoon } from "@/components/monsoon/data";

type Item = { no: string; date: string; title: string; url: string; severity: "Alert" | "Warning" | "Watch" | "Normal" };

const SEV: Record<Item["severity"], string> = {
  Alert: "border-red-500/30 bg-red-500/5 text-red-400",
  Warning: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  Watch: "border-sky-500/30 bg-sky-500/5 text-sky-400",
  Normal: "border-slate-500/30 bg-slate-500/5 text-slate-300",
};

export default function WeatherReportsPage() {
  const { data } = useMonsoon();
  const pinned = (data?.alerts?.items ?? []).filter((a) => a?.title);
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState("");

  const load = useCallback(() => {
    setError(null);
    fetch("/api/monsoon/reports", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
        setItems(d.items);
        setSource(d.source);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);
  useEffect(load, [load]);

  return (
    <div className="max-w-5xl space-y-6">
      <PageTitle
        icon="☁"
        title="Weather Reports"
        sub={`Latest official IMD press releases${source ? ` · ${source}` : ""}`}
        right={
          <a
            href="https://mausam.imd.gov.in/responsive/all_india_forcast_bulletin.php"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
          >
            All-India forecast bulletin ↗
          </a>
        }
      />

      {pinned.length ? (
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Desk alerts</p>
          {pinned.map((a, i) => (
            <div key={i} className={"rounded-lg border p-3 " + (SEV[a.severity] ?? SEV.Normal)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide">{a.severity}</span>
                <span className="font-mono text-[11px] text-slate-500">{a.date}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-100">{a.title}</p>
              {a.summary ? <p className="mt-1 text-[13px] text-slate-300">{a.summary}</p> : null}
            </div>
          ))}
          <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">IMD press releases</p>
        </div>
      ) : null}

      {error ? (
        <div className={PANEL + " flex flex-col items-center gap-3 p-8"}>
          <p className="text-sm text-slate-400">⚠ {error}</p>
          <button type="button" onClick={load} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">
            Retry
          </button>
        </div>
      ) : !items ? (
        <div className="flex h-48 items-center justify-center gap-3 text-slate-400">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" /> Loading IMD releases…
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => (
            <a
              key={it.no}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className={"block rounded-lg border p-3 transition-opacity hover:opacity-85 " + SEV[it.severity]}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide">{it.severity}</span>
                <span className="font-mono text-[11px] text-slate-500">
                  {it.date} · #{it.no}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-200">{it.title}</p>
              <span className="text-[11px] text-slate-500">Open PDF ↗</span>
            </a>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-600">
        Severity is read from each release's own wording (e.g. "very heavy rainfall" → Warning). Always refer to the IMD PDF for the full text.
      </p>
    </div>
  );
}
