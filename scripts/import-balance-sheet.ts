/* Rebuilds the `balanceSheet` dataset (monthly + annual SND) from the operator workbook
   data/LATEST DASHBOARD.xlsx → sheet "Monthly" (one row per month since Oct 2007).
   SND seasons always run October → September.
   Run: npx tsx scripts/import-balance-sheet.ts            dry run: prints the annual table
        npx tsx scripts/import-balance-sheet.ts --write    saves to the live database  */
import { MongoClient } from "mongodb";
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const FILE = resolve(process.cwd(), "data/LATEST DASHBOARD.xlsx");
const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const CAL = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type MonthRow = {
  opening: number | null; crop: number | null; farmer_sell: number | null;
  cci_proc: number | null; cci_sell: number | null; stock_cci: number | null;
  imports: number | null; dom_cons: number | null; nonmill_cons: number | null;
  total_cons: number | null; exports: number | null; closing: number | null;
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const numOrNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? r3(v) : null);
const sum = (rows: MonthRow[], k: keyof MonthRow) => r3(rows.reduce((a, r) => a + (r[k] ?? 0), 0));

/** "2026/27" for any month from Oct 2026 to Sep 2027 */
const seasonOf = (y: number, m: number) => {
  const start = m >= 10 ? y : y - 1;
  return `${start}/${String(start + 1).slice(2)}`;
};

function parse() {
  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets["Monthly"];
  if (!ws) throw new Error(`sheet "Monthly" not found in ${FILE}`);
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

  const monthly: Record<string, Record<string, MonthRow>> = {};
  for (const r of rows.slice(1)) {
    if (typeof r[0] !== "number") continue; // blank / footer rows
    const d = XLSX.SSF.parse_date_code(r[0]);
    const season = seasonOf(d.y, d.m);
    (monthly[season] ??= {})[CAL[d.m - 1]] = {
      opening: numOrNull(r[1]),
      crop: numOrNull(r[2]),
      farmer_sell: numOrNull(r[3]),
      cci_proc: numOrNull(r[4]),
      cci_sell: numOrNull(r[5]),
      stock_cci: numOrNull(r[6]),
      imports: numOrNull(r[7]),
      dom_cons: numOrNull(r[8]),
      nonmill_cons: numOrNull(r[9]),
      total_cons: numOrNull(r[10]),
      exports: numOrNull(r[11]),
      closing: numOrNull(r[13]), // "Carry Out"
    };
  }

  // annual SND for every complete Oct–Sep season (same arithmetic as the workbook's annual view)
  const annual: Record<string, Record<string, number>> = {};
  for (const [season, block] of Object.entries(monthly)) {
    if (!MONTHS.every((m) => block[m])) continue;
    const ms = MONTHS.map((m) => block[m]);
    const opening = ms[0].opening ?? 0;
    const crop = ms[0].crop ?? 0;
    const imports = sum(ms, "imports");
    const totalSupply = r3(opening + crop + imports);
    const domCons = sum(ms, "total_cons");
    const exports = sum(ms, "exports");
    const totalDemand = r3(domCons + exports);
    const closing = ms[11].closing ?? 0;
    const govt = ms[11].stock_cci ?? 0;
    annual[season] = {
      opening_stocks: opening,
      crop_size: crop,
      farmer_selling: sum(ms, "farmer_sell"),
      imports,
      total_supply: totalSupply,
      msp_procurement: sum(ms, "cci_proc"),
      msp_auctions: sum(ms, "cci_sell"),
      stocks_govt: govt,
      domestic_cons: domCons,
      exports,
      total_demand: totalDemand,
      closing_stocks: closing,
      sur_free_mkt: totalDemand ? r3((closing - govt) / totalDemand) : 0,
      total_sur: totalDemand ? r3(closing / totalDemand) : 0,
    };
  }

  const seasons = Object.keys(monthly).sort();
  const annual_seasons = Object.keys(annual).sort().reverse(); // newest first
  return { monthly, seasons, months_order: MONTHS, annual, annual_seasons };
}

async function main() {
  const data = parse();
  console.log(`seasons ${data.seasons[0]} → ${data.seasons.at(-1)} · annual ${data.annual_seasons.length}`);
  const cols = ["opening_stocks", "crop_size", "imports", "total_supply", "domestic_cons", "exports", "total_demand", "closing_stocks", "total_sur"];
  console.log("season   " + cols.map((c) => c.slice(0, 9).padStart(10)).join(""));
  for (const s of data.annual_seasons.slice(0, 5)) {
    console.log(s.padEnd(9) + cols.map((c) => String(data.annual[s][c]).padStart(10)).join(""));
  }

  if (!process.argv.includes("--write")) {
    console.log("\n(dry run — add --write to save)");
    return;
  }
  const uri = process.env.DATABASE_URL ?? process.env.MONGODB_URI;
  if (!uri) throw new Error("Set DATABASE_URL in .env.local");
  const client = new MongoClient(uri);
  await client.connect();
  const coll = client.db(process.env.MONGODB_DB || "agro").collection("datasets");
  const now = Math.floor(Date.now() / 1000);
  await coll.updateOne(
    { _id: "balanceSheet" as any },
    { $set: { data, updatedAt: now, updatedBy: "import:LATEST DASHBOARD.xlsx" } },
  );
  await client.db(process.env.MONGODB_DB || "agro").collection("audit_log").insertOne({
    datasetKey: "balanceSheet", action: "import-xlsx", by: "import:LATEST DASHBOARD.xlsx", at: now,
  });
  console.log("✓ balanceSheet dataset updated");
  await client.close();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
