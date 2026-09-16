/** Global time-period filter shared by Overview / Prices / Currency (the "1W/1M/6M/1Y/5Y"
 *  control from the dashboard requirements doc). Windows a labelled series by calendar time
 *  and recomputes its delta from the START of the window — distinct from each page's own
 *  finer-grained per-chart filters (Currency's period tabs, Prices' per-card period), which
 *  keep governing their own chart independently. */

import { pctChange } from "./format";

export type GlobalPeriod = "1w" | "1m" | "6m" | "1y" | "5y";

export const GLOBAL_PERIOD_OPTS: { value: GlobalPeriod; label: string }[] = [
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "5y", label: "5Y" },
];

const PERIOD_DAYS: Record<GlobalPeriod, number> = {
  "1w": 7,
  "1m": 31,
  "6m": 186,
  "1y": 366,
  "5y": 366 * 5,
};

const MONTH_ABBR: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Parses the handful of label formats used across the app's data series:
 *  "YYYY-MM-DD" (ISO daily), "DD/MM/YY" (ICE daily), "YYYY-MM" (monthly),
 *  "Mon-YY" e.g. "Jan-20" (currency monthly/1y/5y), "YYYY" (annual — too coarse to
 *  window meaningfully, returned as Jan 1 of that year). Returns null if unrecognized. */
export function parseLabelDate(label: string | number): number | null {
  const s = String(label);
  let m: RegExpMatchArray | null;

  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    return new Date(+m[1], +m[2] - 1, +m[3]).getTime();
  }
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/))) {
    const y = +m[3];
    return new Date(y < 100 ? 2000 + y : y, +m[2] - 1, +m[1]).getTime();
  }
  if ((m = s.match(/^(\d{4})-(\d{2})$/))) {
    return new Date(+m[1], +m[2] - 1, 1).getTime();
  }
  if ((m = s.match(/^([A-Za-z]{3})-(\d{2,4})$/))) {
    const mo = MONTH_ABBR[m[1].toLowerCase()];
    if (mo == null) return null;
    const y = +m[2];
    return new Date(y < 100 ? 2000 + y : y, mo, 1).getTime();
  }
  if ((m = s.match(/^(\d{4})$/))) {
    return new Date(+m[1], 0, 1).getTime();
  }
  return null;
}

/** Windows {labels, values} to the last `days` calendar days ending at the latest parseable
 *  label. No-ops (returns everything unchanged) if labels aren't in a recognized date format,
 *  so callers degrade safely on any series that isn't actually date-labelled. The building
 *  block behind `sliceByPeriod` — exported for callers with a finer-grained period set than
 *  `GlobalPeriod` (e.g. Currency's chart-specific Weekly/Monthly/3M/6M/1Y/5Y filter). */
export function sliceByDays<V>(
  labels: (string | number)[],
  values: V[],
  days: number,
): { labels: (string | number)[]; values: V[] } {
  if (labels.length === 0) return { labels, values };
  const dates = labels.map(parseLabelDate);
  const latest = [...dates].reverse().find((d) => d != null) as number | undefined;
  if (latest == null) return { labels, values };

  const cutoff = latest - days * 86400000;
  const startIdx = dates.findIndex((d) => d != null && d >= cutoff);
  if (startIdx <= 0) return { labels, values };
  return { labels: labels.slice(startIdx), values: values.slice(startIdx) };
}

/** Windows {labels, values} to the calendar-time period ending at the latest parseable label. */
export function sliceByPeriod<V>(
  labels: (string | number)[],
  values: V[],
  period: GlobalPeriod,
): { labels: (string | number)[]; values: V[] } {
  return sliceByDays(labels, values, PERIOD_DAYS[period]);
}

export type PeriodDelta = { now: number | null; then: number | null; pct: number | null };

/** % change from the first point inside the window to the latest point — "delta against the
 *  start of the selected period", per the requirements doc, not day-over-day. */
export function deltaOverPeriod(
  labels: (string | number)[],
  values: (number | null)[],
  period: GlobalPeriod,
): PeriodDelta {
  const sliced = sliceByPeriod(labels, values, period);
  const now = sliced.values.at(-1) ?? null;
  const then = sliced.values.find((v) => v != null) ?? null;
  return { now, then, pct: pctChange(now, then) };
}
