/* Creates the Weather dashboard's admin-editable datasets when they don't exist yet
   (never overwrites saved data):
   - monsoonImd       ← last IMD data in the weather cache, else seed/monsoon_imd.json
   - monsoonWeights   ← ported commodity weights / state mapping
   - monsoonPlanting  ← the curated Kharif snapshot
   - monsoonHistory   ← historical All-India departures
   - monsoonAlerts    ← empty
   Run: npx tsx scripts/seed-monsoon.ts  */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { getDb } = await import("../src/db");
  const { datasetMeta } = await import("../src/lib/datasets/registry");
  const { DEFAULT_HISTORY, DEFAULT_WEIGHTS, MONSOON_KEYS } = await import("../src/lib/monsoon/config");
  const { PLANTING_SNAPSHOT } = await import("../src/lib/server/monsoon/planting");

  const db = await getDb();
  const datasets = db.collection("datasets");

  // IMD: prefer what the weather cache already holds (it may be newer than the seed file)
  const cached = await db.collection("monsoon_cache").findOne<{ data: { subdivisions: any[] }; source: string; asOfDate: string | null }>({
    _id: "imd_subdivisions" as any,
  });
  const seed = JSON.parse(readFileSync(resolve(process.cwd(), "seed/monsoon_imd.json"), "utf8"));
  const imdSrc = cached ?? { data: { subdivisions: seed.subdivisions }, source: seed.source, asOfDate: seed.asOfDate };
  const imd = {
    asOfDate: imdSrc.asOfDate,
    source: imdSrc.source,
    subdivisions: imdSrc.data.subdivisions.map(({ name, zone, normalRainfall, departure }: any) => ({ name, zone, normalRainfall, departure })),
  };

  const blobs: Record<string, unknown> = {
    [MONSOON_KEYS.imd]: imd,
    [MONSOON_KEYS.weights]: DEFAULT_WEIGHTS,
    [MONSOON_KEYS.planting]: PLANTING_SNAPSHOT,
    [MONSOON_KEYS.history]: DEFAULT_HISTORY,
    [MONSOON_KEYS.alerts]: { items: [] },
  };

  const now = Math.floor(Date.now() / 1000);
  for (const [key, data] of Object.entries(blobs)) {
    const meta = datasetMeta(key)!;
    const res = await datasets.updateOne(
      { _id: key as any },
      { $setOnInsert: { kind: meta.kind, label: meta.label, data, updatedAt: now, updatedBy: "seed:monsoon" } },
      { upsert: true },
    );
    console.log(`${key.padEnd(16)} ${res.upsertedCount ? "✓ created" : "already exists — left untouched"}`);
  }
  if (cached) await db.collection("monsoon_cache").deleteOne({ _id: "imd_subdivisions" as any }); // now lives in monsoonImd
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
