"use client";

import { useMemo, useState } from "react";
import { isoDate, useMonsoon } from "@/components/monsoon/data";
import { imdCategory, Loaded, PageTitle, PANEL, RefreshButton, signed } from "@/components/monsoon/ui";

type SortKey = "departure" | "name" | "zone";

function Deficit() {
  const { data } = useMonsoon();
  const subs = data?.imd?.subdivisions ?? [];
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("departure");
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    const list = subs.filter((s) => !q || s.name.toLowerCase().includes(q) || s.zone.toLowerCase().includes(q));
    return [...list].sort((a, b) => {
      const c = sortKey === "departure" ? a.departure - b.departure : a[sortKey].localeCompare(b[sortKey]);
      return asc ? c : -c;
    });
  }, [subs, search, sortKey, asc]);

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setAsc(!asc);
    else {
      setSortKey(k);
      setAsc(k === "departure");
    }
  };
  const Head = ({ k, children, right }: { k: SortKey; children: React.ReactNode; right?: boolean }) => (
    <th className={"cursor-pointer px-4 py-3 " + (right ? "text-right" : "text-left")} onClick={() => sortBy(k)}>
      {children} <span className="text-slate-600">{sortKey === k ? (asc ? "↑" : "↓") : "↕"}</span>
    </th>
  );

  return (
    <div className="max-w-7xl space-y-6">
      <PageTitle
        icon="▤"
        title="IMD Subdivision Deficit Table"
        sub={`Season-to-date cumulative (1 Jun →${data?.imd?.asOfDate ? ` ${isoDate(data.imd.asOfDate)}` : ""}) · Source: ${data?.imd?.source ?? "IMD"}`}
        right={<RefreshButton />}
      />

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search subdivision or zone…"
        className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      />

      <div className={PANEL + " overflow-x-auto"}>
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-700/50 text-xs font-medium text-slate-400">
              <th className="w-12 px-4 py-3 text-left">#</th>
              <Head k="name">Subdivision</Head>
              <Head k="zone">Zone</Head>
              <th className="px-4 py-3 text-right">Normal (mm)</th>
              <th className="px-4 py-3 text-right">Actual (mm)</th>
              <Head k="departure" right>Departure %</Head>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const cat = imdCategory(s.departure);
              return (
                <tr key={s.name} className={"border-b border-slate-700/10 " + (cat.label === "Normal" ? "" : cat.bg.replace("/10", "/5"))}>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{i + 1}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-white">{s.name}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">{s.zone}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-300">{s.normalRainfall.toFixed(0)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm text-white">{s.actualRainfall.toFixed(0)}</td>
                  <td className={"px-4 py-2.5 text-right font-mono text-sm font-bold " + cat.text}>{signed(s.departure, 0)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={"inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium " + cat.text + " " + cat.bg}>{cat.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">
        Showing {rows.length} of {subs.length} subdivisions · Normal = Jun–Sep LPA; actual derived from IMD's cumulative % departure ·
        IMD categories: Large Excess ≥ +60 · Excess +20…+59 · Normal −19…+19 · Deficient −20…−59 · Large Deficient ≤ −60.
      </p>
    </div>
  );
}

export default function DeficitPage() {
  return (
    <Loaded>
      <Deficit />
    </Loaded>
  );
}
