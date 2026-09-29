/**
 * The catalogue of every dashboard dataset. `key` is the DB primary key and the
 * API path segment. `kind` hints the admin editor; `label`/`group` drive the
 * admin navigation. `route` is the live page this dataset feeds (for the
 * "view live page" link in the admin editor).
 */
export type DatasetKind = "grid" | "records" | "tree";

export type DatasetMeta = {
  key: string;
  label: string;
  group: string;
  kind: DatasetKind;
  description: string;
  route: string;
  /** which dashboard's admin area edits it (missing = cotton) */
  app?: "cotton" | "weather";
};

export const DATASETS: DatasetMeta[] = [
  { key: "prices", label: "Domestic Prices", group: "Markets", kind: "tree",
    description: "Cotton variety price series — annual averages + last month of daily quotes.",
    route: "/prices" },
  { key: "international", label: "International Prices", group: "Markets", kind: "tree",
    description: "ICE Cotton #2 and Brent crude series (annual / monthly / daily).",
    route: "/prices" },
  { key: "currency", label: "Currency", group: "Markets", kind: "tree",
    description: "USD/INR and USD/CNY series.",
    route: "/currency" },
  { key: "cci", label: "CCI Updates", group: "Markets", kind: "tree",
    description: "CCI procurement, OMSS sales, statewise and price history.",
    route: "/cci" },
  { key: "news", label: "Market News", group: "Markets", kind: "records",
    description: "Curated headline feed.",
    route: "/news" },
  { key: "arrivals", label: "Cotton Arrivals", group: "Fundamentals", kind: "grid",
    description: "Cumulative arrivals by season, weekly.",
    route: "/arrivals" },
  { key: "sowing", label: "Cotton Sowing", group: "Fundamentals", kind: "grid",
    description: "Weekly sowing progress by year.",
    route: "/sowing" },
  { key: "production", label: "Domestic Production", group: "Fundamentals", kind: "tree",
    description: "State-wise Area / Yield / Production by season.",
    route: "/production" },
  { key: "balanceSheet", label: "Balance Sheet", group: "Fundamentals", kind: "tree",
    description: "India supply & demand — monthly and annual.",
    route: "/balance-sheet" },
  { key: "importParity", label: "Import Parity", group: "Fundamentals", kind: "tree",
    description: "Duty / freight / insurance inputs for the landed-cost vs domestic parity calc.",
    route: "/balance-sheet" },
  { key: "trade", label: "Import & Export", group: "Fundamentals", kind: "tree",
    description: "Monthly import / export by season.",
    route: "/trade" },
  { key: "cop", label: "COP & ROI", group: "Fundamentals", kind: "tree",
    description: "Cost of production and returns by crop.",
    route: "/cop-roi" },
  { key: "calendar", label: "Crop Calendar", group: "Fundamentals", kind: "records",
    description: "State-wise cotton phase timeline.",
    route: "/calendar" },
  { key: "rainfall", label: "Weather & Rainfall", group: "Global", kind: "tree",
    description: "IMD subdivision rainfall for the cotton belt.",
    route: "/weather" },
  { key: "wasde", label: "WASDE", group: "Global", kind: "tree",
    description: "USDA world cotton balance by country.",
    route: "/wasde" },
  // ── Weather (monsoon) dashboard ──
  { key: "monsoonImd", label: "IMD Subdivision Rainfall", group: "Weather dashboard", kind: "records", app: "weather",
    description: "Cumulative % departure for the 36 IMD subdivisions — auto-updated nightly from the IMD bulletin; correct or fill in here.",
    route: "/monsoon/deficit" },
  { key: "monsoonWeights", label: "Commodity Weights & Regions", group: "Weather dashboard", kind: "records", app: "weather",
    description: "Crop production shares by state, state → subdivision mapping, exclusions and the central-India belt.",
    route: "/monsoon/regional" },
  { key: "monsoonPlanting", label: "Kharif Planting Progress", group: "Weather dashboard", kind: "records", app: "weather",
    description: "Area sown by crop (lakh ha) vs normal and last year.",
    route: "/monsoon/planting" },
  { key: "monsoonHistory", label: "Historical Monsoon", group: "Weather dashboard", kind: "records", app: "weather",
    description: "All-India monsoon departure by year (ENSO deep-dive heatmap).",
    route: "/monsoon/enso" },
  { key: "monsoonAlerts", label: "Weather Alerts", group: "Weather dashboard", kind: "records", app: "weather",
    description: "Your own alerts / notes, pinned above IMD's press releases on Weather Reports.",
    route: "/monsoon/weather" },
];

export const DATASET_KEYS = DATASETS.map((d) => d.key);
export const datasetMeta = (key: string) => DATASETS.find((d) => d.key === key);
export const datasetApp = (key: string): "cotton" | "weather" => datasetMeta(key)?.app ?? "cotton";
/** the datasets one dashboard's admin area manages — the two admin areas are kept separate */
export const datasetsFor = (app: "cotton" | "weather") => DATASETS.filter((d) => (d.app ?? "cotton") === app);
export const COTTON_DATASETS = datasetsFor("cotton");
export const WEATHER_DATASETS = datasetsFor("weather");
