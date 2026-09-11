"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDatasets } from "@/lib/datasets/provider";
import { datasetMeta } from "@/lib/datasets/registry";
import { SCHEMAS } from "@/lib/datasets/schema";
import { SectionCard } from "@/components/admin/kit";
import { JsonEditor } from "@/components/admin/JsonEditor";
import { useAdminMeta } from "@/lib/admin/context";
import { timeAgo } from "@/lib/format";

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

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(orig), [draft, orig]);

  if (!meta) return <div className="text-sm text-ink-faint">Unknown dataset.</div>;

  const rowMeta = adminMeta[key];

  async function save() {
    setStatus({ kind: "saving", msg: "Saving…" });
    const res = await fetch(`/api/datasets/${key}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setStatus({ kind: "err", msg: e.error ?? `Save failed (${res.status})` });
      return;
    }
    setOrig(structuredClone(draft));
    await Promise.all([refresh(), refreshAdminMeta()]);
    router.refresh();
    setStatus({ kind: "ok", msg: "Saved — live for everyone" });
  }

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
          <button
            type="button"
            disabled={!dirty || status.kind === "saving"}
            onClick={save}
            className="rounded-xl bg-accent px-4 py-2 text-[12.5px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:opacity-50"
          >
            {status.kind === "saving" ? "Saving…" : "Save changes"}
          </button>
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

      {dirty ? (
        <div className="mb-3 rounded-xl bg-warn-soft px-3.5 py-2 text-[12px] font-medium text-warn ring-1 ring-warn/20">
          Unsaved changes — click “Save changes” to publish.
        </div>
      ) : null}

      {draft == null ? (
        <div className="text-sm text-ink-faint">Loading…</div>
      ) : schema ? (
        <div className="space-y-4">
          {schema.map((s) => (
            <SectionCard key={s.id} title={s.title} hint={s.hint}>
              {s.render(draft, setDraft)}
            </SectionCard>
          ))}
        </div>
      ) : (
        <JsonEditor value={draft} onChange={setDraft} />
      )}
    </div>
  );
}
