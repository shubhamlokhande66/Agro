/**
 * Admin-editable Weather-dashboard datasets (stored in the shared `datasets` collection,
 * edited in Admin → "Weather dashboard"). Each has a default built from the ported
 * constants, used until an admin saves a version.
 */
import {
  CENTRAL_INDIA_SUBDIVISIONS,
  COMMODITY_WEIGHTS,
  DEFAULT_EXCLUSIONS,
  HISTORICAL_MONSOON_DEPARTURES,
  LPA_NORMALS,
  STATE_SUBDIVISIONS,
  SUBDIVISION_ZONES,
  type Subdivision,
} from "./constants";

export const MONSOON_KEYS = {
  imd: "monsoonImd",
  weights: "monsoonWeights",
  planting: "monsoonPlanting",
  history: "monsoonHistory",
  alerts: "monsoonAlerts",
} as const;

/* ── IMD subdivision rainfall ── */
export type ImdRow = { name: string; zone: string; normalRainfall: number; departure: number };
export type ImdBlob = { asOfDate: string | null; source: string; subdivisions: ImdRow[] };

/** stored rows → full subdivisions (actual mm is derived from the % departure, as IMD reports it) */
export const toSubdivisions = (b: ImdBlob | null | undefined): Subdivision[] =>
  (b?.subdivisions ?? [])
    .filter((r) => r?.name && typeof r.departure === "number")
    .map((r) => {
      const normal = typeof r.normalRainfall === "number" && r.normalRainfall > 0 ? r.normalRainfall : LPA_NORMALS[r.name] ?? 800;
      return {
        name: r.name,
        zone: r.zone || SUBDIVISION_ZONES[r.name] || "Unknown",
        normalRainfall: normal,
        actualRainfall: Math.round(normal * (1 + r.departure / 100)),
        departure: r.departure,
      };
    });

/* ── commodity weights & regional mapping ── */
export type WeightRow = { commodity: string; state: string; weight: number }; // weight in %
export type StateRow = { state: string; subdivisions: string }; // comma-separated
export type WeightsBlob = { weights: WeightRow[]; states: StateRow[]; exclusions: string[]; centralIndia: string[] };

export const DEFAULT_WEIGHTS: WeightsBlob = {
  weights: Object.entries(COMMODITY_WEIGHTS).flatMap(([commodity, ws]) =>
    ws.map((w) => ({ commodity, state: w.state, weight: Math.round(w.weight * 100) })),
  ),
  states: Object.entries(STATE_SUBDIVISIONS).map(([state, subs]) => ({ state, subdivisions: subs.join(", ") })),
  exclusions: [...DEFAULT_EXCLUSIONS],
  centralIndia: [...CENTRAL_INDIA_SUBDIVISIONS],
};

export type RegionalConfig = {
  commodityWeights: Record<string, { state: string; weight: number }[]>;
  stateSubdivisions: Record<string, string[]>;
  exclusions: string[];
  centralIndia: string[];
};

export function toRegionalConfig(b: WeightsBlob | null | undefined): RegionalConfig {
  const src = b?.weights?.length ? b : DEFAULT_WEIGHTS;
  const commodityWeights: RegionalConfig["commodityWeights"] = {};
  for (const w of src.weights ?? []) {
    if (!w?.commodity || !w.state || typeof w.weight !== "number") continue;
    (commodityWeights[w.commodity] ??= []).push({ state: w.state, weight: w.weight / 100 });
  }
  const stateSubdivisions: RegionalConfig["stateSubdivisions"] = {};
  for (const s of (b?.states?.length ? b.states : DEFAULT_WEIGHTS.states) ?? []) {
    if (s?.state) stateSubdivisions[s.state] = String(s.subdivisions ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  }
  return {
    commodityWeights,
    stateSubdivisions,
    exclusions: b?.exclusions ?? DEFAULT_WEIGHTS.exclusions,
    centralIndia: b?.centralIndia?.length ? b.centralIndia : DEFAULT_WEIGHTS.centralIndia,
  };
}

/* ── historical all-India monsoon ── */
export type HistoryBlob = { years: { year: number; departure: number }[] };
export const DEFAULT_HISTORY: HistoryBlob = {
  years: Object.entries(HISTORICAL_MONSOON_DEPARTURES).map(([y, d]) => ({ year: Number(y), departure: d })),
};
export const toHistory = (b: HistoryBlob | null | undefined): Record<number, number> =>
  Object.fromEntries(
    (b?.years?.length ? b.years : DEFAULT_HISTORY.years)
      .filter((r) => typeof r?.year === "number" && typeof r.departure === "number")
      .map((r) => [r.year, r.departure]),
  );

/* ── admin weather alerts (pinned on Weather Reports) ── */
export type AlertRow = { date: string; title: string; summary: string; severity: "Alert" | "Warning" | "Watch" | "Normal" };
export type AlertsBlob = { items: AlertRow[] };
