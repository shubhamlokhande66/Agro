/**
 * The catalogue of every dashboard dataset. `key` is the DB primary key and the
 * API path segment. `kind` hints the admin editor; `label`/`group` drive the
 * admin navigation.
 */
export type DatasetKind = "grid" | "records" | "tree";

export type DatasetMeta = {
  key: string;
  label: string;
  group: string;
  kind: DatasetKind;
  description: string;
};

export const DATASETS: DatasetMeta[] = [
  { key: "prices", label: "Domestic Prices", group: "Markets", kind: "tree",
    description: "Cotton variety price series — annual averages + last month of daily quotes." },
  { key: "international", label: "International Prices", group: "Markets", kind: "tree",
    description: "ICE Cotton #2 and Brent crude series (annual / monthly / daily)." },
  { key: "currency", label: "Currency", group: "Markets", kind: "tree",
    description: "USD/INR and USD/CNY series." },
  { key: "cci", label: "CCI Updates", group: "Markets", kind: "tree",
    description: "CCI procurement, OMSS sales, statewise and price history." },
  { key: "news", label: "Market News", group: "Markets", kind: "records",
    description: "Curated headline feed." },
  { key: "arrivals", label: "Cotton Arrivals", group: "Fundamentals", kind: "grid",
    description: "Cumulative arrivals by season, weekly." },
  { key: "sowing", label: "Cotton Sowing", group: "Fundamentals", kind: "grid",
    description: "Weekly sowing progress by year." },
  { key: "production", label: "Domestic Production", group: "Fundamentals", kind: "tree",
    description: "State-wise Area / Yield / Production by season." },
  { key: "balanceSheet", label: "Balance Sheet", group: "Fundamentals", kind: "tree",
    description: "India supply & demand — monthly and annual." },
  { key: "trade", label: "Import & Export", group: "Fundamentals", kind: "tree",
    description: "Monthly import / export by season." },
  { key: "cop", label: "COP & ROI", group: "Fundamentals", kind: "tree",
    description: "Cost of production and returns by crop." },
  { key: "calendar", label: "Crop Calendar", group: "Fundamentals", kind: "records",
    description: "State-wise cotton phase timeline." },
  { key: "rainfall", label: "Weather & Rainfall", group: "Global", kind: "tree",
    description: "IMD subdivision rainfall for the cotton belt." },
  { key: "wasde", label: "WASDE", group: "Global", kind: "tree",
    description: "USDA world cotton balance by country." },
];

export const DATASET_KEYS = DATASETS.map((d) => d.key);
export const datasetMeta = (key: string) => DATASETS.find((d) => d.key === key);
