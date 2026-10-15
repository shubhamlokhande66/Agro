"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { CAL_MONTHS, CROP_STATES, PHASE_META } from "@/data/calendar";
import { STAGE_INFO } from "./cropStages";

type Status = "done" | "active" | "upcoming";
type Stage = { key: string; label: string; color: string; start: number; end: number; months: string; status: Status };

/** month names "Jun–Aug" for a span of calendar-month positions (May = 0) */
function monthsOf(start: number, end: number): string {
  const a = CAL_MONTHS[Math.max(0, Math.floor(start))];
  const b = CAL_MONTHS[Math.min(CAL_MONTHS.length - 1, Math.max(0, Math.ceil(end) - 1))];
  return a && b ? (a === b ? a : `${a}–${b}`) : "";
}

/** where today sits on the May→Feb calendar (May 1 = 0, Mar 1 = 10); -1 before the season (Mar–Apr) */
function seasonPosition(now = new Date()): number {
  const pos = (now.getMonth() - 4 + 12) % 12; // May = 0 … Apr = 11
  if (pos >= CAL_MONTHS.length) return -1;
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return pos + (now.getDate() - 1) / days;
}

/** "2026-27": the season running May→Feb (Mar–Apr belongs to the season about to start) */
function seasonLabel(now = new Date()): string {
  const y = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

/** market sales run alongside the pickings, so they don't move the progress line */
const PARALLEL = new Set(["msp"]);

/**
 * The season as a progress timeline: one photo tile per crop stage, joined by a line that fills to
 * today's position. Stage windows are the average across the states in the calendar data.
 */
export function StageTimeline() {
  const t = seasonPosition();
  const stages: Stage[] = useMemo(
    () =>
      Object.entries(PHASE_META).map(([key, m]) => {
        const ps = CROP_STATES.flatMap((s) => s.phases.filter((p) => p.key === key));
        const avg = (f: "start" | "end") => (ps.length ? ps.reduce((a, p) => a + p[f], 0) / ps.length : 0);
        const lo = ps.length ? Math.min(...ps.map((p) => p.start)) : 0;
        const hi = ps.length ? Math.max(...ps.map((p) => p.end)) : 0;
        const start = avg("start");
        const end = avg("end");
        const status: Status = t < 0 || t < start ? "upcoming" : t >= end ? "done" : "active";
        return { key, label: m.label, color: m.color, start, end, months: monthsOf(lo, hi), status };
      }),
    [t],
  );

  // the progress line: up to the furthest sequential stage that has started, plus the share of the way to the next
  const seq = stages.map((s, i) => ({ ...s, i })).filter((s) => !PARALLEL.has(s.key));
  const startedIdx = seq.filter((s) => s.status !== "upcoming").at(-1);
  const now = startedIdx ?? null; // the main "current" stage
  const nextSeq = now ? seq.find((s) => s.i > now.i) : undefined;
  const frac = now && nextSeq ? Math.min(1, Math.max(0, (t - now.start) / Math.max(0.01, nextSeq.start - now.start))) : now ? 1 : 0;
  const lineEnd = now ? (nextSeq ? now.i + frac * (nextSeq.i - now.i) : now.i) : 0;

  const [selected, setSelected] = useState<string | null>(null);
  // on narrow screens the stepper scrolls sideways — open it with the current stage in view
  const scroller = useRef<HTMLDivElement>(null);
  const nowTile = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const box = scroller.current;
    const tile = nowTile.current;
    if (!box || !tile || box.scrollWidth <= box.clientWidth) return;
    box.scrollLeft = tile.offsetLeft - (box.clientWidth - tile.offsetWidth) / 2;
  }, []);
  const sel = stages.find((s) => s.key === (selected ?? now?.key ?? stages[0]?.key)) ?? stages[0];
  const info = sel ? STAGE_INFO[sel.key] : undefined;
  const n = stages.length;
  const asOf = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  if (!n) return null;
  return (
    <section className="panel mb-5 overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-4 sm:px-5">
        <h2 className="text-[16px] font-semibold tracking-tight text-ink sm:text-[18px]">
          Cotton Progress and Timeline {seasonLabel()}
        </h2>
        <span className="num text-[11px] text-ink-faint">
          {t < 0 ? "Season starts in May" : `As of ${asOf}`} · typical stages across the cotton belt
        </span>
      </div>

      {/* the stepper */}
      <div ref={scroller} className="overflow-x-auto px-4 pb-4 pt-6 sm:px-5">
        <div className="relative min-w-[760px]">
          {/* track + progress, running through the tile centres */}
          <div
            className="absolute top-[44px] h-[3px] rounded-full bg-line"
            style={{ left: `${50 / n}%`, right: `${50 / n}%` }}
          />
          <div
            className="absolute top-[44px] h-[3px] rounded-full bg-accent transition-[width] duration-700"
            style={{ left: `${50 / n}%`, width: `${(lineEnd / n) * 100}%` }}
          />

          <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {stages.map((s, i) => {
              const photo = STAGE_INFO[s.key]?.photo;
              const isNow = now?.key === s.key;
              const isSel = sel?.key === s.key;
              return (
                <li key={s.key} ref={isNow ? nowTile : undefined} className="flex flex-col items-center px-1 text-center">
                  <button
                    type="button"
                    onClick={() => setSelected(s.key)}
                    aria-pressed={isSel}
                    title={`${s.label} · ${s.months}`}
                    className={clsx(
                      "focusable group relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-2xl bg-surface-2 transition-all",
                      s.status === "active" ? "ring-[3px] ring-accent shadow-lg" : "ring-1 ring-line",
                      isSel && s.status !== "active" && "ring-2 ring-ink-soft",
                      "hover:-translate-y-0.5",
                    )}
                  >
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.src}
                        alt={s.label}
                        className={clsx(
                          "h-full w-full object-cover transition-all duration-300",
                          s.status === "upcoming" && "opacity-60 grayscale group-hover:opacity-90 group-hover:grayscale-0",
                        )}
                      />
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: s.color }} />
                    {s.status === "done" ? (
                      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-contrast shadow">
                        ✓
                      </span>
                    ) : null}
                    <span className="num absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/55 text-[10px] font-semibold text-white">
                      {i + 1}
                    </span>
                  </button>
                  {isNow ? (
                    <span className="mt-2 rounded-full bg-accent px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-accent-contrast">
                      Now
                    </span>
                  ) : s.status === "active" ? (
                    <span className="mt-2 rounded-full bg-accent-soft px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-accent">
                      Under way
                    </span>
                  ) : (
                    <span className="mt-2 h-[19px]" />
                  )}
                  <div className={clsx("mt-1 text-[12.5px] font-semibold leading-tight", s.status === "upcoming" ? "text-ink-soft" : "text-ink")}>
                    {s.label}
                  </div>
                  <div className="num mt-0.5 text-[11px] text-ink-faint">{s.months}</div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* selected stage */}
      {sel && info ? (
        <div className="grid gap-4 border-t border-line bg-surface-2/50 p-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={info.photo.src} alt={info.photo.caption} className="aspect-[4/3] w-full rounded-xl object-cover" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: sel.color }} />
              <h3 className="text-[15px] font-semibold tracking-tight text-ink">{sel.label}</h3>
              <span className="num rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-soft ring-1 ring-line">{sel.months}</span>
              <span
                className={clsx(
                  "rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold",
                  sel.status === "done" && "bg-pos-soft text-pos",
                  sel.status === "active" && "bg-accent-soft text-accent",
                  sel.status === "upcoming" && "bg-surface text-ink-faint ring-1 ring-line",
                )}
              >
                {sel.status === "done" ? "Completed" : sel.status === "active" ? "Under way" : "Upcoming"}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink">{info.blurb}</p>
            <p className="mt-2 text-[11px] text-ink-faint">
              Photo: {info.photo.caption} · {info.photo.place}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
