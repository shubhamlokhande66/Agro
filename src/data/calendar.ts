/** India cotton crop calendar — loaded from the database. */

export type Phase = { key: string; start: number; end: number };
export type CropState = {
  name: string;
  flag: string;
  color: string;
  area: string;
  variety: string;
  season: string;
  sowPeak: string;
  harvPeak: string;
  notes: string;
  phases: Phase[];
};

export type CalendarBlob = {
  months: string[];
  phaseMeta: Record<string, { label: string; color: string }>;
  states: CropState[];
};

export let CAL_MONTHS: string[] = [];
export let PHASE_META: Record<string, { label: string; color: string }> = {};
export let CROP_STATES: CropState[] = [];

export function __hydrateCalendar(b: CalendarBlob) {
  CAL_MONTHS = b.months ?? [];
  PHASE_META = b.phaseMeta ?? {};
  CROP_STATES = b.states ?? [];
}

/** 0-indexed month position (May = 0) for today, or -1 outside the season */
export function currentMonthIdx(now = new Date()): number {
  const map: Record<number, number> = { 4: 0, 5: 1, 6: 2, 7: 3, 8: 4, 9: 5, 10: 6, 11: 7, 0: 8, 1: 9 };
  return map[now.getMonth()] ?? -1;
}
