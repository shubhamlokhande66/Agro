"use client";

import { Fragment } from "react";
import { isoDate, useMonsoon } from "@/components/monsoon/data";
import { Loaded, PageTitle, PANEL, signed } from "@/components/monsoon/ui";

function Planting() {
  const { data } = useMonsoon();
  const p = data?.planting;
  const rows = p?.rows ?? [];
  const categories = Array.from(new Set(rows.map((r) => r.category)));
  const total = (cat: string, k: "normal" | "thisYear" | "lastYear") =>
    rows.filter((r) => r.category === cat).reduce((a, r) => a + r[k], 0);

  return (
    <div className="max-w-7xl space-y-6">
      <PageTitle
        icon="❦"
        title="Kharif Planting Progress"
        sub={`Area sown (lakh ha) · as on ${isoDate(p?.asOnDate ?? null)} · Source: ${p?.source ?? "DA&FW"}`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {categories.map((c) => {
          const ty = total(c, "thisYear");
          const ly = total(c, "lastYear");
          const chg = ly ? ((ty - ly) / ly) * 100 : null;
          return (
            <div key={c} className={PANEL + " p-4"}>
              <p className="text-xs text-slate-400">{c}</p>
              <p className="mt-1 font-mono text-xl font-bold text-white">{ty.toFixed(1)}</p>
              <p className={"font-mono text-xs " + ((chg ?? 0) >= 0 ? "text-emerald-400" : "text-red-400")}>{signed(chg)} vs last year</p>
            </div>
          );
        })}
      </div>

      <div className={PANEL + " overflow-x-auto"}>
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-700/50 text-xs font-medium text-slate-400">
              <th className="px-4 py-3 text-left">Crop</th>
              <th className="px-4 py-3 text-right">Normal</th>
              <th className="px-4 py-3 text-right">This year</th>
              <th className="px-4 py-3 text-right">Last year</th>
              <th className="px-4 py-3 text-right">Difference</th>
              <th className="px-4 py-3 text-right">% vs last year</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <Fragment key={c}>
                <tr>
                  <td colSpan={6} className="bg-slate-800/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {c}
                  </td>
                </tr>
                {rows
                  .filter((r) => r.category === c)
                  .map((r) => (
                    <tr key={r.crop} className="border-b border-slate-700/10 hover:bg-slate-800/20">
                      <td className="px-4 py-2 text-sm font-medium text-white">{r.crop}</td>
                      <td className="px-4 py-2 text-right font-mono text-sm text-slate-400">{r.normal.toFixed(1)}</td>
                      <td className="px-4 py-2 text-right font-mono text-sm text-white">{r.thisYear.toFixed(1)}</td>
                      <td className="px-4 py-2 text-right font-mono text-sm text-slate-400">{r.lastYear.toFixed(1)}</td>
                      <td className={"px-4 py-2 text-right font-mono text-sm " + (r.difference >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {signed(r.difference, 1, "")}
                      </td>
                      <td className={"px-4 py-2 text-right font-mono text-sm font-bold " + (r.pctChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {signed(r.pctChange)}
                      </td>
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">
        The ministry's sowing portals block automated access, so this is the latest curated snapshot rather than a live feed.
      </p>
    </div>
  );
}

export default function PlantingPage() {
  return (
    <Loaded>
      <Planting />
    </Loaded>
  );
}
