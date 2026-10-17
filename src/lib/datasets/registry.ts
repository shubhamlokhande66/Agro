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
  app?: "cotton" | "weather" | "sugar";
};

export const DATASETS: DatasetMeta[] = [
  { key: "groundReport", label: "Field Pulse", group: "Field Pulse", kind: "records",
    description: "Weekly field photos and crop notes per state — stage, condition, rainfall, commentary.",
    route: "/field-pulse" },
  { key: "prices", label: "Domestic Prices", group: "Markets", kind: "tree",
    description: "Cotton variety price series — annual averages + last month of daily quotes.",
    route: "/prices" },
  { key: "international", label: "International Prices", group: "Markets", kind: "tree",
    description: "ICE Cotton #2 and Brent crude series (annual / monthly / daily).",
    route: "/prices" },
  { key: "cotlook", label: "Cotlook A Index", group: "Markets", kind: "tree",
    description: "Cotlook A Index (¢/lb) — daily from Cotlook, monthly history from the World Bank; feeds Cotton Basis.",
    route: "/basis" },
  { key: "currency", label: "Currency", group: "Markets", kind: "tree",
    description: "USD/INR and USD/CNY series.",
    route: "/currency" },
  { key: "cci", label: "CCI Updates", group: "Markets", kind: "tree",
    description: "CCI procurement, OMSS sales, statewise and price history.",
    route: "/cci" },
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
  { key: "benchmarks", label: "Production Benchmarks", group: "Global", kind: "records",
    description: "Trade houses' India production estimates (COFCO, Cargill, LDC …) for the Benchmarks page, in lakh bales.",
    route: "/benchmarks" },
  { key: "cftc", label: "CFTC — Commitments of Traders", group: "Global", kind: "tree",
    description: "ICE Cotton No. 2 positions by trader group (Disaggregated COT) — synced weekly from the CFTC API.",
    route: "/cftc" },
  { key: "exportSales", label: "USDA Export Sales", group: "Global", kind: "tree",
    description: "US upland cotton weekly export sales (running bales) — synced from the USDA FAS Open Data API.",
    route: "/usda" },
  { key: "wasdeReports", label: "WASDE", group: "Global", kind: "tree",
    description: "USDA WASDE world cotton supply & use — one snapshot per monthly report, synced automatically from USDA.",
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
  // ── Sugar dashboard ──
  { key: "sugarPrices", label: "Sugar Prices (monthly)", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "Monthly ex-mill / wholesale prices (₹/qtl), ICE No.11, London No.5, USD/INR and molasses — one row per month.",
    route: "/sugar/prices" },
  { key: "sugarWholesale", label: "Wholesale Sugar Prices (Chinimandi)", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "Daily wholesale M-30 prices incl. GST (₹/quintal) in nine cities — synced every evening from chinimandi.com; older days can be added by hand.",
    route: "/sugar/prices" },
  { key: "sugarNcdex", label: "NCDEX Sugar Spot", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "NCDEX spot — Sugar S Kolhapur (₹/quintal) and Gur Muzaffarnagar (₹/40 kg as quoted), evening price — synced every day at 5 PM.",
    route: "/sugar/prices" },
  { key: "sugarCrushing", label: "Crushing Progress", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "Fortnightly cumulative sugar produced and mills operating per season, plus the latest state-wise position.",
    route: "/sugar/crushing" },
  { key: "sugarProduction", label: "Production by State", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "Season totals by state (lakh tonnes, after diversion) and sugar diverted to ethanol.",
    route: "/sugar/production" },
  { key: "sugarEthanol", label: "Ethanol Prices", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "OMC ethanol procurement price by feedstock (₹/litre) per ethanol supply year.",
    route: "/sugar/ethanol" },
  { key: "sugarCane", label: "Cane Area & FRP", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "Sugarcane area, FRP and UP state advised price per season.",
    route: "/sugar/cane" },
  { key: "sugarBalance", label: "Sugar Balance Sheet", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "Opening stock, production, diversion, imports, consumption and exports per season — net production, supply and closing stock are calculated.",
    route: "/sugar/balance-sheet" },
  { key: "sugarTrade", label: "Exports & Imports", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "Monthly exports per season, export quota, imports and export destinations.",
    route: "/sugar/trade" },
  { key: "sugarPolicy", label: "Policy & Quotas", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "Monthly domestic release quota, MSP of sugar and the policy snapshot table.",
    route: "/sugar/policy" },
  { key: "sugarRainfall", label: "Cane Belt Rainfall", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "Monthly rainfall % deviation from normal for the cane subdivisions.",
    route: "/sugar/weather" },
  { key: "sugarBrazil", label: "Brazil (UNICA)", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "Centre-South cumulative sugar production and sugar mix by fortnight, per season.",
    route: "/sugar/brazil" },
  { key: "sugarWorld", label: "World Sugar Balance", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "World production and consumption per season, and the main producers / exporters.",
    route: "/sugar/world" },
  { key: "sugarCftc", label: "CFTC Sugar No.11", group: "Sugar dashboard", kind: "records", app: "sugar",
    description: "Managed money net position in ICE Sugar No.11, one row per week.",
    route: "/sugar/cftc" },
];

export const DATASET_KEYS = DATASETS.map((d) => d.key);
export const datasetMeta = (key: string) => DATASETS.find((d) => d.key === key);
export const datasetApp = (key: string): "cotton" | "weather" | "sugar" => datasetMeta(key)?.app ?? "cotton";
/** the datasets one dashboard's admin area manages — the two admin areas are kept separate */
export const datasetsFor = (app: "cotton" | "weather" | "sugar") => DATASETS.filter((d) => (d.app ?? "cotton") === app);
export const COTTON_DATASETS = datasetsFor("cotton");
export const WEATHER_DATASETS = datasetsFor("weather");
export const SUGAR_DATASETS = datasetsFor("sugar");
