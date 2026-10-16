"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader } from "./Card";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";

const AUTOSAVE_DEBOUNCE_MS = 600;

type Section = "overview" | "overviewWeather" | "overviewSowing" | "overviewProduction" | "overviewBalance" | "sowing" | "production" | "weather" | "balanceSheet" | "cci" | "overviewCci" | "overviewTradeBasis" | "overviewWasde" | "overviewCftc" | "overviewExportSales" | "overviewBenchmarks";

/** A persisted free-text notes panel — "add commentary below the chart" from the
 *  requirements doc. One blob of text per section, shared by everyone who opens the page,
 *  autosaved the same way the admin dataset editor autosaves (debounce, no save button).
 *  Starts collapsed to a single bar (title + last edit); clicking it opens the editor. */
export function CommentsPanel({
  section,
  title = "Notes & commentary",
  minHeight = 320,
  rows = 20,
  autoWrite,
  className,
  pdfTitle,
}: {
  section: Section;
  title?: string;
  minHeight?: number;
  rows?: number;
  /** writes the summary from the latest data — shows a "✨ Auto-write" button to signed-in users */
  autoWrite?: () => Promise<string | null>;
  /** extra classes on the panel, e.g. h-full when it sits beside a card */
  className?: string;
  /** a heading over the text in the PDF report (otherwise the text runs on below the chart untitled) */
  pdfTitle?: string;
}) {
  const { authed, username } = useAuth();
  const [text, setText] = useState("");
  const [orig, setOrig] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ updatedAt: number | null; updatedBy: string | null }>({
    updatedAt: null,
    updatedBy: null,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [open, setOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const [undo, setUndo] = useState<string | null>(null);
  const [autoErr, setAutoErr] = useState<string | null>(null);

  const textRef = useRef(text);
  const origRef = useRef(orig);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  textRef.current = text;
  origRef.current = orig;

  useEffect(() => {
    fetch(`/api/comments/${section}`)
      .then((r) => r.json())
      .then((d) => {
        setText(d.text ?? "");
        setOrig(d.text ?? "");
        setMeta({ updatedAt: d.updatedAt ?? null, updatedBy: d.updatedBy ?? null });
      })
      .catch(() => {});
  }, [section]);

  async function persist(value: string) {
    setStatus("saving");
    try {
      const res = await fetch(`/api/comments/${section}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      if (!res.ok) {
        setStatus("err");
        return;
      }
      const d = await res.json();
      setOrig(value);
      setMeta({ updatedAt: d.updatedAt ?? null, updatedBy: username });
      setStatus("ok");
    } catch {
      setStatus("err");
    }
  }

  useEffect(() => {
    if (orig == null || text === orig) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persist(text), AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (origRef.current != null && textRef.current !== origRef.current) persist(textRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  async function runAutoWrite() {
    if (!autoWrite || writing) return;
    setWriting(true);
    setAutoErr(null);
    try {
      const t = await autoWrite();
      if (t) {
        setUndo(text);
        setText(t);
      } else setAutoErr("Nothing to summarise yet");
    } catch {
      setAutoErr("Couldn't load the latest data — try again");
    } finally {
      setWriting(false);
    }
  }

  // auto-write (and undo it) — signed-in users only, never in the PDF
  const autoButtons =
    authed && autoWrite ? (
      <span className="print-hide flex shrink-0 items-center gap-1.5">
        {autoErr ? <span className="text-[11px] text-neg">{autoErr}</span> : null}
        {undo != null && !writing ? (
          <button
            type="button"
            onClick={() => {
              setText(undo);
              setUndo(null);
            }}
            className="focusable rounded-lg border border-line px-2.5 py-1 text-[11.5px] font-semibold text-ink-soft hover:bg-surface-2"
          >
            ↶ Undo
          </button>
        ) : null}
        <button
          type="button"
          onClick={runAutoWrite}
          disabled={writing}
          title="Write this summary from the latest data (you can edit it afterwards)"
          className="focusable rounded-lg border border-line px-2.5 py-1 text-[11.5px] font-semibold text-accent hover:bg-surface-2 disabled:opacity-60"
        >
          {writing ? "Writing…" : "✨ Auto-write"}
        </button>
      </span>
    ) : null;

  const lastEdited =
    meta.updatedAt != null
      ? `Last edited ${timeAgo(meta.updatedAt)}${meta.updatedBy ? ` by ${meta.updatedBy}` : ""}`
      : "No notes yet";

  if (!open) {
    // the written commentary is shown as-is (it goes into the PDF report too); an empty panel is
    // left out of the PDF
    const hasText = text.trim().length > 0;
    return (
      <div className={"comment-panel panel px-4 py-3" + (hasText ? "" : " print-hide") + (className ? ` ${className}` : "")}>
        {pdfTitle ? <h3 className="pdf-only mb-1 text-[14px] font-bold text-[#1f2a44]">{pdfTitle}</h3> : null}
        {/* the panel's title bar and buttons are dashboard chrome — left out of the PDF */}
        <div className="print-hide flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden className="text-[14px]">📝</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold tracking-tight text-ink">{title}</span>
              <span className="print-hide block truncate text-[11px] text-ink-faint">{lastEdited}</span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
          {autoButtons}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            className="focusable print-hide shrink-0 rounded-lg border border-line px-2.5 py-1 text-[11.5px] font-semibold text-accent hover:bg-surface-2"
          >
            {authed ? (hasText ? "Edit ▾" : "Add commentary ▾") : "Show ▾"}
          </button>
          </span>
        </div>
        {hasText ? <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink">{text}</p> : null}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader
        title={title}
        sub={lastEdited}
        right={
          <span className="flex items-center gap-2.5">
          <span
            className={
              "text-[11px] font-medium " +
              (status === "saving"
                ? "text-ink-faint"
                : status === "ok"
                  ? "text-pos"
                  : status === "err"
                    ? "text-neg"
                    : "text-transparent")
            }
          >
            {status === "saving" ? "Saving…" : status === "ok" ? "✓ Saved" : status === "err" ? "⚠ Save failed" : "·"}
          </span>
          {autoButtons}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-expanded
            className="focusable rounded-lg border border-line px-2.5 py-1 text-[11.5px] font-semibold text-ink-soft hover:bg-surface-2"
          >
            Hide ▴
          </button>
          </span>
        }
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={!authed}
        placeholder={authed ? "Add commentary…" : "Sign in to add commentary."}
        autoFocus={authed}
        rows={rows}
        style={{ minHeight }}
        className="w-full resize-y rounded-xl border border-line bg-surface-2/40 p-3 text-[12.5px] leading-relaxed text-ink outline-none focusable placeholder:text-ink-faint"
      />
    </Card>
  );
}
