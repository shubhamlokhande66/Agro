"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import BarChart from "@/components/charts/BarChart";
import { StatusChip } from "@/components/ground/GroundUi";
import { benchmarkRows } from "@/lib/benchmarks";
import { CONDITIONS, GROUND_REPORTS, GROUND_STATES, RAINFALL, imageUrl, reportWeek, toneOf, type StateReport } from "@/data/groundReport";
import { DP_SEASONS, dpValue } from "@/data/production";
import { num } from "@/lib/format";

function More({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="print-hide text-[11px] font-semibold text-accent hover:underline">
      {label} →
    </Link>
  );
}

function Fig({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0 px-2.5 py-1.5">
      <div className="truncate text-[8.5px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="num mt-0.5 truncate text-[12.5px] font-semibold leading-tight text-ink">{value}</div>
      {note ? <div className="num truncate text-[10px] text-ink-faint">{note}</div> : null}
    </div>
  );
}

/** India production estimates — Agrolytix vs USDA vs trade houses, two seasons */
/** benchmark sources left out of the Overview / PDF — kept in this browser */
const BENCH_HIDDEN_KEY = "benchmarksHidden";
export const readBenchHidden = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(BENCH_HIDDEN_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

export function BenchmarksSection() {
  const [hidden, setHidden] = useState<string[]>([]);
  useEffect(() => setHidden(readBenchHidden()), []);
  const setOut = (next: string[]) => {
    setHidden(next);
    try {
      localStorage.setItem(BENCH_HIDDEN_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable — the choice lasts until the page reloads
    }
  };

  const { sa, sb, rows } = benchmarkRows();
  // every source with a number, in the picker; the trade average is recalculated from the ticked trade houses
  const sources = rows.filter((r) => r.kind !== "avg" && (r.a != null || r.b != null));
  if (!sources.length) return null;
  const visible = sources.filter((r) => !hidden.includes(r.source));
  const trade = visible.filter((r) => r.kind === "trade");
  const mean = (k: "a" | "b") => {
    const v = trade.map((r) => r[k]).filter((x): x is number => x != null);
    return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null;
  };
  const avg = trade.length > 1 && !hidden.includes("Trade average") ? { source: "Trade average", kind: "avg" as const, a: mean("a"), b: mean("b") } : null;
  const shown = [...visible, ...(avg ? [avg] : [])];
  const ours = sources.find((r) => r.kind === "ours");
  const usda = visible.find((r) => r.kind === "usda");
  const vsOurs = (v: number | null | undefined) =>
    v == null || ours?.b == null ? undefined : `${v - ours.b >= 0 ? "+" : "−"}${num(Math.abs(v - ours.b), 1)} vs Agrolytix`;
  const figs = [
    ours && !hidden.includes(ours.source) ? <Fig key="ours" label={`Agrolytix ${sb}`} value={`${num(ours.b, 1)} lb`} note={ours.b != null ? `${Math.round(ours.b * 17).toLocaleString("en-IN")} KMT` : undefined} /> : null,
    usda ? <Fig key="usda" label={`USDA ${sb}`} value={`${num(usda.b ?? null, 1)} lb`} note={vsOurs(usda.b)} /> : null,
    avg ? <Fig key="avg" label={`Trade average ${sb}`} value={`${num(avg.b ?? null, 1)} lb`} note={vsOurs(avg.b)} /> : null,
  ].filter(Boolean);
  const pickable = [...sources.map((r) => r.source), ...(sources.filter((r) => r.kind === "trade").length > 1 ? ["Trade average"] : [])];

  return (
    <div className="space-y-4">
      {/* which sources go into the PDF report — dashboard-only, never printed */}
      <div className="print-hide panel px-4 py-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12.5px] font-semibold text-ink">
            Sources in the PDF report{" "}
            <span className="font-normal text-ink-faint">· {pickable.filter((p) => !hidden.includes(p)).length} of {pickable.length} selected — only these appear in the chart and the report</span>
          </span>
          <span className="flex gap-3 text-[11.5px] font-semibold">
            <button type="button" onClick={() => setOut([])} className="focusable text-accent hover:underline">
              All
            </button>
            <button type="button" onClick={() => setOut(pickable)} className="focusable text-accent hover:underline">
              None
            </button>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pickable.map((src) => {
            const on = !hidden.includes(src);
            return (
              <button
                key={src}
                type="button"
                onClick={() => setOut(on ? [...hidden, src] : hidden.filter((h) => h !== src))}
                aria-pressed={on}
                className={
                  "focusable flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition-colors " +
                  (on ? "border-accent bg-accent/10 text-ink" : "border-line text-ink-faint hover:border-accent/60")
                }
              >
                <span className={"grid h-3.5 w-3.5 place-items-center rounded border text-[9px] " + (on ? "border-accent bg-accent text-accent-contrast" : "border-line")}>{on ? "✓" : ""}</span>
                {src}
              </button>
            );
          })}
        </div>
      </div>

      {shown.length ? (
        <Card>
          <CardHeader
            title="Production Benchmarks · India"
            sub={`${shown.map((r) => r.source).join(" vs ")} · ${sa} and ${sb} · lakh bales (170 kg)`}
            right={<More href="/benchmarks" label="Benchmarks" />}
          />
          {figs.length ? (
            <div className={"mb-2.5 grid divide-x divide-line rounded-lg border border-line bg-surface-2/60 " + (figs.length === 3 ? "grid-cols-3" : figs.length === 2 ? "grid-cols-2" : "grid-cols-1")}>{figs}</div>
          ) : null}
          <BarChart
            labels={shown.map((r) => r.source)}
            legend
            height={240}
            series={[
              { label: sa, color: "#94a3b8", data: shown.map((r) => (r.a == null ? null : Math.round(r.a * 10) / 10)) },
              {
                label: sb,
                color: "#0f9d63",
                data: shown.map((r) => (r.b == null ? null : Math.round(r.b * 10) / 10)),
                valueLabel: (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 1 }),
              },
            ]}
            yFmt={(v) => v.toLocaleString("en-IN")}
          />
        </Card>
      ) : null}
    </div>
  );
}

const fmtDay = (iso: string, withYear = true) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });

const hasContent = (r: StateReport) => !!(r.stage || r.condition || r.rainfall || r.commentary || r.photos.length);

/** the latest Field Pulse report — takeaways, then each state's crop notes and field photographs */
/** states hidden from the Overview / PDF for a Field Pulse report — kept in this browser */
const hiddenKey = (reportId: string) => `fieldPulseHidden:${reportId}`;
export function fieldPulseHidden(reportId: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(hiddenKey(reportId)) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function saveHidden(reportId: string, codes: string[]) {
  try {
    localStorage.setItem(hiddenKey(reportId), JSON.stringify(codes));
  } catch {
    // storage unavailable — the choice lasts until the page reloads
  }
}

export function FieldPulseSection() {
  const report = GROUND_REPORTS[0];
  const [hidden, setHidden] = useState<string[]>([]);
  useEffect(() => {
    if (report) setHidden(fieldPulseHidden(report.id));
  }, [report]);
  if (!report) return null;
  // the picker stores the states left OUT (so a state added to next week's report starts ticked)
  const setOut = (next: string[]) => {
    setHidden(next);
    saveHidden(report.id, next);
  };
  const toggle = (code: string) => setOut(hidden.includes(code) ? hidden.filter((c) => c !== code) : [...hidden, code]);
  const w = reportWeek(report.date);
  // states in order of production share (as on the Field Pulse page)
  const season = [...DP_SEASONS].reverse().find((s) => (dpValue("prod", s, "ALL_INDIA") ?? 0) > 0);
  const share = (code: string) => (season ? dpValue("prod", season, code) ?? 0 : 0);
  const byState = new Map(report.states.map((s) => [s.state, s]));
  const states = [...GROUND_STATES]
    .sort((a, b) => share(b.code) - share(a.code))
    .map((s) => ({ ...s, r: byState.get(s.code) }))
    // states without photographs are left out
    .filter((x): x is typeof x & { r: StateReport } => !!x.r && hasContent(x.r) && x.r.photos.length > 0);
  // only the states ticked in the picker are shown — and so only they go into the PDF
  const shown = states.filter((x) => !hidden.includes(x.code));
  const takeaways = report.summary
    .split("\n")
    .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`Field Pulse · ${report.title || "Ground report"}`}
          sub={`Live from the fields · week of ${fmtDay(w.from, false)} – ${fmtDay(w.to)}${report.author ? ` · ${report.author}` : ""}`}
          right={<More href="/field-pulse" label="Field Pulse" />}
        />
        {takeaways.length ? (
          <ul className="list-disc space-y-1 pl-5 text-[12.5px] leading-relaxed text-ink">
            {takeaways.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] text-ink-faint">{states.length} states reported this week.</p>
        )}
      </Card>

      {/* which states go into the PDF report — dashboard-only, never printed */}
      {states.length ? (
        <div className="print-hide panel px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12.5px] font-semibold text-ink">
              States in the PDF report{" "}
              <span className="font-normal text-ink-faint">
                · {shown.length} of {states.length} selected — only these states and their photos go into the report
              </span>
            </span>
            <span className="flex gap-3 text-[11.5px] font-semibold">
              <button type="button" onClick={() => setOut([])} className="focusable text-accent hover:underline">
                All
              </button>
              <button type="button" onClick={() => setOut(states.map((x) => x.code))} className="focusable text-accent hover:underline">
                None
              </button>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {states.map((x) => {
              const on = !hidden.includes(x.code);
              return (
                <button
                  key={x.code}
                  type="button"
                  onClick={() => toggle(x.code)}
                  aria-pressed={on}
                  className={
                    "focusable flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition-colors " +
                    (on ? "border-accent bg-accent/10 text-ink" : "border-line text-ink-faint hover:border-accent/60")
                  }
                >
                  <span className={"grid h-3.5 w-3.5 place-items-center rounded border text-[9px] " + (on ? "border-accent bg-accent text-accent-contrast" : "border-line")}>
                    {on ? "✓" : ""}
                  </span>
                  {x.label}
                  <span className="font-normal text-ink-faint">· {x.r.photos.length} photos</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* one card per state, so the PDF breaks pages between states, never through a photo */}

      {shown.map((x) => (
        <section key={x.code} className="panel p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-[14.5px] font-semibold tracking-tight text-ink">{x.label}</h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {x.r.stage ? <StatusChip label="Stage" value={x.r.stage} tone="flat" /> : null}
              {x.r.condition ? <StatusChip label="Crop" value={x.r.condition} tone={toneOf(CONDITIONS, x.r.condition)} /> : null}
              {x.r.rainfall ? <StatusChip label="Rain" value={x.r.rainfall} tone={toneOf(RAINFALL, x.r.rainfall)} /> : null}
            </div>
          </div>
          {x.r.photos.length ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {x.r.photos.map((p) => (
                <figure key={p.id} className="min-w-0">
                  {/* loaded eagerly (not lazy) so they're in place when the PDF is captured */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(p.id)} alt={p.caption || "Field photograph"} className="aspect-[4/3] w-full rounded-xl bg-surface-2 object-cover" />
                  {p.caption || p.location ? (
                    <figcaption className="mt-1 text-[10.5px] leading-snug text-ink-soft">
                      {p.caption}
                      {p.location ? <span className="text-ink-faint"> · {p.location}</span> : null}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          ) : null}
          {x.r.commentary ? (
            <div className="mt-3 space-y-1.5 text-[12.5px] leading-relaxed text-ink">
              {x.r.commentary
                .split(/\n\s*\n|\n/)
                .filter((p) => p.trim())
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
