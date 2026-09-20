"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader } from "./Card";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";

const AUTOSAVE_DEBOUNCE_MS = 600;

type Section = "overview" | "sowing" | "production" | "weather" | "balanceSheet" | "cci";

/** A persisted free-text notes panel — "add commentary below the chart" from the
 *  requirements doc. One blob of text per section, shared by everyone who opens the page,
 *  autosaved the same way the admin dataset editor autosaves (debounce, no save button). */
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

  return (
    <Card>
      <CardHeader
        title={title}
        sub={
          meta.updatedAt != null
            ? `Last edited ${timeAgo(meta.updatedAt)}${meta.updatedBy ? ` by ${meta.updatedBy}` : ""}`
            : "No notes yet"
        }
        right={
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
        }
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={!authed}
        placeholder={authed ? "Add commentary…" : "Sign in to add commentary."}
        rows={rows}
        style={{ minHeight }}
        className="w-full resize-y rounded-xl border border-line bg-surface-2/40 p-3 text-[12.5px] leading-relaxed text-ink outline-none focusable placeholder:text-ink-faint"
      />
    </Card>
  );
}
