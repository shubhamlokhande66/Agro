"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { useDataStore } from "@/lib/store";
import { readWorkbook } from "@/lib/xlsx";
import type { WorkBook } from "xlsx";

type Status = { kind: "idle" | "loading" | "ok" | "error"; msg: string };

export function UploadPanel({
  storeKey,
  title = "Update data from Excel",
  hint,
  parse,
}: {
  storeKey: string;
  title?: string;
  hint?: string;
  parse: (wb: WorkBook) => { data: unknown; summary: string };
}) {
  const { canUpload } = useAuth();
  const setOverride = useDataStore((s) => s.setOverride);
  const clearOverride = useDataStore((s) => s.clearOverride);
  const meta = useDataStore((s) => s.meta[storeKey]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle", msg: "" });
  const [drag, setDrag] = useState(false);

  if (!canUpload) return null;

  async function handle(file: File | undefined) {
    if (!file) return;
    setStatus({ kind: "loading", msg: `Reading ${file.name}…` });
    try {
      const wb = await readWorkbook(file);
      const { data, summary } = parse(wb);
      setOverride(storeKey, data, { fileName: file.name, note: summary });
      setStatus({ kind: "ok", msg: summary });
    } catch (err) {
      setStatus({
        kind: "error",
        msg: err instanceof Error ? err.message : "Could not read that file.",
      });
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files?.[0]);
      }}
      className={clsx(
        "panel flex flex-wrap items-center gap-3 border-dashed p-3.5 transition-colors",
        drag ? "border-accent bg-accent-soft" : "border-line-strong",
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-base">
        📄
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink">{title}</div>
        <div className="text-[11px] text-ink-faint">
          {status.kind === "error" ? (
            <span className="text-neg">{status.msg}</span>
          ) : status.kind === "ok" || meta ? (
            <span className="text-pos">
              ✓ {meta?.fileName ?? "loaded"}
              {status.msg ? ` — ${status.msg}` : meta?.note ? ` — ${meta.note}` : ""}
            </span>
          ) : status.kind === "loading" ? (
            <span>{status.msg}</span>
          ) : (
            hint ?? "Drop an .xlsx file or choose one — admin only"
          )}
        </div>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="focusable rounded-xl bg-accent px-3.5 py-2 text-[12px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong"
        >
          Choose file
        </button>
        {meta ? (
          <button
            type="button"
            onClick={() => {
              clearOverride(storeKey);
              setStatus({ kind: "idle", msg: "" });
            }}
            className="focusable rounded-xl border border-line px-3 py-2 text-[12px] font-medium text-ink-soft hover:bg-surface-2"
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}
