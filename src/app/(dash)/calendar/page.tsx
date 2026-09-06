"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataMissing } from "@/components/ui/DataGuard";
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
      />

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
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-faint">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}
