"use client";

import { Fragment, useMemo, useState } from "react";
import { toRegionalConfig } from "@/lib/monsoon/config";
import { commodityWeighted } from "@/lib/monsoon/metrics";
import { isoDate, useMonsoon } from "@/components/monsoon/data";
import { imdCategory, Loaded, PageTitle, PANEL, RefreshButton, signed } from "@/components/monsoon/ui";


function Regional() {
  const { data } = useMonsoon();
  const subs = data?.imd?.subdivisions ?? [];
  const cfg = useMemo(() => toRegionalConfig(data?.weights), [data?.weights]);
  // the admin's default exclusions, toggleable here; plus any mapped subdivision can be toggled
  const excludable = useMemo(
    () => Array.from(new Set([...cfg.exclusions, "Konkan & Goa", "South Interior Karnataka"])),
    [cfg.exclusions],
  );
  const [exclusions, setExclusions] = useState<string[]>(cfg.exclusions);
  const [expanded, setExpanded] = useState<string | null>(null);
  const results = useMemo(() => commodityWeighted(subs, cfg, exclusions), [subs, cfg, exclusions]);
  const toggle = (n: string) => setExclusions((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  return (
    <div className="max-w-7xl space-y-6">
      <PageTitle
        icon="⌖"
        title="Regional Weighted Average"
        sub={`Production-weighted rainfall departure · Source: ${data?.imd?.source ?? "IMD"}${data?.imd?.asOfDate ? ` (as of ${isoDate(data.imd.asOfDate)})` : ""}`}
        right={<RefreshButton />}
      />

      <div className={PANEL + " p-4"}>
        <p className="mb-2 text-xs font-medium text-slate-400">Subdivision exclusions:</p>
        <div className="flex flex-wrap gap-4">
          {excludable.map((n) => (
            <label key={n} className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={exclusions.includes(n)} onChange={() => toggle(n)} className="accent-emerald-500" />
              Exclude {n}
            </label>
          ))}
        </div>
      </div>

      <div className={PANEL + " overflow-x-auto"}>
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-slate-700/50 text-xs font-medium text-slate-400">
              <th className="px-4 py-3 text-left">Commodity</th>
              <th className="px-4 py-3 text-right">Weighted Departure %</th>
              <th className="hidden px-4 py-3 text-left sm:table-cell">Key States</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const cat = imdCategory(r.weightedDeparture);
              const open = expanded === r.commodity;
              return (
                <Fragment key={r.commodity}>
                  <tr
                    className="cursor-pointer border-b border-slate-700/20 hover:bg-slate-800/30"
                    onClick={() => setExpanded(open ? null : r.commodity)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-white">{r.commodity}</td>
                    <td className={"px-4 py-3 text-right font-mono text-sm font-bold " + cat.text}>{signed(r.weightedDeparture)}</td>
                    <td className="hidden px-4 py-3 text-xs text-slate-400 sm:table-cell">{r.states.map((s) => s.state).join(", ")}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={"inline-flex rounded-full px-2 py-0.5 text-xs font-medium " + cat.text + " " + cat.bg}>{cat.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400">{open ? "▴" : "▾"}</td>
                  </tr>
                  {open ? (
                    <tr>
                      <td colSpan={5} className="bg-slate-800/20 px-4 py-3">
                        <div className="space-y-2">
                          {r.states.map((s) => (
                            <div key={s.state} className="flex items-center justify-between gap-3 text-xs">
                              <div>
                                <span className="font-medium text-slate-300">{s.state}</span>
                                <span className="ml-2 text-slate-500">(weight {(s.weight * 100).toFixed(0)}%)</span>
                                <span className="ml-2 text-slate-600">— {s.subdivisions.join(", ")}</span>
                              </div>
                              <span className={"font-mono " + imdCategory(s.avgDeparture).text}>{signed(s.avgDeparture)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">
        Each state = average of its subdivisions; states combined by their share of national production. Status uses IMD's categories
        (Normal −19% … +19%, Deficient −20% … −59%).
      </p>
    </div>
  );
}

export default function RegionalPage() {
  return (
    <Loaded>
      <Regional />
    </Loaded>
  );
}
