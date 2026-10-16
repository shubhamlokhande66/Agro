"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { datasetMeta } from "@/lib/datasets/registry";
import { SCHEMAS } from "@/lib/datasets/schema";
import { SectionCard } from "@/components/admin/kit";
import { JsonEditor } from "@/components/admin/JsonEditor";
import type { RecordManagerHandle } from "@/components/admin/RecordManager";
import { timeAgo } from "@/lib/format";

const AUTOSAVE_DEBOUNCE_MS = 600;

/** datasets that can pull fresh data from an outside source on demand (same endpoints the cron jobs hit) */
const SYNC_SOURCES: Record<string, { source: string; url: string; label: string; title: string }> = {
  prices: {
    source: "CAI",
    url: "/api/cron/cai-spot-rates",
    label: "⟳ Sync CAI rates",
    title: "Fetch the latest CAI upcountry spot rates (last 7 days) into Guj / MMA / CS / PHR varieties",
  },
  international: {
    source: "ICE",
    url: "/api/cron/ice-futures",
    label: "⟳ Sync ICE cotton & Brent",
    title: "Fetch ICE Cotton No. 2 and Brent settlements (most-active contracts, last ~3 months) into the daily + monthly series",
  },
  currency: {
    source: "RBI",
    url: "/api/cron/rbi-usd",
    label: "⟳ Sync RBI USD/INR",
    title: "Fetch the RBI USD/INR reference rate (last ~400 days) and rebuild the daily + monthly USD/INR series",
  },
};

/**
 * The dataset editor shared by both admin areas (cotton /admin and weather /monsoon/admin):
 * schema-driven sections, autosave, and — for datasets with an outside source — a Sync button.
 */
export function DatasetEditor({
  datasetKey: key,
  onSaved,
  rowMeta,
}: {
  datasetKey: string;
  /** refresh whatever the host area shows after a save or sync */
  onSaved?: () => Promise<unknown> | void;
  /** last-updated info for the header */
  rowMeta?: { updatedAt: number | null; updatedBy: string | null };
}) {
  const meta = datasetMeta(key);
  const schema = SCHEMAS[key ?? ""];

  const [orig, setOrig] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "ok" | "err"; msg: string }>({
    kind: "idle",
    msg: "",
  });

  const [sync, setSync] = useState<{ busy: boolean; msg: string; err?: boolean }>({ busy: false, msg: "" });

  const adderRef = useRef<RecordManagerHandle>(null);
  const primarySection = schema?.find((s) => s.primaryAdd);

  // refs so the debounce timer and unmount-flush always see the latest values
  const draftRef = useRef<any>(null);
  const origRef = useRef<any>(null);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  draftRef.current = draft;
  origRef.current = orig;

  useEffect(() => {
    setOrig(null);
    setDraft(null);
    setStatus({ kind: "idle", msg: "" });
    fetch(`/api/datasets/${key}`)
      .then((r) => r.json())
      .then((row) => {
        setOrig(row.data);
        setDraft(structuredClone(row.data));
      })
      .catch(() => setStatus({ kind: "err", msg: "Failed to load dataset" }));
  }, [key]);

  async function persist(payload: any) {
    savingRef.current = true;
    setStatus({ kind: "saving", msg: "Saving…" });
    try {
      const res = await fetch(`/api/datasets/${key}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setStatus({ kind: "err", msg: e.error ?? `Save failed (${res.status})` });
        return;
      }
      setOrig(structuredClone(payload));
      await onSaved?.();
      setStatus({ kind: "ok", msg: "Saved — live for everyone" });
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        persist(draftRef.current);
      }
    }
  }

  const syncSource = SYNC_SOURCES[key ?? ""];

  /** pull the latest outside data now (same sync the cron runs), then reload the editor */
  async function syncNow() {
    if (!syncSource) return;
    setSync({ busy: true, msg: `Syncing ${syncSource.source}…` });
    try {
      // save pending edits first so the server-side merge doesn't drop them
      if (timerRef.current) clearTimeout(timerRef.current);
      if (JSON.stringify(draftRef.current) !== JSON.stringify(origRef.current)) await persist(draftRef.current);

      const res = await fetch(syncSource.url, { cache: "no-store" });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) {
        setSync({ busy: false, msg: out.error ?? `Sync failed (${res.status})`, err: true });
        return;
      }
      const added: string[] = out.dates.filter((d: any) => d.status === "added").map((d: any) => d.date);
      if (out.saved) {
        const row = await fetch(`/api/datasets/${key}`, { cache: "no-store" }).then((r) => r.json());
        setOrig(row.data);
        setDraft(structuredClone(row.data));
        await onSaved?.();
      }
      const from = syncSource.source + (out.contract ? ` ${out.contract}` : "");
      setSync({
        busy: false,
        msg: !added.length
          ? `✓ Already up to date with ${from}`
          : added.length <= 5
            ? `✓ Added ${from} for ${added.join(", ")}`
            : `✓ Added/updated ${added.length} days from ${from}`,
      });
    } catch {
      setSync({ busy: false, msg: "Sync failed — check connection", err: true });
    }
  }

  // auto-save: whenever the draft changes (an add/edit/delete in a popup, or any
  // other field), save shortly after things go quiet — no manual button needed.
  useEffect(() => {
    if (draft == null || orig == null) return;
    if (JSON.stringify(draft) === JSON.stringify(orig)) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (savingRef.current) pendingRef.current = true;
      else persist(draft);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // flush a pending change immediately when leaving this dataset (route change / unmount)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (origRef.current != null && JSON.stringify(draftRef.current) !== JSON.stringify(origRef.current)) {
        persist(draftRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!meta) return <div className="text-sm text-ink-faint">Unknown dataset.</div>;


  return (
    <div>
      <PageHeader
        title={meta.label}
        icon="⚙"
        sub={
          <>
            {meta.description}
            {rowMeta ? (
              <>
                {" "}
                · updated {timeAgo(rowMeta.updatedAt)}
                {rowMeta.updatedBy ? ` by ${rowMeta.updatedBy}` : ""}
              </>
            ) : null}
            {" · "}
            <Link href={meta.route} className="text-accent hover:underline">
              View live page ↗
            </Link>
          </>
        }
        right={
          <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3">
            <span
              className={
                "text-[11.5px] font-medium " +
                (status.kind === "saving"
                  ? "text-ink-faint"
                  : status.kind === "ok"
                    ? "text-pos"
                    : status.kind === "err"
                      ? "text-neg"
                      : "text-ink-faint")
              }
            >
              {status.kind === "saving"
                ? "Saving…"
                : status.kind === "ok"
                  ? "✓ Saved"
                  : status.kind === "err"
                    ? `⚠ ${status.msg}`
                    : ""}
            </span>
            {status.kind === "err" ? (
              <button
                type="button"
                onClick={() => persist(draftRef.current)}
                className="rounded-xl bg-neg-soft px-3 py-2 text-[11.5px] font-semibold text-neg hover:opacity-80"
              >
                Retry save
              </button>
            ) : null}
            {syncSource ? (
              <>
                {sync.msg ? (
                  <span className={"text-[11.5px] font-medium " + (sync.err ? "text-neg" : sync.busy ? "text-ink-faint" : "text-pos")}>
                    {sync.msg}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={syncNow}
                  disabled={sync.busy || draft == null}
                  title={syncSource.title}
                  className="rounded-xl border border-line px-3.5 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
                >
                  {sync.busy ? "Syncing…" : syncSource.label}
                </button>
              </>
            ) : null}
            {primarySection ? (
              <button
                type="button"
                onClick={() => adderRef.current?.openAdd()}
                className="rounded-xl bg-accent px-4 py-2 text-[12.5px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong"
              >
                + {primarySection.primaryAdd!.label}
              </button>
            ) : null}
          </div>
        }
      />

      {draft == null ? (
        <div className="text-sm text-ink-faint">Loading…</div>
      ) : schema ? (
        <div className="space-y-4">
          {schema.map((s) => (
            <SectionCard key={s.id} title={s.title} hint={s.hint}>
              {s.render(draft, setDraft, s.primaryAdd ? adderRef : undefined)}
            </SectionCard>
          ))}
        </div>
      ) : (
        <JsonEditor value={draft} onChange={setDraft} />
      )}
    </div>
  );
}
