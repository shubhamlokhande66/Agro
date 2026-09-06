/** Cotton sowing progress (lakh ha) — loaded from the database. */

export type SowingSeries = { label: string; data: number[] };
export type SowingBlob = { weeks: string[]; series: SowingSeries[] };

export let SOWING_WEEKS: string[] = [];
export let SOWING_SERIES: SowingSeries[] = [];

export function __hydrateSowing(b: SowingBlob) {
  SOWING_WEEKS = b.weeks ?? [];
  SOWING_SERIES = b.series ?? [];
}
