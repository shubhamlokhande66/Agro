/** Cumulative cotton arrivals by season (lakh bales) — loaded from the database. */

export type ArrivalsBlob = {
  weeks: string[];
  seasons: string[];
  values: Record<string, number[]>;
};

export let ARRIVAL_WEEKS: string[] = [];
export let ARRIVAL_SEASONS: string[] = [];
export let ARRIVALS: Record<string, number[]> = {};

export function __hydrateArrivals(b: ArrivalsBlob) {
  ARRIVAL_WEEKS = b.weeks ?? [];
  ARRIVALS = b.values ?? {};
  ARRIVAL_SEASONS = b.seasons?.length ? b.seasons : Object.keys(ARRIVALS);
}
