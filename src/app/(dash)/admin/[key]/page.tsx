"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/auth";
import { useDatasets } from "@/lib/datasets/provider";
import { datasetMeta } from "@/lib/datasets/registry";
import { JsonEditor } from "@/components/admin/JsonEditor";
import {
  GridEditor,
  arrivalsAdapter,
  sowingAdapter,
  type Grid,
} from "@/components/admin/GridEditor";

const GRID_ADAPTERS: Record<string, { toGrid: (b: any) => Grid; fromGrid: (g: Grid, prev: any) => any }> = {
  arrivals: arrivalsAdapter,
  sowing: sowingAdapter,
};

export default function DatasetEditorPage() {
  const { key } = useParams<{ key: string }>();
  const meta = datasetMeta(key);
  const router = useRouter();
  const { ready, isAdmin } = useAuth();
  const { refresh } = useDatasets();

  const [orig, setOrig] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);
  const [mode, setMode] = useState<"form" | "json">("form");
  const [raw, setRaw] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "ok" | "err"; msg: string }>({
    kind: "idle",
    msg: "",
  });

  useEffect(() => {
    if (ready && !isAdmin) router.replace("/");
  }, [ready, isAdmin, router]);

  useEffect(() => {
    fetch(`/api/datasets/${key}`)
      .then((r) => r.json())
      .then((row) => {
        setOrig(row.data);
        setDraft(structuredClone(row.data));
        setRaw(JSON.stringify(row.data, null, 2));
      })
      .catch(() => setStatus({ kind: "err", msg: "Failed to load dataset" }));
  }, [key]);

  const adapter = GRID_ADAPTERS[key ?? ""];
  const grid = useMemo(
    () => (adapter && draft ? adapter.toGrid(draft) : null),
    [adapter, draft],
  );

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(orig),
    [draft, orig],
  );

  if (!ready || !isAdmin) return null;
  if (!meta) return <div className="text-sm text-ink-faint">Unknown dataset.</div>;

  async function save() {
    let payload = draft;
    if (mode === "json") {
      try {
        payload = JSON.parse(raw);
      } catch {
        setStatus({ kind: "err", msg: "Invalid JSON — fix syntax before saving" });
        return;
      }
    }
    setStatus({ kind: "saving", msg: "Saving…" });
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
    setDraft(structuredClone(payload));
    setRaw(JSON.stringify(payload, null, 2));
    await refresh();
    router.refresh();
    setStatus({ kind: "ok", msg: "Saved — live for everyone" });
  }

  return (
    <div>
      <div className="mb-2">
        <Link href="/admin" className="text-[11px] font-semibold text-accent hover:underline">
          ← All datasets
        </Link>
      </div>
      <PageHeader
        title={meta.label}
        icon="⚙"
        sub={meta.description}
        right={
          <div className="flex items-center gap-2">
            {!adapter ? (
              <div className="inline-flex rounded-xl bg-surface-2 p-1">
                {(["form", "json"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      if (m === "json") setRaw(JSON.stringify(draft, null, 2));
                      else {
                        try {
                          setDraft(JSON.parse(raw));
                        } catch {
                          /* keep draft */
                        }
                      }
                      setMode(m);
                    }}
                    className={
                      "rounded-lg px-3 py-1 text-[11.5px] font-semibold " +
                      (mode === m ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-faint")
                    }
                  >
                    {m === "form" ? "Form" : "JSON"}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              disabled={!dirty || status.kind === "saving"}
              onClick={save}
              className="rounded-xl bg-accent px-4 py-2 text-[12.5px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:opacity-50"
            >
              {status.kind === "saving" ? "Saving…" : "Save changes"}
            </button>
          </div>
        }
      />

      {status.kind !== "idle" ? (
        <div
          className={
            "mb-3 rounded-xl px-3.5 py-2 text-[12px] font-medium ring-1 " +
            (status.kind === "ok"
              ? "bg-pos-soft text-pos ring-pos/20"
              : status.kind === "err"
                ? "bg-neg-soft text-neg ring-neg/20"
                : "bg-surface-2 text-ink-soft ring-line")
          }
        >
          {status.msg}
        </div>
      ) : null}

      {draft == null ? (
        <div className="text-sm text-ink-faint">Loading…</div>
      ) : adapter && grid ? (
        <GridEditor grid={grid} onChange={(g) => setDraft(adapter.fromGrid(g, draft))} />
      ) : mode === "json" ? (
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          spellCheck={false}
          className="num h-[64vh] w-full rounded-xl border border-line bg-surface p-3 text-[12px] leading-relaxed text-ink outline-none focus:border-accent"
        />
      ) : (
        <JsonEditor value={draft} onChange={setDraft} />
      )}
    </div>
  );
}
