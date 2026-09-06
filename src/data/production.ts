/** State-wise Area / Yield / Production — loaded from the database. */

type DpBlock = Record<string, Record<string, number>>;
export type DpData = {
  area: DpBlock;
  yield: DpBlock;
  prod: DpBlock;
  seasons: string[];
  states: string[];
  stateLabels: Record<string, string>;
};

const EMPTY: DpData = {
  area: {}, yield: {}, prod: {}, seasons: [], states: [], stateLabels: {},
};

export let DP_DATA: DpData = EMPTY;
export let DP_SEASONS: string[] = [];
export let DP_STATES: string[] = [];
export let DP_STATE_LABELS: Record<string, string> = {};

export function __hydrateProduction(b: DpData) {
  DP_DATA = { ...EMPTY, ...b };
  DP_SEASONS = DP_DATA.seasons ?? [];
  DP_STATES = DP_DATA.states ?? [];
  DP_STATE_LABELS = DP_DATA.stateLabels ?? {};
}

export type DpMetric = "area" | "yield" | "prod";

export const DP_REGIONS: Record<string, string[]> = {
  NORTH: ["PUNJAB", "HARYANA", "RAJASTHAN"],
  WEST: ["GUJARAT", "MAHARASHTRA", "MP"],
  SOUTH: ["TELANGANA", "KARNATAKA", "AP", "TNADU"],
  OTHER: ["OTHERS"],
};

export const DP_REGION_OF: Record<string, keyof typeof DP_REGIONS> = Object.fromEntries(
  Object.entries(DP_REGIONS).flatMap(([r, list]) =>
    list.map((s) => [s, r as keyof typeof DP_REGIONS]),
  ),
);

export const DP_REGION_TINT: Record<string, string> = {
  NORTH: "#dbeafe",
  WEST: "#ede9fe",
  SOUTH: "#dcfce7",
  OTHER: "#fef3c7",
};

export const DP_GROUPS: Record<string, string[]> = {
  all: [...DP_REGIONS.NORTH, ...DP_REGIONS.WEST, ...DP_REGIONS.SOUTH, ...DP_REGIONS.OTHER],
  north: DP_REGIONS.NORTH,
  west: DP_REGIONS.WEST,
  south: DP_REGIONS.SOUTH,
};

export function dpValue(metric: DpMetric, season: string, state: string): number | null {
  const v = (DP_DATA as any)[metric]?.[season]?.[state];
  return typeof v === "number" ? v : null;
}
