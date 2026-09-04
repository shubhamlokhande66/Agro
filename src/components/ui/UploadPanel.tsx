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
  /** return the parsed override object + a short summary, or throw */
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
        "card p-4 transition-colors",
        drag && "border-brand-green bg-[#f0fdf4]",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink">{title}</div>
          {hint ? (
            <div className="mt-0.5 text-[11px] text-ink-faint">{hint}</div>
          ) : null}
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
            className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-info bg-info-bg px-3.5 py-2 text-[12px] font-semibold text-info transition-colors hover:bg-[#d0e4f7]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Choose Excel file
          </button>
          {meta ? (
            <button
              type="button"
              onClick={() => {
                clearOverride(storeKey);
                setStatus({ kind: "idle", msg: "" });
              }}
              className="rounded-lg border border-line px-3 py-2 text-[12px] font-medium text-ink-soft hover:bg-surface2"
            >
              Reset to default
            </button>
          ) : null}
        </div>
      </div>

      {status.kind !== "idle" ? (
        <div
          className={clsx(
            "num mt-3 text-[12px]",
            status.kind === "ok" && "text-pos",
            status.kind === "error" && "text-neg",
            status.kind === "loading" && "text-ink-soft",
          )}
        >
          {status.kind === "ok" ? "✓ " : status.kind === "error" ? "✕ " : ""}
          {status.msg}
        </div>
      ) : meta ? (
        <div className="num mt-3 text-[12px] text-pos">
          ✓ Using {meta.fileName}
          {meta.note ? ` — ${meta.note}` : ""}
        </div>
      ) : null}
    </div>
  );
}
