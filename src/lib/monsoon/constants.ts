/**
 * Reference data for the Weather (monsoon) dashboard — ported from the operator's
 * "Monsoon 2026 — Rainfall Risk Monitor" app. Shared by server fetchers and client pages.
 */

/** the 36 IMD meteorological subdivisions */
export const IMD_SUBDIVISIONS = [
  "Andaman & Nicobar Islands",
  "Arunachal Pradesh",
  "Assam & Meghalaya",
  "Bihar",
  "Chhattisgarh",
  "Coastal Andhra Pradesh",
  "Coastal Karnataka",
  "East Madhya Pradesh",
  "East Rajasthan",
  "East Uttar Pradesh",
  "Gangetic West Bengal",
  "Gujarat Region",
  "Haryana-Chandigarh-Delhi",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Kerala",
  "Konkan & Goa",
  "Lakshadweep",
  "Madhya Maharashtra",
  "Marathwada",
  "Nagaland-Manipur-Mizoram-Tripura",
  "North Interior Karnataka",
  "Orissa",
  "Punjab",
  "Rayalaseema",
  "Saurashtra-Kutch",
  "South Interior Karnataka",
  "Sub-Himalayan West Bengal & Sikkim",
  "Tamil Nadu & Pondicherry",
  "Telangana",
  "Uttarakhand",
  "Vidarbha",
  "West Madhya Pradesh",
  "West Rajasthan",
  "West Uttar Pradesh",
] as const;

export const SUBDIVISION_ZONES: Record<string, string> = {
  "Andaman & Nicobar Islands": "Islands",
  "Arunachal Pradesh": "Northeast",
  "Assam & Meghalaya": "Northeast",
  Bihar: "East",
  Chhattisgarh: "Central",
  "Coastal Andhra Pradesh": "South Peninsula",
  "Coastal Karnataka": "South Peninsula",
  "East Madhya Pradesh": "Central",
  "East Rajasthan": "Northwest",
  "East Uttar Pradesh": "Central",
  "Gangetic West Bengal": "East",
  "Gujarat Region": "West",
  "Haryana-Chandigarh-Delhi": "Northwest",
  "Himachal Pradesh": "Northwest",
  "Jammu & Kashmir": "Northwest",
  Jharkhand: "East",
  Kerala: "South Peninsula",
  "Konkan & Goa": "West",
  Lakshadweep: "Islands",
  "Madhya Maharashtra": "West",
  Marathwada: "Central",
  "Nagaland-Manipur-Mizoram-Tripura": "Northeast",
  "North Interior Karnataka": "South Peninsula",
  Orissa: "East",
  Punjab: "Northwest",
  Rayalaseema: "South Peninsula",
  "Saurashtra-Kutch": "West",
  "South Interior Karnataka": "South Peninsula",
  "Sub-Himalayan West Bengal & Sikkim": "East",
  "Tamil Nadu & Pondicherry": "South Peninsula",
  Telangana: "South Peninsula",
  Uttarakhand: "Northwest",
  Vidarbha: "Central",
  "West Madhya Pradesh": "Central",
  "West Rajasthan": "Northwest",
  "West Uttar Pradesh": "Central",
};

/** Long Period Average Jun–Sep normals (mm) — the weight for all-India / regional aggregates */
export const LPA_NORMALS: Record<string, number> = {
  "Andaman & Nicobar Islands": 1440,
  "Arunachal Pradesh": 1560,
  "Assam & Meghalaya": 1640,
  Bihar: 1005,
  Chhattisgarh: 1120,
  "Coastal Andhra Pradesh": 490,
  "Coastal Karnataka": 2880,
  "East Madhya Pradesh": 1050,
  "East Rajasthan": 620,
  "East Uttar Pradesh": 900,
  "Gangetic West Bengal": 1200,
  "Gujarat Region": 1050,
  "Haryana-Chandigarh-Delhi": 490,
  "Himachal Pradesh": 810,
  "Jammu & Kashmir": 570,
  Jharkhand: 1050,
  Kerala: 2050,
  "Konkan & Goa": 2710,
  Lakshadweep: 1190,
  "Madhya Maharashtra": 710,
  Marathwada: 630,
  "Nagaland-Manipur-Mizoram-Tripura": 1430,
  "North Interior Karnataka": 510,
  Orissa: 1170,
  Punjab: 500,
  Rayalaseema: 390,
  "Saurashtra-Kutch": 470,
  "South Interior Karnataka": 660,
  "Sub-Himalayan West Bengal & Sikkim": 2270,
  "Tamil Nadu & Pondicherry": 310,
  Telangana: 730,
  Uttarakhand: 1170,
  Vidarbha: 880,
  "West Madhya Pradesh": 870,
  "West Rajasthan": 250,
  "West Uttar Pradesh": 770,
};

/** state → subdivisions used for commodity weighting */
export const STATE_SUBDIVISIONS: Record<string, string[]> = {
  "Madhya Pradesh": ["West Madhya Pradesh", "East Madhya Pradesh"],
  Maharashtra: ["Madhya Maharashtra", "Marathwada", "Vidarbha"], // Konkan & Goa excluded by default
  Rajasthan: ["East Rajasthan", "West Rajasthan"],
  Gujarat: ["Gujarat Region", "Saurashtra-Kutch"],
  Telangana: ["Telangana"],
  Punjab: ["Punjab"],
  Haryana: ["Haryana-Chandigarh-Delhi"],
  "Andhra Pradesh": ["Coastal Andhra Pradesh", "Rayalaseema"],
  "Tamil Nadu": ["Tamil Nadu & Pondicherry"],
  Karnataka: ["North Interior Karnataka", "Coastal Karnataka"], // South Interior excluded by default
  "West Bengal": ["Gangetic West Bengal", "Sub-Himalayan West Bengal & Sikkim"],
  "Uttar Pradesh": ["West Uttar Pradesh", "East Uttar Pradesh"],
  Odisha: ["Orissa"],
  Bihar: ["Bihar"],
};

/** commodity production weights (share of national production) */
export const COMMODITY_WEIGHTS: Record<string, { state: string; weight: number }[]> = {
  Soybean: [
    { state: "Madhya Pradesh", weight: 0.52 },
    { state: "Maharashtra", weight: 0.32 },
    { state: "Rajasthan", weight: 0.1 },
  ],
  Cotton: [
    { state: "Gujarat", weight: 0.28 },
    { state: "Maharashtra", weight: 0.22 },
    { state: "Telangana", weight: 0.17 },
    { state: "Punjab", weight: 0.1 },
    { state: "Haryana", weight: 0.08 },
    { state: "Rajasthan", weight: 0.08 },
    { state: "Karnataka", weight: 0.07 },
  ],
  Groundnut: [
    { state: "Gujarat", weight: 0.35 },
    { state: "Rajasthan", weight: 0.22 },
    { state: "Andhra Pradesh", weight: 0.15 },
    { state: "Tamil Nadu", weight: 0.1 },
    { state: "Karnataka", weight: 0.1 },
    { state: "Maharashtra", weight: 0.08 },
  ],
  "Rice Bran": [
    { state: "West Bengal", weight: 0.2 },
    { state: "Uttar Pradesh", weight: 0.18 },
    { state: "Punjab", weight: 0.16 },
    { state: "Andhra Pradesh", weight: 0.12 },
    { state: "Odisha", weight: 0.1 },
    { state: "Bihar", weight: 0.1 },
    { state: "Tamil Nadu", weight: 0.07 },
    { state: "Haryana", weight: 0.07 },
  ],
};

export const DEFAULT_EXCLUSIONS = ["Konkan & Goa", "South Interior Karnataka"];

/** the central-India crop belt */
export const CENTRAL_INDIA_SUBDIVISIONS = [
  "West Madhya Pradesh",
  "East Madhya Pradesh",
  "Madhya Maharashtra",
  "Marathwada",
  "Vidarbha",
  "Chhattisgarh",
];

export const NINO_THRESHOLDS = { EL_NINO: 0.5, LA_NINA: -0.5 } as const;
/** IMD: a subdivision is deficient below −19% departure */
export const DEFICIENT_BELOW = -19;

/** All-India monsoon departures (% from LPA) — static historical record */
export const HISTORICAL_MONSOON_DEPARTURES: Record<number, number> = {
  1950: -5, 1951: 11, 1952: -4, 1953: 6, 1954: 14, 1955: 13, 1956: 14, 1957: -5,
  1958: 3, 1959: 5, 1960: 1, 1961: 12, 1962: -4, 1963: -2, 1964: 8, 1965: -18,
  1966: -5, 1967: 2, 1968: -4, 1969: 2, 1970: 6, 1971: 2, 1972: -24, 1973: 1,
  1974: 3, 1975: 6, 1976: -7, 1977: 0, 1978: 7, 1979: -16, 1980: 6, 1981: 3,
  1982: -14, 1983: 10, 1984: 3, 1985: -2, 1986: -13, 1987: -19, 1988: 20, 1989: 2,
  1990: 5, 1991: -2, 1992: -5, 1993: 2, 1994: 10, 1995: 0, 1996: 3, 1997: 2,
  1998: 2, 1999: 2, 2000: -8, 2001: -7, 2002: -19, 2003: 2, 2004: -13, 2005: 0,
  2006: -1, 2007: 6, 2008: -2, 2009: -22, 2010: 2, 2011: -3, 2012: -7, 2013: 6,
  2014: -12, 2015: -14, 2016: -3, 2017: -5, 2018: -9, 2019: 10, 2020: 9, 2021: 1,
  2022: 6, 2023: -6, 2024: 8, 2025: 0,
};

export type Subdivision = {
  name: string;
  zone: string;
  normalRainfall: number;
  actualRainfall: number;
  departure: number;
};

/** normal-weighted average departure — equals IMD's aggregate headline (Σ Nᵢ·dᵢ / Σ Nᵢ) */
export function weightedDeparture(subs: Subdivision[]): number | null {
  let w = 0;
  let wd = 0;
  for (const s of subs) {
    const n = s.normalRainfall > 0 ? s.normalRainfall : 1;
    w += n;
    wd += n * s.departure;
  }
  return w > 0 ? wd / w : null;
}
