/* Seeds the `datasets` MongoDB collection from seed/*.json, with the operator
   Excel workbooks in /data overriding arrivals / sowing / production.
   Run: npm run db:seed  */
import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { DATASETS } from "../src/lib/datasets/registry";
import { parseArrivals, parseSowing, parseProduction } from "./parse-excel";

config({ path: ".env.local" });
config();

const uri = process.env.DATABASE_URL ?? process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "agro";
if (!uri) {
  console.error("Set DATABASE_URL (MongoDB connection string) in .env.local");
  process.exit(1);
}

const SEED_DIR = resolve(process.cwd(), "seed");
const loadSeed = (key: string) => {
  const p = resolve(SEED_DIR, `${key}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
};

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection("datasets");

  const excelArrivals = parseArrivals();
  const excelSowing = parseSowing();
  const excelProduction = parseProduction();

  const now = Math.floor(Date.now() / 1000);
  let n = 0;

  for (const meta of DATASETS) {
    let blob = loadSeed(meta.key);

    if (meta.key === "arrivals" && excelArrivals) {
      blob = excelArrivals;
      console.log(`  arrivals ← Excel (${excelArrivals.weeks.length} weeks, ${excelArrivals.seasons.length} seasons)`);
    }
    if (meta.key === "sowing" && excelSowing) {
      blob = excelSowing;
      console.log(`  sowing ← Excel (${excelSowing.weeks.length} weeks, ${excelSowing.series.length} series)`);
    }
    if (meta.key === "production" && excelProduction) {
      blob = excelProduction;
      console.log(`  production ← Excel (${excelProduction.seasons.length} seasons)`);
    }

    if (blob == null) {
      console.warn(`  ! no seed for ${meta.key}, skipping`);
      continue;
    }

    await col.updateOne(
      { _id: meta.key as any },
      {
        $set: {
          kind: meta.kind,
          label: meta.label,
          data: blob,
          updatedAt: now,
          updatedBy: "seed",
        },
      },
      { upsert: true },
    );
    n++;
    console.log(`  ✓ ${meta.key}`);
  }

  console.log(`\nSeeded ${n} datasets into ${dbName}`);
  await client.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
