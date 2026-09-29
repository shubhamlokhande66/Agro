"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader } from "./Card";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";

const AUTOSAVE_DEBOUNCE_MS = 600;

type Section = "overview" | "overviewWeather" | "overviewSowing" | "overviewProduction" | "overviewBalance" | "sowing" | "production" | "weather" | "balanceSheet" | "cci";

/** A persisted free-text notes panel — "add commentary below the chart" from the
 *  requirements doc. One blob of text per section, shared by everyone who opens the page,
 *  autosaved the same way the admin dataset editor autosaves (debounce, no save button).
 *  Starts collapsed to a single bar (title + last edit); clicking it opens the editor. */
export function CommentsPanel({
  section,
  title = "Notes & commentary",
  minHeight = 320,
  rows = 20,
}: {
  section: Section;
  title?: string;
  minHeight?: number;
  rows?: number;
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

  const lastEdited =
    meta.updatedAt != null
      ? `Last edited ${timeAgo(meta.updatedAt)}${meta.updatedBy ? ` by ${meta.updatedBy}` : ""}`
      : "No notes yet";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="panel panel-hover focusable flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className="text-[14px]">📝</span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold tracking-tight text-ink">{title}</span>
            <span className="block truncate text-[11px] text-ink-faint">{lastEdited}</span>
          </span>
        </span>
        <span className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-[11.5px] font-semibold text-accent">
          Show ▾
        </span>
      </button>
    );
  }

  return (
    <Card>
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
