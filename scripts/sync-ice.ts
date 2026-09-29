/* Pulls ICE Cotton No. 2 + ICE Brent settlements (most-active contracts) into the
   live `international` dataset — the same sync the morning cron runs
   (src/app/api/cron/ice-futures), for backfills / manual runs.
   Run: npm run sync:ice                        both, last ~3 months, merged into the stored series
        npm run sync:ice -- --span 3            ~2 years (ICE's maximum per contract)
        npm run sync:ice -- --only brent        just one product (cotton | brent)
        add --replace to drop that product's stored daily series and keep ICE's history only
        --monthly-from 2024-10   recompute monthly averages from ICE daily from that month on  */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  // import after dotenv so src/db sees DATABASE_URL
  const { syncIceFutures } = await import("../src/lib/server/iceFutures");

  const args = process.argv.slice(2);
  const opt = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  const span = Number(opt("--span")) || 1;
  const only = opt("--only") as "cotton" | "brent" | undefined;
  const replace = args.includes("--replace");
  const monthlyFrom = opt("--monthly-from");

  const report = await syncIceFutures({
    products: only ? [only] : ["cotton", "brent"],
    span,
    replace,
    monthlyFrom,
    by: "script:ice",
  });
  for (const [p, r] of Object.entries(report.products)) {
    console.log(`${p.padEnd(6)} ${r.contract}: ${r.fetched} settlements fetched, ${r.changed} added/updated`);
  }
  if (report.months.length) console.log(`monthly averages: ${report.months[0]} → ${report.months.at(-1)}`);
  console.log(report.saved ? "✓ international dataset updated" : "nothing new to save");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
