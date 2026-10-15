"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataMissing } from "@/components/ui/DataGuard";
import { STAGE_INFO } from "@/components/calendar/cropStages";
import {
  CAL_MONTHS,
  CROP_STATES,
  PHASE_META,
  currentMonthIdx,
} from "@/data/calendar";

export default function CalendarPage() {
  const N = CAL_MONTHS.length;
  const cur = currentMonthIdx();

  if (!N || !CROP_STATES.length) {
    return <DataMissing title="Crop Calendar" icon="▦" dataset="calendar" />;
  }

  return (
    <div>
      <PageHeader
        title="Crop Calendar"
        icon="▦"
        sub="State-wise cotton phase timeline · May → Feb · sowing to picking"
        dataset="calendar"
      />

      {/* crop stages, in field photographs */}
      <section className="mb-5">
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">Cotton crop stages</h2>
          <span className="text-[11px] text-ink-faint">Typical months across the cotton belt · colours match the timeline below</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(PHASE_META).map(([key, m], i) => {
            const info = STAGE_INFO[key];
            const span = stageMonths(key);
            return (
              <article key={key} className="panel overflow-hidden">
                <div className="relative">
                  {info ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={info.photo.src} alt={info.photo.caption} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <div className="aspect-[4/3] w-full bg-surface-2" />
                  )}
                  <span className="num absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-[11px] font-semibold text-white backdrop-blur-sm">
                    {i + 1}
                  </span>
                  {span ? (
                    <span className="num absolute right-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {span}
                    </span>
                  ) : null}
                  <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: m.color }} />
                </div>
                <div className="p-3">
                  <div className="text-[12.5px] font-semibold leading-tight text-ink">{m.label}</div>
                  {info ? (
                    <>
                      <p className="mt-1 text-[11px] leading-snug text-ink-soft">{info.blurb}</p>
                      <p className="mt-1.5 truncate text-[10px] text-ink-faint" title={`${info.photo.caption} · ${info.photo.place}`}>
                        {info.photo.caption} · {info.photo.place}
                      </p>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* legend */}
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
        {Object.entries(PHASE_META).map(([k, m]) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: m.color }} />
            {m.label}
          </span>
        ))}
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* month header */}
            <div
              className="grid border-b border-line bg-surface-2/60 text-[10px] font-semibold uppercase tracking-wide text-ink-faint"
              style={{ gridTemplateColumns: `170px repeat(${N}, 1fr)` }}
            >
              <div className="px-3 py-2">State</div>
              {CAL_MONTHS.map((m, i) => (
                <div
                  key={m}
                  className={
                    "px-1 py-2 text-center " +
                    (i === cur ? "bg-accent-soft text-accent" : "")
                  }
                >
                  {m}
                </div>
              ))}
            </div>

            {CROP_STATES.map((s) => (
              <div
                key={s.name}
                className="grid items-stretch border-b border-line/70 last:border-0"
                style={{ gridTemplateColumns: `170px repeat(${N}, 1fr)` }}
              >
                <div
                  className="flex items-center gap-2 px-3 py-3"
                  style={{ borderLeft: `3px solid ${s.color}` }}
                >
                  <span className="text-base">{s.flag}</span>
                  <div className="leading-tight">
                    <div className="text-[12px] font-semibold text-ink">{s.name}</div>
                    <div className="num text-[9.5px] text-ink-faint">{s.area}</div>
                  </div>
                </div>

                <div className="relative col-span-full col-start-2 py-2">
                  {/* month gridlines */}
                  <div
                    className="pointer-events-none absolute inset-0 grid"
                    style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}
                  >
                    {CAL_MONTHS.map((_, i) => (
                      <div
                        key={i}
                        className={
                          "border-l border-line/60 " +
                          (i === cur ? "bg-accent-soft/40" : "")
                        }
                      />
                    ))}
                  </div>

                  <div className="relative space-y-1">
                    {s.phases.map((p, i) => {
                      const left = (p.start / N) * 100;
                      const width = ((p.end - p.start) / N) * 100;
                      const meta = PHASE_META[p.key];
                      return (
                        <div key={i} className="relative h-4">
                          <div
                            className="absolute flex h-4 items-center rounded-[4px] px-1.5 text-[8.5px] font-semibold text-white"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              background: meta.color,
                            }}
                            title={meta.label}
                          >
                            <span className="truncate">{meta.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CROP_STATES.map((s) => (
          <div key={s.name} className="panel panel-hover p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{s.flag}</span>
              <div className="text-[13px] font-semibold text-ink">{s.name}</div>
              <span
                className="ml-auto num rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold"
                style={{ background: s.color + "22", color: s.color }}
              >
                {s.season}
              </span>
            </div>
            <dl className="mt-3 space-y-1.5 text-[11.5px]">
              <Row k="Area" v={s.area} />
              <Row k="Variety" v={s.variety} />
              <Row k="Sowing peak" v={s.sowPeak} />
              <Row k="Harvest peak" v={s.harvPeak} />
            </dl>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-soft">{s.notes}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[10.5px] leading-relaxed text-ink-faint">
        Photos via Wikimedia Commons:{" "}
        {Object.entries(PHASE_META).map(([key, m], i, all) => {
          const p = STAGE_INFO[key]?.photo;
          if (!p) return null;
          return (
            <span key={key}>
              {m.label} —{" "}
              <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
                {p.author}
              </a>{" "}
              (
              <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
                {p.license}
              </a>
              ){i < all.length - 1 ? "; " : "."}
            </span>
          );
        })}
      </p>
    </div>
  );
}

/** "Jun–Aug": the earliest start to the latest end of a phase across the states */
function stageMonths(key: string): string | null {
  let start = Infinity;
  let end = -Infinity;
  for (const s of CROP_STATES) {
    for (const p of s.phases) {
      if (p.key !== key) continue;
      start = Math.min(start, p.start);
      end = Math.max(end, p.end);
    }
  }
  if (!Number.isFinite(start)) return null;
  const a = CAL_MONTHS[Math.floor(start)];
  const b = CAL_MONTHS[Math.min(CAL_MONTHS.length - 1, Math.ceil(end) - 1)];
  return a && b ? (a === b ? a : `${a}–${b}`) : null;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-faint">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}
