/** Field Pulse, the weekly ground report — field photographs and crop notes per cotton state, loaded from the
 *  database. Photos live in their own collection (see /api/ground/images); a report only holds
 *  their ids. */

export type GroundPhoto = { id: string; caption: string; location: string };

export type StateReport = {
  /** production-table state code, e.g. "GUJARAT" */
  state: string;
  stage: string;
  condition: string;
  rainfall: string;
  commentary: string;
  photos: GroundPhoto[];
};

export type GroundReport = {
  id: string;
  /** report date "YYYY-MM-DD"; the report covers that date's Monday–Sunday week */
  date: string;
  title: string;
  /** key takeaways, one per line */
  summary: string;
  author: string;
  states: StateReport[];
};

export type GroundReportBlob = { reports: GroundReport[] };

/** the cotton states covered — the production table's major states (not MP, Tamil Nadu, Others, All India) */
export const GROUND_STATES: { code: string; label: string }[] = [
  { code: "GUJARAT", label: "Gujarat" },
  { code: "MAHARASHTRA", label: "Maharashtra" },
  { code: "TELANGANA", label: "Telangana" },
  { code: "RAJASTHAN", label: "Rajasthan" },
  { code: "KARNATAKA", label: "Karnataka" },
  { code: "HARYANA", label: "Haryana" },
  { code: "AP", label: "Andhra Pradesh" },
  { code: "PUNJAB", label: "Punjab" },
];

export const CROP_STAGES = [
  "Pre-sowing",
  "Sowing",
  "Germination",
  "Vegetative growth",
  "Square formation",
  "Flowering",
  "Boll formation",
  "Boll bursting",
  "First picking",
  "Picking",
  "Last picking",
  "Harvest complete",
] as const;

export type Tone = "pos" | "warn" | "neg" | "info" | "flat";

export const CONDITIONS: { value: string; tone: Tone }[] = [
  { value: "Excellent", tone: "pos" },
  { value: "Good", tone: "pos" },
  { value: "Average", tone: "warn" },
  { value: "Stressed", tone: "neg" },
  { value: "Poor", tone: "neg" },
];

export const RAINFALL: { value: string; tone: Tone }[] = [
  { value: "Excess", tone: "info" },
  { value: "Normal", tone: "pos" },
  { value: "Deficient", tone: "warn" },
  { value: "Dry spell", tone: "neg" },
  { value: "No rain needed", tone: "flat" },
];

export const toneOf = (list: { value: string; tone: Tone }[], v: string): Tone =>
  list.find((x) => x.value === v)?.tone ?? "flat";

export const imageUrl = (id: string) => `/api/ground/images/${id}`;

/** Monday and Sunday of the week containing `date` ("YYYY-MM-DD") */
export function reportWeek(date: string): { from: string; to: string } {
  const t = Date.parse(date + "T00:00:00Z");
  const monday = t - ((new Date(t).getUTCDay() + 6) % 7) * 86400000;
  const iso = (x: number) => new Date(x).toISOString().slice(0, 10);
  return { from: iso(monday), to: iso(monday + 6 * 86400000) };
}

export let GROUND_REPORTS: GroundReport[] = [];

export function __hydrateGroundReport(b: GroundReportBlob) {
  GROUND_REPORTS = (Array.isArray(b?.reports) ? b.reports : [])
    .filter((r) => r && typeof r.date === "string")
    .map((r) => ({ ...r, states: Array.isArray(r.states) ? r.states : [] }))
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first
}
