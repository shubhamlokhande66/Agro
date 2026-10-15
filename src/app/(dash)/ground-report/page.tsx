"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Lightbox, PhotoStrip, StatusChip } from "@/components/ground/GroundUi";
import { useAuth } from "@/lib/auth";
import { DP_REGION_OF, DP_SEASONS, dpValue } from "@/data/production";
import {
  CONDITIONS,
  GROUND_REPORTS,
  GROUND_STATES,
  RAINFALL,
  reportWeek,
  toneOf,
  type GroundPhoto,
  type StateReport,
} from "@/data/groundReport";

const REGION_LABEL: Record<string, string> = { NORTH: "North zone", WEST: "Central zone", SOUTH: "South zone" };

const fmtDay = (iso: string, withYear = true) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });

const weekLabel = (date: string) => {
  const w = reportWeek(date);
  return `${fmtDay(w.from, false)} – ${fmtDay(w.to)}`;
};

/** each state's share of All-India production in the latest season that has it */
function productionShares(): { season: string | null; share: Record<string, number> } {
  const season = [...DP_SEASONS].reverse().find((s) => (dpValue("prod", s, "ALL_INDIA") ?? 0) > 0) ?? null;
  const share: Record<string, number> = {};
  if (season) {
    const total = dpValue("prod", season, "ALL_INDIA")!;
    for (const s of GROUND_STATES) share[s.code] = ((dpValue("prod", season, s.code) ?? 0) / total) * 100;
  }
  return { season, share };
}

export default function GroundReportPage() {
  const { isAdmin } = useAuth();
  const reports = GROUND_REPORTS;
  const [reportId, setReportId] = useState<string | null>(null);
  const report = reports.find((r) => r.id === reportId) ?? reports[0] ?? null;
  const [viewer, setViewer] = useState<{ title: string; photos: GroundPhoto[]; start: number } | null>(null);

  const { season, share } = useMemo(productionShares, []);
  // states in order of production share, each with this week's report (if filed)
  const rows = useMemo(() => {
    const byState = new Map((report?.states ?? []).map((s) => [s.state, s]));
    return [...GROUND_STATES]
      .sort((a, b) => (share[b.code] ?? 0) - (share[a.code] ?? 0))
      .map((s) => ({ ...s, share: share[s.code] ?? null, r: byState.get(s.code) ?? null }));
  }, [report, share]);
  const filed = rows.filter((x) => x.r && hasContent(x.r));
  const photoCount = filed.reduce((n, x) => n + (x.r?.photos.length ?? 0), 0);

  if (!report) {
    return (
      <div>
        <PageHeader title="Ground Report" icon="⌖" sub="Field photographs and crop notes from India's cotton belt · updated weekly" />
        <div className="panel mx-auto max-w-lg p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-xl">⌖</div>
          <div className="text-sm font-semibold text-ink">The first ground report is on its way</div>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink-soft">
            Each week this page carries photographs and crop notes from the major cotton states — crop stage, crop
            condition, rainfall and what it means for the market.
          </p>
          {isAdmin ? (
            <Link
              href="/admin/groundReport"
              className="focusable mt-4 inline-block rounded-xl bg-accent px-4 py-2 text-[12.5px] font-semibold text-accent-contrast hover:bg-accent-strong"
            >
              Add this week&apos;s report →
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const takeaways = report.summary
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);

  return (
    <div>
      <PageHeader
        title="Ground Report"
        icon="⌖"
        sub="Field photographs and crop notes from India's cotton belt · updated weekly"
        dataset="groundReport"
        right={
          <label className="flex items-center gap-2 text-[11px] text-ink-faint">
            <span className="font-semibold uppercase tracking-wide">Week</span>
            <select
              value={report.id}
              onChange={(e) => setReportId(e.target.value)}
              className="focusable rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] font-medium text-ink"
            >
              {reports.map((r, i) => (
                <option key={r.id} value={r.id}>
                  {weekLabel(r.date)}
                  {i === 0 ? " (latest)" : ""}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {/* headline + takeaways */}
      <section className="panel mb-4 overflow-hidden">
        <div className="border-b border-line bg-accent-soft/50 px-4 py-3 sm:px-5">
          <div className="eyebrow">Week of {weekLabel(report.date)}</div>
          <h2 className="mt-1 text-[17px] font-semibold leading-snug tracking-tight text-ink sm:text-[19px]">
            {report.title || "Cotton crop: the view from the fields"}
          </h2>
          <div className="num mt-1 text-[11px] text-ink-faint">
            {filed.length} of {GROUND_STATES.length} states reported · {photoCount} photograph{photoCount === 1 ? "" : "s"}
            {report.author ? ` · Field team: ${report.author}` : ""}
          </div>
        </div>
        {takeaways.length ? (
          <div className="px-4 py-3.5 sm:px-5">
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">Key takeaways for traders</div>
            <ul className="space-y-1.5">
              {takeaways.map((t, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* state scoreboard */}
      <section className="panel mb-6 overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pb-2 pt-3.5 sm:px-5">
          <div className="text-[13.5px] font-semibold tracking-tight text-ink">State snapshot</div>
          <div className="text-[11px] text-ink-faint">
            Ordered by share of India&apos;s production{season ? ` (${season})` : ""} · tap a state for its report
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-y border-line bg-surface-2/60 text-left text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="px-3 py-2 font-semibold sm:px-5">State</th>
                <th className="hidden px-2 py-2 text-right font-semibold sm:table-cell">Share</th>
                <th className="px-2 py-2 font-semibold sm:px-3">Crop stage</th>
                <th className="px-2 py-2 font-semibold">Condition</th>
                <th className="px-2 py-2 font-semibold">Rainfall</th>
                <th className="hidden px-4 py-2 text-right font-semibold sm:table-cell sm:px-5">Photos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.code} className="border-b border-line last:border-0 hover:bg-surface-2/40">
                  <td className="px-3 py-2 sm:px-5">
                    <a href={`#${x.code}`} className="focusable font-semibold text-ink hover:text-accent">
                      {x.label}
                    </a>
                  </td>
                  <td className="num hidden px-2 py-2 text-right text-ink-soft sm:table-cell">{x.share != null ? `${x.share.toFixed(1)}%` : "—"}</td>
                  <td className="px-2 py-2 text-ink sm:px-3">{x.r?.stage || <span className="text-ink-faint">No update</span>}</td>
                  <td className="px-2 py-2">{x.r ? <StatusChip value={x.r.condition} tone={toneOf(CONDITIONS, x.r.condition)} /> : null}</td>
                  <td className="px-2 py-2">{x.r ? <StatusChip value={x.r.rainfall} tone={toneOf(RAINFALL, x.r.rainfall)} /> : null}</td>
                  <td className="num hidden px-4 py-2 text-right text-ink-soft sm:table-cell sm:px-5">{x.r?.photos.length || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* per-state reports */}
      <div className="space-y-5">
        {rows
          .filter((x) => x.r && hasContent(x.r))
          .map((x) => {
            const r = x.r!;
            const region = DP_REGION_OF[x.code];
            return (
              <section key={x.code} id={x.code} className="panel scroll-mt-20 p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[16px] font-semibold tracking-tight text-ink">{x.label}</h3>
                    <div className="num mt-0.5 text-[11px] text-ink-faint">
                      {region ? REGION_LABEL[region] : ""}
                      {x.share != null ? ` · ${x.share.toFixed(1)}% of India's production` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.stage ? <StatusChip label="Stage" value={r.stage} tone="flat" /> : null}
                    {r.condition ? <StatusChip label="Crop" value={r.condition} tone={toneOf(CONDITIONS, r.condition)} /> : null}
                    {r.rainfall ? <StatusChip label="Rain" value={r.rainfall} tone={toneOf(RAINFALL, r.rainfall)} /> : null}
                  </div>
                </div>

                <PhotoStrip
                  photos={r.photos}
                  onOpen={(i) => setViewer({ title: `${x.label} · week of ${weekLabel(report.date)}`, photos: r.photos, start: i })}
                />

                {r.commentary ? (
                  <div className="mt-4 space-y-2 text-[13px] leading-relaxed text-ink">
                    {r.commentary
                      .split(/\n\s*\n|\n/)
                      .filter((p) => p.trim())
                      .map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                  </div>
                ) : null}

                {r.traderView ? (
                  <div className="mt-4 rounded-xl border-l-[3px] border-accent bg-accent-soft/40 px-3.5 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-accent">Trader view</div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{r.traderView}</p>
                  </div>
                ) : null}
              </section>
            );
          })}
      </div>

      <p className="mt-6 text-center text-[11px] text-ink-faint">
        Photographs and observations from Agrolytix Research field contacts. Conditions vary within a state; read
        alongside sowing, arrivals and rainfall data.
      </p>

      {viewer ? <Lightbox {...viewer} onClose={() => setViewer(null)} /> : null}
    </div>
  );
}

function hasContent(r: StateReport) {
  return !!(r.stage || r.condition || r.rainfall || r.commentary || r.traderView || r.photos.length);
}
