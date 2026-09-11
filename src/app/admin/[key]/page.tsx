"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDatasets } from "@/lib/datasets/provider";
import { datasetMeta } from "@/lib/datasets/registry";
import { SCHEMAS } from "@/lib/datasets/schema";
import { SectionCard } from "@/components/admin/kit";
import { JsonEditor } from "@/components/admin/JsonEditor";
import type { RecordManagerHandle } from "@/components/admin/RecordManager";
import { useAdminMeta } from "@/lib/admin/context";
import { timeAgo } from "@/lib/format";

const AUTOSAVE_DEBOUNCE_MS = 600;

export default function DatasetEditorPage() {
  const { key } = useParams<{ key: string }>();
  const meta = datasetMeta(key);
  const schema = SCHEMAS[key ?? ""];
  const router = useRouter();
  const { refresh } = useDatasets();
  const { meta: adminMeta, refresh: refreshAdminMeta } = useAdminMeta();

  const [orig, setOrig] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "ok" | "err"; msg: string }>({
    kind: "idle",
    msg: "",
  });

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
      await Promise.all([refresh(), refreshAdminMeta()]);
      router.refresh();
      setStatus({ kind: "ok", msg: "Saved — live for everyone" });
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        persist(draftRef.current);
      }
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

  const rowMeta = adminMeta[key];

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
          <div className="flex items-center gap-3">
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
