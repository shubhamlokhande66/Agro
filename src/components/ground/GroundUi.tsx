"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { imageUrl, type GroundPhoto, type Tone } from "@/data/groundReport";

const TONE_CLS: Record<Tone, string> = {
  pos: "bg-pos-soft text-pos ring-pos/25",
  warn: "bg-warn-soft text-warn ring-warn/25",
  neg: "bg-neg-soft text-neg ring-neg/25",
  info: "bg-info-soft text-info ring-info/25",
  flat: "bg-surface-2 text-ink-soft ring-line",
};

/** a small labelled status pill, e.g. CONDITION · Good */
export function StatusChip({ label, value, tone }: { label?: string; value: string; tone: Tone }) {
  if (!value) return <span className="text-[11px] text-ink-faint">—</span>;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold leading-5 ring-1",
        TONE_CLS[tone],
      )}
    >
      {label ? <span className="text-[9px] font-bold uppercase tracking-wide opacity-70">{label}</span> : null}
      {value}
    </span>
  );
}

/** up to three field photos side by side; click one to open the viewer */
export function PhotoStrip({ photos, onOpen }: { photos: GroundPhoto[]; onOpen: (i: number) => void }) {
  if (!photos.length) return null;
  // always thirds, so one photo is the same size as each of three
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {photos.map((p, i) => (
        <figure key={p.id} className="min-w-0">
          <button
            type="button"
            onClick={() => onOpen(i)}
            className="focusable group block w-full overflow-hidden rounded-xl bg-surface-2"
            title="View larger"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(p.id)}
              alt={p.caption || "Field photograph"}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </button>
          {p.caption || p.location ? (
            <figcaption className="mt-1.5 text-[11px] leading-snug text-ink-soft">
              {p.caption}
              {p.location ? <span className="text-ink-faint"> · {p.location}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

/** full-screen photo viewer with previous / next and Esc to close */
export function Lightbox({
  photos,
  start,
  title,
  onClose,
}: {
  photos: GroundPhoto[];
  start: number;
  title: string;
  onClose: () => void;
}) {
  const [i, setI] = useState(start);
  const step = useCallback((d: number) => setI((x) => (x + d + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, step]);

  const p = photos[i];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex flex-col bg-black/90 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 pb-3 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold">{title}</div>
          <div className="num text-[11px] text-white/60">
            {i + 1} / {photos.length}
          </div>
        </div>
        <button type="button" onClick={onClose} className="focusable rounded-lg px-3 py-1.5 text-[13px] text-white/80 hover:bg-white/10">
          Close ✕
        </button>
      </div>
      <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl(p.id)} alt={p.caption || "Field photograph"} className="max-h-full max-w-full rounded-lg object-contain" />
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="focusable absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-xl text-white hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="focusable absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-xl text-white hover:bg-black/70"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
      {p.caption || p.location ? (
        <div className="mx-auto w-full max-w-5xl pt-3 text-center text-[12.5px] text-white/85" onClick={(e) => e.stopPropagation()}>
          {p.caption}
          {p.location ? <span className="text-white/55"> · {p.location}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
