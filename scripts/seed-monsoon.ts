/* Seeds the Weather dashboard's IMD subdivision data from seed/monsoon_imd.json when the
   live store is empty (it never overwrites newer data from the daily IMD refresh).
   Run: npx tsx scripts/seed-monsoon.ts  */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { getCached, setCached } = await import("../src/lib/server/monsoon/cache");
  const { IMD_CACHE_KEY } = await import("../src/lib/server/monsoon/imd");
  const seed = JSON.parse(readFileSync(resolve(process.cwd(), "seed/monsoon_imd.json"), "utf8"));
  const existing = await getCached(IMD_CACHE_KEY);
  if (existing) {
    console.log(`already has IMD data (as of ${existing.asOfDate}) — left untouched`);
  } else {
    await setCached(IMD_CACHE_KEY, { subdivisions: seed.subdivisions }, seed.source, seed.asOfDate);
    console.log(`✓ seeded ${seed.subdivisions.length} subdivisions (as of ${seed.asOfDate})`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
