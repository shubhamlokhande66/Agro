"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { loadCottonBelt } from "@/lib/autoCommentary";
import type { CottonBelt } from "@/lib/server/cottonBelt";

const MAPS = [
  { value: "india", label: "India" },
  { value: "central", label: "Central" },
  { value: "northwest", label: "North-West" },
  { value: "south", label: "South" },
] as const;
type MapKey = (typeof MAPS)[number]["value"];

const dayMonth = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const weekday = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2);
const span = (days: string[]) => (days.length ? `${dayMonth(days[0])}–${dayMonth(days.at(-1)!)}` : "");

/** blue shades by daily rain (mm) */
function rainCell(mm: number | null) {
  if (mm == null) return { bg: "transparent", fg: "var(--ink-faint, #94a3b8)" };
  if (mm < 0.5) return { bg: "rgba(148,163,184,0.12)", fg: "#94a3b8" };
  if (mm < 2.5) return { bg: "#dbeafe", fg: "#1e3a8a" };
  if (mm < 10) return { bg: "#93c5fd", fg: "#1e3a8a" };
  if (mm < 25) return { bg: "#3b82f6", fg: "#fff" };
  return { bg: "#1d4ed8", fg: "#fff" };
}
const totalTone = (mm: number | null) => (mm == null ? "text-ink-faint" : mm >= 25 ? "text-[#1d4ed8]" : mm >= 5 ? "text-ink" : "text-[#b45309]");
const fmtMm = (mm: number | null) => (mm == null ? "—" : mm < 0.5 ? "0" : mm < 10 ? mm.toFixed(1) : Math.round(mm).toString());

/** IMD's weekly district rainfall map + last-7-day and 7-day-forecast rain for each cotton state */
export function CottonBeltRain() {
  const [map, setMap] = useState<MapKey>("india");
  const [mapFailed, setMapFailed] = useState<string | null>(null);
  const [data, setData] = useState<CottonBelt | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    loadCottonBelt()
      .then(setData)
      .catch(() => setErr(true));
  }, []);

  const src = `/api/weather/imd-map?map=${map}`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="Weekly rainfall map · IMD"
          sub="District-wise rainfall in the latest IMD week (Thu–Wed) · % departure from normal"
          right={
            <span className="print-hide">
              <Tabs options={MAPS.map((m) => ({ value: m.value, label: m.label }))} value={map} onChange={setMap} />
            </span>
          }
        />
        {mapFailed === src ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
            <p className="text-[12px] text-ink-faint">The IMD map server isn&apos;t responding right now.</p>
            <a
              href="https://mausam.imd.gov.in/responsive/rainfallinformation.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold text-accent hover:underline"
            >
              View on the IMD website ↗
            </a>
          </div>
        ) : (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={src}
              src={src}
              alt={`IMD weekly district rainfall map · ${MAPS.find((m) => m.value === map)?.label}`}
              className="max-h-[460px] w-auto max-w-full rounded-lg"
              onError={() => setMapFailed(src)}
            />
          </div>
        )}
        <p className="mt-1.5 text-[10.5px] text-ink-faint">Source: India Meteorological Department, weekly district-wise rainfall.</p>
      </Card>

      <Card>
        <CardHeader
          title="Rain in cotton states"
          sub={data ? `Last 7 days (${span(data.pastDays)}) · forecast next 7 days (${span(data.forecastDays)}) · mm` : "Last 7 days and next 7 days · mm"}
        />
        {err ? (
          <p className="py-10 text-center text-[12px] text-ink-faint">Rainfall data couldn&apos;t be loaded — try again later.</p>
        ) : !data ? (
          <div className="flex h-60 items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11.5px]">
                <thead>
                  <tr className="border-b border-line text-[9.5px] uppercase tracking-wide text-ink-faint">
                    <th className="py-1.5 pr-2 text-left font-semibold">State</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Last 7 d</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Next 7 d</th>
                    {data.forecastDays.map((d) => (
                      <th key={d} className="w-7 px-0.5 py-1.5 text-center font-semibold normal-case" title={dayMonth(d)}>
                        {weekday(d)}
                        <span className="block text-[8.5px] font-normal">{new Date(d + "T00:00:00").getDate()}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.states.map((s) => (
                    <tr key={s.state} className="border-b border-line/60 last:border-0">
                      <td className="py-1 pr-2" title={s.places.join(", ")}>
                        <span className="font-medium text-ink">{s.state}</span>
                      </td>
                      <td className={"num px-2 py-1 text-right font-semibold " + totalTone(s.pastTotal)}>{fmtMm(s.pastTotal)}</td>
                      <td className={"num px-2 py-1 text-right font-semibold " + totalTone(s.nextTotal)}>{fmtMm(s.nextTotal)}</td>
                      {s.next.map((mm, i) => {
                        const c = rainCell(mm);
                        return (
                          <td key={i} className="px-0.5 py-1">
                            <span
                              className="num block rounded text-center text-[9.5px] leading-[18px]"
                              style={{ background: c.bg, color: c.fg }}
                              title={`${dayMonth(data.forecastDays[i])}: ${fmtMm(mm)} mm`}
                            >
                              {mm == null ? "" : mm < 0.5 ? "·" : fmtMm(mm)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-faint">
              <span className="font-semibold text-[#b45309]">Under 5 mm: dry</span>
              <span className="font-semibold text-[#1d4ed8]">25 mm and above: good rain</span>
              <span className="flex items-center gap-1">
                Daily:
                {[0, 1, 5, 15, 30].map((mm) => (
                  <span key={mm} className="inline-block h-2.5 w-4 rounded-sm" style={{ background: rainCell(mm).bg }} />
                ))}
              </span>
            </div>
            <p className="mt-1.5 text-[10.5px] leading-snug text-ink-faint">
              State average of major cotton districts. Past rain: NASA POWER (published with a lag of ~3 days). Forecast: MET Norway.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
