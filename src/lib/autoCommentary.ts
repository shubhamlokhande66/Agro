/**
 * "✨ Auto-write" for the Overview summary panels: a short, plain-English summary of the latest
 * data in each section, written by rules from the same datasets the cards show (no AI service).
 * The text lands in the commentary box, where it can be edited before the report goes out.
 */

import { ARRIVALS, ARRIVAL_SEASONS, ARRIVAL_WEEKS } from "@/data/arrivals";
import { SOWING_SERIES, SOWING_WEEKS } from "@/data/sowing";
import { DP_SEASONS, DP_STATES, DP_STATE_LABELS, dpValue } from "@/data/production";
import { SND } from "@/data/balanceSheet";
import { CCI } from "@/data/cci";
import { IE } from "@/data/trade";
import { WASDE_REPORTS, convertWasde, type WasdeRow } from "@/data/wasde";
import { COT_WEEKS, cotNet, cotNetChg } from "@/data/cftc";
import { ES_YEARS } from "@/data/exportSales";
import { monthlyBasis } from "@/lib/basis";
import { benchmarkRows } from "@/lib/benchmarks";
import { priceTableRows } from "@/components/overview/PriceTable";
import type { CottonBelt } from "@/lib/server/cottonBelt";

export type AutoSection =
  | "overview"
  | "overviewWeather"
  | "overviewSowing"
  | "overviewProduction"
  | "overviewCci"
  | "overviewBalance"
  | "overviewTradeBasis"
  | "overviewWasde"
  | "overviewCftc"
  | "overviewBenchmarks";

/* ---------------- helpers ---------------- */

const n1 = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n0 = (v: number) => Math.round(v).toLocaleString("en-IN");
const us = (v: number) => Math.round(v).toLocaleString("en-US");
/** "2026-10" -> "Oct 2026" */
const monthName = (m: string) =>
  /^\d{4}-\d{2}$/.test(m) ? new Date(m + "-01T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : m;
const dayMonth = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const pct = (v: number) => (Math.abs(v) < 0.05 ? "0.0%" : `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`);
/** "2021-10-06" -> "6 Oct"; other week labels ("Sept I") as they are */
const weekLabel = (w: string | undefined) => (w && /^\d{4}-\d{2}-\d{2}$/.test(w) ? dayMonth(w) : w ?? "");
const pctOf = (now: number | null | undefined, then: number | null | undefined) =>
  now == null || then == null || then === 0 ? null : ((now - then) / Math.abs(then)) * 100;
const lastIdx = (a: (number | null)[] | undefined) => {
  const arr = a ?? [];
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null && !Number.isNaN(arr[i] as number)) return i;
  return -1;
};
/** "Gujarat, Maharashtra and Telangana" */
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const span = (days: string[]) => (days.length ? `${dayMonth(days[0])}–${dayMonth(days.at(-1)!)}` : "");
const move = (v: number | null, up: string, down: string, flat = "steady") =>
  v == null ? flat : Math.abs(v) < 0.3 ? flat : v > 0 ? up : down;

/* ---------------- weather ---------------- */

let beltPromise: Promise<CottonBelt> | null = null;
/** the cotton-belt rainfall (last 7 days + 7-day forecast), fetched once per page load */
export function loadCottonBelt(force = false): Promise<CottonBelt> {
  if (force || !beltPromise) {
    beltPromise = fetch("/api/weather/cotton-belt").then((r) => {
      if (!r.ok) throw new Error("weather unavailable");
      return r.json();
    });
    beltPromise.catch(() => (beltPromise = null));
  }
  return beltPromise;
}

export function weatherCommentary(d: CottonBelt): string {
  const withPast = d.states.filter((s) => s.pastTotal != null);
  const wet = withPast.filter((s) => s.pastTotal! >= 25).sort((a, b) => b.pastTotal! - a.pastTotal!);
  const light = withPast.filter((s) => s.pastTotal! >= 5 && s.pastTotal! < 25).sort((a, b) => b.pastTotal! - a.pastTotal!);
  const dry = withPast.filter((s) => s.pastTotal! < 5);
  const mm = (s: { state: string; pastTotal: number | null }) => `${s.state} (${n0(s.pastTotal!)} mm)`;

  const past: string[] = [];
  if (wet.length) past.push(`good rain fell over ${list(wet.map(mm))}`);
  if (light.length) past.push(`${list(light.map(mm))} received light to moderate showers`);
  if (dry.length) past.push(`${dry.length === withPast.length ? "the whole cotton belt" : list(dry.map((s) => s.state))} remained largely dry`);
  let text = past.length ? `Last 7 days (${span(d.pastDays)}): ${past.join("; ")}.` : "";

  const withNext = d.states.filter((s) => s.nextTotal != null);
  const rainy = withNext.filter((s) => s.nextTotal! >= 20).sort((a, b) => b.nextTotal! - a.nextTotal!);
  const showers = withNext.filter((s) => s.nextTotal! >= 5 && s.nextTotal! < 20).sort((a, b) => b.nextTotal! - a.nextTotal!);
  const fdry = withNext.filter((s) => s.nextTotal! < 5);
  const nmm = (s: { state: string; nextTotal: number | null }) => `${s.state} (~${n0(s.nextTotal!)} mm)`;
  const next: string[] = [];
  if (rainy.length) next.push(`rain is forecast over ${list(rainy.map(nmm))}`);
  if (showers.length) next.push(`light showers are likely in ${list(showers.map(nmm))}`);
  if (fdry.length) next.push(`${fdry.length === withNext.length ? "the whole belt" : rainy.length || showers.length ? "the rest of the belt" : list(fdry.map((s) => s.state))} is expected to stay dry`);
  if (next.length) text += ` Next 7 days (${span(d.forecastDays)}): ${next.join("; ")}.`;

  // what it means for the crop at this time of year
  const month = new Date(d.forecastDays[0] ?? Date.now()).getMonth(); // 0 = Jan
  const southRain = rainy.length > 0;
  if (month >= 9 || month <= 1) {
    text += southRain
      ? ` Dry weather in most areas supports picking and arrivals, while rain in ${list(rainy.map((s) => s.state))} could delay picking and affect fibre quality.`
      : " Dry weather across the belt supports picking and should keep arrivals picking up.";
  } else if (month >= 5 && month <= 6) {
    text += dry.length > withPast.length / 2 ? " A dry spell during sowing needs watching in rain-fed areas." : " Rainfall is supporting sowing progress.";
  } else if (month >= 7 && month <= 8) {
    text += dry.length > withPast.length / 2 ? " Dry conditions during flowering and boll formation could stress rain-fed crops." : " Moisture is adequate for flowering and boll development.";
  }
  return text.trim();
}

/* ---------------- prices ---------------- */

function pricesCommentary(): string | null {
  const rows = priceTableRows();
  const get = (label: string) => rows.find((r) => r.label === label);
  const wk = (label: string) => get(label)?.changes[0] ?? null;
  const part = (label: string, name = label, unit = "", suffix = "") => {
    const r = get(label);
    if (!r || r.close === "—") return null;
    const c = wk(label);
    return `${name} ${unit}${r.close}${suffix}${c != null ? ` (${pct(c)} w/w)` : ""}`;
  };
  const lint = ["North 28 mm", "Gujarat 29 mm", "Central India 29 mm", "Central India 30 mm", "Central India 31 mm"];
  const lintCh = lint.map(wk).filter((v): v is number => v != null);
  const avg = lintCh.length ? lintCh.reduce((a, b) => a + b, 0) / lintCh.length : null;
  const date = rows.find((r) => r.label === "Gujarat 29 mm")?.date;
  const out: string[] = [];
  out.push(
    `${date ? `Week to ${new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ` : ""}domestic cotton prices were ${move(avg, "firmer", "weaker")}${avg != null ? ` (avg ${pct(avg)} w/w)` : ""} — ${[part("Gujarat 29 mm", "Gujarat 29 mm", "₹"), part("North 28 mm", "North 28 mm", "₹"), part("Central India 30 mm", "Central India 30 mm", "₹")].filter(Boolean).join(", ")} per candy.`,
  );
  const side = [part("Kapas", "Kapas", "₹"), part("Cotton Seed", "cotton seed", "₹"), part("Cotton Seed Oil Cake", "oil cake", "₹")].filter(Boolean);
  if (side.length) out.push(`${side.join(", ")} per quintal; ${part("Cotton Yarn", "yarn", "₹", "/kg") ?? "yarn —"}.`);
  const ice = get("ICE Futures");
  const inr = get("INR");
  const brent = get("Crude Oil (Brent)");
  const g: string[] = [];
  if (ice && ice.close !== "—") g.push(`ICE futures ${move(wk("ICE Futures"), "rose to", "fell to", "were steady at")} ${ice.close}¢/lb${wk("ICE Futures") != null ? ` (${pct(wk("ICE Futures")!)})` : ""}`);
  if (inr && inr.close !== "—") g.push(`the rupee at ${inr.close}/US$`);
  if (brent && brent.close !== "—") g.push(`Brent at $${brent.close}/bbl`);
  if (g.length) out.push(`Globally, ${list(g)}.`);
  return out.join(" ");
}

/* ---------------- sowing & arrivals ---------------- */

function sowingCommentary(): string | null {
  const out: string[] = [];
  const years = (SOWING_SERIES ?? []).filter((s) => /^\d{4}$/.test(s.label)).sort((a, b) => Number(b.label) - Number(a.label));
  const normal = (SOWING_SERIES ?? []).find((s) => /normal/i.test(s.label));
  const cur = years[0];
  if (cur) {
    const i = lastIdx(cur.data);
    if (i >= 0) {
      const v = cur.data[i];
      const vp = pctOf(v, years[1]?.data?.[i]);
      const vn = pctOf(v, normal?.data?.[i]);
      out.push(
        `Cotton area sown in ${cur.label} stood at ${n1(v)} lakh ha as of ${weekLabel(SOWING_WEEKS[i])}${vp != null ? `, ${pct(vp)} vs ${years[1].label}` : ""}${vn != null ? ` and ${pct(vn)} vs normal` : ""}.`,
      );
    }
  }
  const key = ARRIVAL_SEASONS?.at(-1);
  const prevKey = ARRIVAL_SEASONS?.at(-2);
  if (key) {
    const a = ARRIVALS[key] ?? [];
    const i = lastIdx(a);
    // cotton year Oct–Sep: once the latest season in the data has ended, the new season's arrivals
    // only begin in November, so report the closing total instead of a stale weekly figure
    const startYear = parseInt(key, 10);
    const now = new Date();
    const curStart = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
    if (i >= 0 && startYear < curStart) {
      const yoy = pctOf(a[i], prevKey ? ARRIVALS[prevKey]?.[i] : null);
      const next = `${curStart}-${String((curStart + 1) % 100).padStart(2, "0")}`;
      out.push(
        `${key} arrivals stood at ${n1(a[i])} lakh bales in the latest data (${weekLabel(ARRIVAL_WEEKS[i])})${yoy != null ? `, ${pct(yoy)} vs ${prevKey} at the same point` : ""}. Arrivals for ${next} will start from November.`,
      );
    } else if (i >= 0) {
      const v = a[i];
      const weekly = i > 0 && a[i - 1] != null ? v - a[i - 1] : null;
      const yoy = pctOf(v, prevKey ? ARRIVALS[prevKey]?.[i] : null);
      out.push(
        `Arrivals for ${key} reached ${n1(v)} lakh bales by ${weekLabel(ARRIVAL_WEEKS[i])}${weekly != null ? ` (${n1(weekly)} lakh bales in the latest week)` : ""}${yoy != null ? `, ${pct(yoy)} vs ${prevKey} at the same point` : ""}.`,
      );
    }
  }
  // arrivals first: once sowing is over, arrivals are what the market watches
  return out.length ? [...out].reverse().join(" ") : null;
}

/* ---------------- production ---------------- */

function productionCommentary(): string | null {
  const sB = DP_SEASONS.at(-1);
  const sA = DP_SEASONS.at(-2);
  if (!sA || !sB) return null;
  const pB = dpValue("prod", sB, "ALL_INDIA");
  const pA = dpValue("prod", sA, "ALL_INDIA");
  if (pB == null) return null;
  const area = pctOf(dpValue("area", sB, "ALL_INDIA"), dpValue("area", sA, "ALL_INDIA"));
  const yld = pctOf(dpValue("yield", sB, "ALL_INDIA"), dpValue("yield", sA, "ALL_INDIA"));
  let text = `India's ${sB} production is estimated at ${n1(pB)} lakh bales${pA != null ? ` against ${n1(pA)} lakh bales in ${sA} (${pct(pctOf(pB, pA)!)})` : ""}`;
  const drivers = [area != null ? `area ${pct(area)}` : null, yld != null ? `yield ${pct(yld)}` : null].filter(Boolean);
  text += drivers.length ? `, with ${list(drivers as string[])}.` : ".";
  // the states that moved most
  const states = DP_STATES.filter((s) => s !== "ALL_INDIA");
  const moves = states
    .map((s) => ({ s, d: (dpValue("prod", sB, s) ?? NaN) - (dpValue("prod", sA, s) ?? NaN) }))
    .filter((m) => Number.isFinite(m.d) && Math.abs(m.d) >= 0.5)
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
    .slice(0, 3);
  if (moves.length)
    text += ` Largest changes: ${list(moves.map((m) => `${DP_STATE_LABELS[m.s] ?? m.s} ${m.d > 0 ? "+" : "−"}${n1(Math.abs(m.d))} lakh bales`))}.`;
  return text;
}

/* ---------------- CCI ---------------- */

function cciCommentary(): string | null {
  const latest = Object.keys(CCI.proc_annual ?? {}).sort().at(-1);
  if (!latest) return null;
  const out = [
    `For ${latest}, CCI has procured ${n1(CCI.proc_annual[latest] ?? 0)} lakh bales and sold ${n1(CCI.sell_annual?.[latest] ?? 0)} lakh bales under OMSS${CCI.stock_annual?.[latest] != null ? `, leaving ${n1(CCI.stock_annual[latest])} lakh bales in stock` : ""}.`,
  ];
  const prices = (CCI.datewise ?? []).filter((d) => d.p != null);
  const last = prices.at(-1);
  if (last?.p != null) {
    const t = Date.parse(last.d);
    const before = Number.isFinite(t) ? [...prices].reverse().find((d) => Date.parse(d.d) <= t - 28 * 86400000) : undefined;
    const ch = pctOf(last.p, before?.p);
    out.push(`CCI's latest sale price was ₹${n0(last.p)}/candy (${last.d})${ch != null ? `, ${pct(ch)} over the past month` : ""}.`);
  }
  return out.join(" ");
}

/* ---------------- balance sheet ---------------- */

function balanceCommentary(): string | null {
  const seasons = [...(SND.annual_seasons ?? [])].sort((x, y) => parseInt(y, 10) - parseInt(x, 10));
  const [latest, prev] = seasons;
  const a = latest ? (SND.annual?.[latest] as unknown as Record<string, number | null>) : undefined;
  const p = prev ? (SND.annual?.[prev] as unknown as Record<string, number | null>) : undefined;
  if (!a) return null;
  const v = (o: typeof a, k: string) => o?.[k] ?? null;
  const item = (k: string, label: string) => {
    const now = v(a, k);
    if (now == null) return null;
    const was = p ? v(p, k) : null;
    return `${label} ${n1(now)}${was != null ? ` (${now - was >= 0 ? "+" : "−"}${n1(Math.abs(now - was))})` : ""}`;
  };
  const cs = v(a, "closing_stocks");
  const csP = p ? v(p, "closing_stocks") : null;
  const parts = [item("crop_size", "crop"), item("imports", "imports"), item("domestic_cons", "consumption"), item("exports", "exports")].filter(Boolean);
  let text = `${latest} balance sheet (lakh bales, change vs ${prev}): ${parts.join(", ")}.`;
  if (cs != null)
    text += ` Closing stocks are seen at ${n1(cs)} lakh bales${csP != null ? `, ${cs >= csP ? "up" : "down"} from ${n1(csP)} — ${cs > csP ? "a looser" : cs < csP ? "a tighter" : "an unchanged"} balance` : ""}.`;
  return text;
}

/* ---------------- imports & basis ---------------- */

function tradeBasisCommentary(): string | null {
  const out: string[] = [];
  const season = IE.actual_cutoff?.season || (IE.seasons ?? []).at(-1);
  if (season) {
    const imp = IE.import_totals?.[season];
    const exp = IE.export_totals?.[season];
    if (imp != null || exp != null)
      out.push(`In ${season}, India ${imp != null ? `imported ${n1(imp)} lakh bales` : ""}${imp != null && exp != null ? " and " : ""}${exp != null ? `exported ${n1(exp)} lakh bales` : ""}.`);
  }
  const rows = monthlyBasis();
  const last = rows.at(-1);
  const prev = rows.at(-2);
  if (last) {
    const side = last.basis >= 0 ? "premium" : "discount";
    out.push(
      `Indian cotton (Guj-29 at ${last.gujCents.toFixed(1)}¢/lb) traded at a ${side} of ${Math.abs(last.basis).toFixed(1)}¢/lb to the Cotlook A Index (${last.aIndex.toFixed(1)}¢) in ${monthName(last.month)}${prev ? `, ${Math.abs(last.basis) > Math.abs(prev.basis) ? "widening" : "narrowing"} from ${prev.basis >= 0 ? "+" : "−"}${Math.abs(prev.basis).toFixed(1)}¢ in ${monthName(prev.month)}` : ""}.`,
    );
    out.push(last.basis >= 0 ? "A premium keeps imports competitive and Indian exports less attractive." : "A discount supports Indian export demand and limits imports.");
  }
  return out.length ? out.join(" ") : null;
}

/* ---------------- WASDE ---------------- */

function wasdeCommentary(): string | null {
  const r = WASDE_REPORTS[0];
  if (!r) return null;
  const y = r.years.at(-1);
  if (!y) return null;
  const prev = WASDE_REPORTS[1];
  const india = y.countries.India;
  const prevOf = (k: keyof WasdeRow) => india?.prevMonth?.[k] ?? prev?.years.find((x) => x.year === y.year)?.countries.India?.current[k] ?? null;
  const lb = (v: number | null | undefined) => (v == null ? null : convertWasde(v, "lakh"));
  const chg = (k: keyof WasdeRow, label: string) => {
    const now = lb(india?.current[k]);
    const was = lb(prevOf(k));
    if (now == null) return null;
    const d = was != null ? now - was : null;
    return `${label} ${n1(now)} lakh bales${d == null ? "" : Math.abs(d) < 0.05 ? " (unchanged)" : ` (${d > 0 ? "raised" : "cut"} ${n1(Math.abs(d))})`}`;
  };
  const world = y.countries.World?.current;
  const parts = [chg("production", "production"), chg("domesticUse", "consumption"), chg("exports", "exports"), chg("endingStocks", "ending stocks")].filter(Boolean);
  let text = `USDA's ${r.title} WASDE, India ${y.year}: ${parts.join(", ")}.`;
  if (world?.production != null && world?.endingStocks != null)
    text += ` World production is projected at ${n0(convertWasde(world.production, "kmt"))} KMT and ending stocks at ${n0(convertWasde(world.endingStocks, "kmt"))} KMT.`;
  return text;
}

/* ---------------- CFTC & export sales ---------------- */

function cftcCommentary(): string | null {
  const out: string[] = [];
  const w = COT_WEEKS.at(-1);
  if (w) {
    const net = cotNet(w, "mm");
    const chg = cotNetChg(w, "mm");
    out.push(
      `CFTC (${dayMonth(w.date)}): managed money was net ${net >= 0 ? "long" : "short"} ${Math.abs(net).toLocaleString("en-US")} contracts, ${chg >= 0 ? "adding" : "shedding"} ${Math.abs(chg).toLocaleString("en-US")} on the week${(chg > 0 && net < 0) ? " (short covering)" : chg < 0 && net < 0 ? " (fresh selling)" : ""}.`,
    );
  }
  const cur = ES_YEARS[0];
  const prev = ES_YEARS[1];
  const wk = cur?.weeks.at(-1);
  if (cur && wk) {
    const ly = prev?.weeks[cur.weeks.length - 1];
    const yoy = pctOf(wk.commitment, ly?.commitment);
    out.push(
      `USDA export sales for the week to ${dayMonth(wk.week)}: net upland sales of ${us(wk.netSales)} bales and shipments of ${us(wk.exports)} bales; ${cur.year} commitments total ${(wk.commitment / 1e6).toFixed(2)} million bales${yoy != null ? `, ${pct(yoy)} vs last year` : ""}.`,
    );
  }
  return out.length ? out.join(" ") : null;
}

/* ---------------- production benchmarks ---------------- */

function benchmarksCommentary(): string | null {
  const { sa, sb, rows } = benchmarkRows();
  const ours = rows[0];
  if (ours.b == null) return null;
  const others = rows.filter((r) => r.kind !== "ours" && r.kind !== "avg" && r.b != null);
  const avg = rows.find((r) => r.kind === "avg");
  const usda = rows.find((r) => r.kind === "usda");
  const diff = (v: number) => `${v - ours.b! >= 0 ? "+" : "−"}${n1(Math.abs(v - ours.b!))}`;
  let text = `Agrolytix estimates India's ${sb} crop at ${n1(ours.b)} lakh bales${ours.a != null ? ` (${sa}: ${n1(ours.a)}, ${pct(pctOf(ours.b, ours.a)!)})` : ""}.`;
  if (usda?.b != null) text += ` USDA is at ${n1(usda.b)} lakh bales (${diff(usda.b)} vs ours).`;
  const trade = others.filter((r) => r.kind === "trade");
  if (trade.length) text += ` Trade estimates: ${list(trade.map((r) => `${r.source} ${n1(r.b!)}`))}${avg?.b != null ? `, averaging ${n1(avg.b)} (${diff(avg.b)} vs ours)` : ""}.`;
  if (others.length) {
    const vals = [ours.b, ...others.map((r) => r.b!)];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pos = ours.b <= lo ? "at the low end of" : ours.b >= hi ? "at the high end of" : "within";
    text += ` Estimates range from ${n1(lo)} to ${n1(hi)} lakh bales; our number sits ${pos} that range.`;
  }
  return text;
}

/* ---------------- entry point ---------------- */

/** the auto-written summary for a panel, or null when there's nothing to summarise */
export async function autoCommentary(section: AutoSection): Promise<string | null> {
  switch (section) {
    case "overviewWeather":
      return weatherCommentary(await loadCottonBelt());
    case "overview":
      return pricesCommentary();
    case "overviewSowing":
      return sowingCommentary();
    case "overviewProduction":
      return productionCommentary();
    case "overviewCci":
      return cciCommentary();
    case "overviewBalance":
      return balanceCommentary();
    case "overviewTradeBasis":
      return tradeBasisCommentary();
    case "overviewWasde":
      return wasdeCommentary();
    case "overviewCftc":
      return cftcCommentary();
    case "overviewBenchmarks":
      return benchmarksCommentary();
  }
}
