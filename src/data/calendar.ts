/** India cotton crop calendar — state-wise phase timeline (ported from legacy STATES / PHASE_META). */

export const CAL_MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

export const PHASE_META: Record<string, { label: string; color: string }> = {
  land: { label: "Land Preparation", color: "#78716c" },
  sow: { label: "Sowing", color: "#16a34a" },
  veg: { label: "Vegetative Growth", color: "#047857" },
  sq: { label: "Squaring", color: "#7c3aed" },
  boll: { label: "Boll Development", color: "#d97706" },
  harv: { label: "Harvesting", color: "#dc2626" },
  "2nd": { label: "2nd Picking", color: "#7f1d1d" },
  msp: { label: "MSP / Market Sales", color: "#0369a1" },
};

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

const p = (key: string, start: number, end: number): Phase => ({ key, start, end });

export const CROP_STATES: CropState[] = [
  {
    name: "Gujarat", flag: "🌿", color: "#0369a1", area: "~28 Lakh Ha",
    variety: "Bt Cotton Hybrid", season: "May–Feb", sowPeak: "Jun–Jul", harvPeak: "Nov–Jan",
    notes: "Largest cotton producing state. Drip irrigation prevalent. Saurashtra & N. Gujarat key zones.",
    phases: [p("land", 0, 0.5), p("sow", 0.5, 2), p("veg", 2, 4), p("sq", 4, 5.5), p("boll", 5.5, 7), p("harv", 7, 9), p("msp", 6, 9)],
  },
  {
    name: "Maharashtra", flag: "🏔️", color: "#7c3aed", area: "~42 Lakh Ha",
    variety: "Bt Cotton Hybrid", season: "Jun–Feb", sowPeak: "Jun–Jul", harvPeak: "Oct–Jan",
    notes: "Largest area under cotton. Vidarbha & Marathwada key zones. Rain-fed dominant.",
    phases: [p("land", 0.5, 1), p("sow", 1, 2.5), p("veg", 2.5, 4.5), p("sq", 4.5, 6), p("boll", 6, 7.5), p("harv", 5, 9), p("2nd", 7, 9)],
  },
  {
    name: "Telangana", flag: "🌾", color: "#059669", area: "~18 Lakh Ha",
    variety: "Bt Cotton Hybrid", season: "Jun–Jan", sowPeak: "Jun–Jul", harvPeak: "Oct–Dec",
    notes: "Andhra & Telangana cotton belt. Krishna & Godavari delta zones. High-yield varieties.",
    phases: [p("land", 0.5, 1), p("sow", 1, 2), p("veg", 2, 4), p("sq", 4, 5), p("boll", 5, 6.5), p("harv", 5, 8), p("msp", 5, 8)],
  },
  {
    name: "Madhya Pradesh", flag: "🌱", color: "#d97706", area: "~6 Lakh Ha",
    variety: "Bt Cotton Hybrid", season: "May–Jan", sowPeak: "May–Jun", harvPeak: "Oct–Dec",
    notes: "Malwa plateau key zone. Early sowing due to semi-arid climate. Nimad belt prominent.",
    phases: [p("land", 0, 0.5), p("sow", 0.5, 1.5), p("veg", 1.5, 3.5), p("sq", 3.5, 5), p("boll", 5, 6.5), p("harv", 5, 8)],
  },
  {
    name: "Karnataka", flag: "🏞️", color: "#0891b2", area: "~5 Lakh Ha",
    variety: "Bt Cotton Hybrid", season: "Jun–Feb", sowPeak: "Jun–Jul", harvPeak: "Nov–Jan",
    notes: "Northern Karnataka — Dharwad, Haveri, Gadag districts. Long-duration varieties.",
    phases: [p("land", 0.5, 1), p("sow", 1, 2.5), p("veg", 2.5, 5), p("sq", 5, 6.5), p("boll", 6.5, 7.5), p("harv", 6, 9), p("2nd", 7.5, 9)],
  },
  {
    name: "Rajasthan", flag: "🏜️", color: "#dc2626", area: "~4 Lakh Ha",
    variety: "Desi + Bt Hybrid", season: "May–Dec", sowPeak: "May–Jun", harvPeak: "Sep–Nov",
    notes: "Sriganganagar & Hanumangarh districts. Irrigated belt. Early sowing, early harvest.",
    phases: [p("land", 0, 0.5), p("sow", 0.5, 1.5), p("veg", 1.5, 3), p("sq", 3, 4), p("boll", 4, 5), p("harv", 4, 7), p("msp", 5, 7)],
  },
  {
    name: "Punjab", flag: "🌻", color: "#9333ea", area: "~3 Lakh Ha",
    variety: "Desi + Bt Hybrid", season: "May–Nov", sowPeak: "May–Jun", harvPeak: "Sep–Oct",
    notes: "Malwa region. Canal-irrigated. Among the highest yields in India. Early-medium varieties.",
    phases: [p("land", 0, 0.5), p("sow", 0.5, 1.5), p("veg", 1.5, 3), p("sq", 3, 4), p("boll", 4, 5.5), p("harv", 4, 6), p("msp", 4.5, 6.5)],
  },
  {
    name: "Haryana", flag: "🌿", color: "#065f46", area: "~7 Lakh Ha",
    variety: "Desi + Bt Hybrid", season: "May–Nov", sowPeak: "May–Jun", harvPeak: "Sep–Oct",
    notes: "Sirsa, Hisar, Fatehabad districts. Canal irrigation. Parallel to Punjab cropping pattern.",
    phases: [p("land", 0, 0.5), p("sow", 0.5, 1.5), p("veg", 1.5, 3), p("sq", 3, 4), p("boll", 4, 5.5), p("harv", 4, 6), p("msp", 4.5, 6.5)],
  },
  {
    name: "Andhra Pradesh", flag: "🌊", color: "#0e7490", area: "~6 Lakh Ha",
    variety: "Bt Cotton Hybrid", season: "Jun–Jan", sowPeak: "Jun–Jul", harvPeak: "Oct–Dec",
    notes: "Guntur, Kurnool, Krishna districts. Krishna delta cotton. High-density planting.",
    phases: [p("land", 0.5, 1), p("sow", 1, 2), p("veg", 2, 4), p("sq", 4, 5), p("boll", 5, 6.5), p("harv", 5, 8), p("msp", 5, 7.5)],
  },
];

/** 0-indexed month position (May = 0) for today, or -1 outside the season */
export function currentMonthIdx(now = new Date()): number {
  const map: Record<number, number> = { 4: 0, 5: 1, 6: 2, 7: 3, 8: 4, 9: 5, 10: 6, 11: 7, 0: 8, 1: 9 };
  return map[now.getMonth()] ?? -1;
}
