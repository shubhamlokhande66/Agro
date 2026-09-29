/**
 * Kharif sowing progress (lakh ha) by crop — the original app's curated DA&FW snapshot.
 * The ministry sites (UPAg / agricoop) block programmatic access, so this is reference
 * data rather than a live feed; the page labels it with its as-on date.
 */

export type PlantingRow = {
  crop: string;
  category: string;
  normal: number;
  thisYear: number;
  lastYear: number;
  difference: number;
  pctChange: number;
};

export const PLANTING_SNAPSHOT: { asOnDate: string; source: string; rows: PlantingRow[] } = {
  asOnDate: "2025-08-22",
  source: "DA&FW curated snapshot (Kharif 2025)",
  rows: [
    { crop: "Soybean", category: "Oilseeds", normal: 123.5, thisYear: 128.4, lastYear: 119.2, difference: 9.2, pctChange: 7.7 },
    { crop: "Groundnut", category: "Oilseeds", normal: 47.2, thisYear: 44.8, lastYear: 46.1, difference: -1.3, pctChange: -2.8 },
    { crop: "Sesamum", category: "Oilseeds", normal: 15.8, thisYear: 14.6, lastYear: 15.2, difference: -0.6, pctChange: -3.9 },
    { crop: "Castor", category: "Oilseeds", normal: 8.5, thisYear: 8.1, lastYear: 8.3, difference: -0.2, pctChange: -2.4 },
    { crop: "Sunflower", category: "Oilseeds", normal: 3.2, thisYear: 2.8, lastYear: 3.0, difference: -0.2, pctChange: -6.7 },
    { crop: "Niger", category: "Oilseeds", normal: 2.8, thisYear: 2.5, lastYear: 2.7, difference: -0.2, pctChange: -7.4 },
    { crop: "Tur (Arhar)", category: "Pulses", normal: 45.2, thisYear: 43.6, lastYear: 44.8, difference: -1.2, pctChange: -2.7 },
    { crop: "Moong", category: "Pulses", normal: 34.5, thisYear: 36.8, lastYear: 33.2, difference: 3.6, pctChange: 10.8 },
    { crop: "Urad", category: "Pulses", normal: 27.8, thisYear: 29.1, lastYear: 26.5, difference: 2.6, pctChange: 9.8 },
    { crop: "Rice", category: "Cereals", normal: 398.0, thisYear: 405.2, lastYear: 392.5, difference: 12.7, pctChange: 3.2 },
    { crop: "Jowar", category: "Cereals", normal: 17.5, thisYear: 16.2, lastYear: 17.0, difference: -0.8, pctChange: -4.7 },
    { crop: "Bajra", category: "Cereals", normal: 72.0, thisYear: 69.5, lastYear: 71.2, difference: -1.7, pctChange: -2.4 },
    { crop: "Maize", category: "Cereals", normal: 82.0, thisYear: 85.3, lastYear: 80.8, difference: 4.5, pctChange: 5.6 },
    { crop: "Ragi", category: "Cereals", normal: 10.5, thisYear: 9.8, lastYear: 10.2, difference: -0.4, pctChange: -3.9 },
    { crop: "Cotton", category: "Cash Crops", normal: 130.2, thisYear: 126.8, lastYear: 128.5, difference: -1.7, pctChange: -1.3 },
    { crop: "Sugarcane", category: "Cash Crops", normal: 55.5, thisYear: 57.2, lastYear: 54.8, difference: 2.4, pctChange: 4.4 },
    { crop: "Jute & Mesta", category: "Cash Crops", normal: 7.8, thisYear: 7.2, lastYear: 7.5, difference: -0.3, pctChange: -4.0 },
  ],
};
