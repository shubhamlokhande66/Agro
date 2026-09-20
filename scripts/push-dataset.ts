/* One-off: pushes a single seed/<key>.json into the live `datasets` collection, without
   touching any other dataset (unlike a full `npm run db:seed`, which also re-derives
   arrivals/sowing/production from the operator Excel workbooks).
   Run: npx tsx scripts/push-dataset.ts <key>  */
import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { datasetMeta } from "../src/lib/datasets/registry";

config({ path: ".env.local" });
config();

const uri = process.env.DATABASE_URL ?? process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "agro";
const key = process.argv[2];

if (!uri) {
  console.error("Set DATABASE_URL (MongoDB connection string) in .env.local");
  process.exit(1);
}
if (!key) {
  console.error("Usage: npx tsx scripts/push-dataset.ts <key>");
  process.exit(1);
}

async function main() {
  const meta = datasetMeta(key);
  if (!meta) throw new Error(`"${key}" not found in dataset registry`);

  const data = JSON.parse(readFileSync(resolve(process.cwd(), `seed/${key}.json`), "utf8"));

  const client = new MongoClient(uri!);
  await client.connect();
  const now = Math.floor(Date.now() / 1000);

  await client.db(dbName).collection("datasets").updateOne(
    { _id: key as any },
    { $set: { kind: meta.kind, label: meta.label, data, updatedAt: now, updatedBy: `seed:${key}` } },
    { upsert: true },
  );

  console.log(`✓ ${key} pushed to ${dbName}.datasets (updatedAt=${now})`);
  await client.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
